import type {
  IModuleLoader,
  IModuleManifestParser,
  IModuleManifestValidator,
  IStructuralEventPublisher,
  ModuleCompatibility,
  ModuleDependency,
  ModuleDependencyResolutionResult,
  ModuleDescriptor,
  ModuleDiscoveryResult,
  ModuleLifecycleState,
  ModuleLoadingResult,
  ModuleManifest,
  ModuleManifestValidationIssue,
  ModuleManifestValidationResult,
  ModuleSystemSnapshot,
  ModuleVersion
} from "@veltryx/contracts";

import { KernelModuleDiscovery } from "./module-system/discovery/module-discovery.js";
import { KernelModuleDescriptor } from "./module-system/discovery/module-descriptor.js";
import { KernelModuleDiscoveryValidator } from "./module-system/discovery/discovery-validator.js";
import { KernelModuleDependencyResolver } from "./module-system/resolver/dependency-resolver.js";
import { KernelResolvedModuleLoader } from "./module-system/loader/module-loader.js";
import { ModuleSystemSnapshotService } from "./module-system/status/index.js";

const REQUIRED_STRING_FIELDS = ["id", "name", "version"] as const;
const REQUIRED_ARRAY_FIELDS = [
  "dependencies",
  "permissions",
  "routes",
  "metadata",
  "events",
  "providers",
  "components",
  "migrations",
  "seeds"
] as const;
const COMPATIBILITY_FIELDS = ["kernel", "runtime", "metadata"] as const;

export class KernelModuleVersion implements ModuleVersion {
  constructor(readonly value: string) {
    if (!isNonEmptyString(value)) {
      throw new Error("Module version must be a non-empty string");
    }
  }
}

export class KernelModuleManifestValidator implements IModuleManifestValidator {
  validate(candidate: unknown): ModuleManifestValidationResult {
    const issues: ModuleManifestValidationIssue[] = [];

    if (!isRecord(candidate)) {
      return {
        valid: false,
        issues: [{ field: "manifest", message: "manifest must be an object" }]
      };
    }

    for (const field of REQUIRED_STRING_FIELDS) {
      if (!isNonEmptyString(candidate[field])) {
        issues.push({ field, message: `${field} must be a non-empty string` });
      }
    }

    if (candidate["description"] !== undefined && typeof candidate["description"] !== "string") {
      issues.push({ field: "description", message: "description must be a string when provided" });
    }

    if (candidate["author"] !== undefined && typeof candidate["author"] !== "string") {
      issues.push({ field: "author", message: "author must be a string when provided" });
    }

    for (const field of REQUIRED_ARRAY_FIELDS) {
      if (!Array.isArray(candidate[field])) {
        issues.push({ field, message: `${field} must be an array` });
        continue;
      }

      if (field !== "dependencies") {
        validateStringArray(field, candidate[field], issues);
      }
    }

    validateCompatibility(candidate["compatibility"], issues);
    validateDependencies(candidate["dependencies"], issues);

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

export class KernelModuleManifestParser implements IModuleManifestParser {
  constructor(
    private readonly validator: IModuleManifestValidator = new KernelModuleManifestValidator()
  ) {}

  parse(candidate: unknown): ModuleManifest {
    const result = this.validate(candidate);

    if (!result.valid) {
      throw new Error(
        `Invalid module manifest: ${result.issues.map((issue) => issue.message).join("; ")}`
      );
    }

    return candidate as ModuleManifest;
  }

  validate(candidate: unknown): ModuleManifestValidationResult {
    return this.validator.validate(candidate);
  }

  parseVersion(version: unknown): ModuleVersion {
    if (!isNonEmptyString(version)) {
      throw new Error("Module version must be a non-empty string");
    }

    return new KernelModuleVersion(version);
  }
}

export class StubModuleManifestParser extends KernelModuleManifestParser {}

export class KernelModuleLoader implements IModuleLoader {
  private readonly modules = new Map<string, ModuleDescriptor>();
  private readonly discovery: KernelModuleDiscovery;
  private readonly resolver: KernelModuleDependencyResolver;
  private readonly loader: KernelResolvedModuleLoader;
  private discoveryResult: ModuleDiscoveryResult | undefined;
  private resolutionResult: ModuleDependencyResolutionResult | undefined;
  private loadingResult: ModuleLoadingResult | undefined;
  private pipelineExecuted = false;
  private pipelineExecution: Promise<void> | undefined;

  constructor(
    private readonly parser: IModuleManifestParser = new KernelModuleManifestParser(),
    private readonly structuralEvents?: IStructuralEventPublisher
  ) {
    this.discovery = new KernelModuleDiscovery(
      undefined,
      new KernelModuleDiscoveryValidator(this.parser),
      structuralEvents
    );
    this.resolver = new KernelModuleDependencyResolver(undefined, undefined, structuralEvents);
    this.loader = new KernelResolvedModuleLoader(undefined, undefined, undefined, structuralEvents);
  }

  async discover(): Promise<readonly ModuleDescriptor[]> {
    if (this.pipelineExecuted) {
      return [];
    }

    if (!this.pipelineExecution) {
      this.pipelineExecution = this.executePipeline();
    }

    await this.pipelineExecution;
    return [];
  }

  private async executePipeline(): Promise<void> {
    const staged = [...this.modules.values()];
    const result = this.discovery.discover(staged.map((descriptor) => descriptor.manifest));
    const stagedById = new Map(staged.map((descriptor) => [descriptor.manifest.id, descriptor]));
    const valid = result.valid.map((descriptor) => {
      const stagedDescriptor = stagedById.get(descriptor.manifest.id);
      return stagedDescriptor
        ? new KernelModuleDescriptor(descriptor.manifest, descriptor.state, stagedDescriptor.source)
        : descriptor;
    });

    this.discoveryResult = { ...result, valid };
    this.resolutionResult = this.resolver.resolve(valid);
    this.loadingResult = this.loader.load(this.resolutionResult);
    this.pipelineExecuted = true;
  }

  async register(manifest: ModuleManifest, source?: string): Promise<ModuleDescriptor> {
    if (this.pipelineExecuted || this.pipelineExecution) {
      throw new Error("Module registration is closed after pipeline execution");
    }

    const parsed = this.parser.parse(manifest);

    if (this.modules.has(parsed.id)) {
      throw new Error(`Module already registered: ${parsed.id}`);
    }

    const descriptor: ModuleDescriptor = {
      manifest: parsed,
      state: "discovered",
      source
    };

    this.modules.set(parsed.id, descriptor);
    return descriptor;
  }

  async validate(manifest: ModuleManifest): Promise<ModuleManifestValidationResult> {
    return this.parser.validate(manifest);
  }

  async resolveDependencies(): Promise<{ readonly order: readonly ModuleDescriptor[] }> {
    await this.discover();
    return { order: this.resolutionResult?.order ?? [] };
  }

  async transition(moduleId: string, state: ModuleLifecycleState): Promise<ModuleDescriptor> {
    const descriptor = this.modules.get(moduleId);

    if (!descriptor) {
      throw new Error(`Module not registered: ${moduleId}`);
    }

    const updated: ModuleDescriptor = {
      manifest: descriptor.manifest,
      state,
      source: descriptor.source
    };

    this.modules.set(moduleId, updated);
    return updated;
  }

  async list(): Promise<readonly ModuleDescriptor[]> {
    return [...this.modules.values()];
  }

  async snapshot(): Promise<ModuleSystemSnapshot> {
    return new ModuleSystemSnapshotService({
      modules: await this.list(),
      discoveryResult: this.discoveryResult,
      resolutionResult: this.resolutionResult,
      loadingResult: this.loadingResult,
      loadedModules: this.loader.getRegistry().list()
    }).snapshot();
  }
}

function validateCompatibility(candidate: unknown, issues: ModuleManifestValidationIssue[]): void {
  if (!isRecord(candidate)) {
    issues.push({ field: "compatibility", message: "compatibility must be an object" });
    return;
  }

  const compatibility = candidate as Partial<ModuleCompatibility>;

  for (const field of COMPATIBILITY_FIELDS) {
    if (compatibility[field] !== undefined && !isNonEmptyString(compatibility[field])) {
      issues.push({
        field: `compatibility.${field}`,
        message: `compatibility.${field} must be a non-empty string`
      });
    }
  }
}

function validateDependencies(candidate: unknown, issues: ModuleManifestValidationIssue[]): void {
  if (!Array.isArray(candidate)) {
    return;
  }

  candidate.forEach((dependency: unknown, index: number) => {
    if (!isRecord(dependency)) {
      issues.push({ field: `dependencies.${index}`, message: "dependency must be an object" });
      return;
    }

    const typedDependency = dependency as Partial<ModuleDependency>;

    if (!isNonEmptyString(typedDependency.id)) {
      issues.push({
        field: `dependencies.${index}.id`,
        message: "dependency id must be a non-empty string"
      });
    }

    if (typedDependency.version !== undefined && !isNonEmptyString(typedDependency.version)) {
      issues.push({
        field: `dependencies.${index}.version`,
        message: "dependency version must be a non-empty string"
      });
    }

    if (typedDependency.optional !== undefined && typeof typedDependency.optional !== "boolean") {
      issues.push({
        field: `dependencies.${index}.optional`,
        message: "dependency optional must be a boolean"
      });
    }
  });
}

function validateStringArray(
  field: string,
  candidate: unknown[],
  issues: ModuleManifestValidationIssue[]
): void {
  candidate.forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      issues.push({
        field: `${field}.${index}`,
        message: `${field} entries must be non-empty strings`
      });
    }
  });
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}

function isNonEmptyString(candidate: unknown): candidate is string {
  return typeof candidate === "string" && candidate.trim().length > 0;
}
