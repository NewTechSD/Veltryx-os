import type {
  IModuleLoader,
  IModuleManifestParser,
  IModuleManifestValidator,
  IStructuralEventPublisher,
  ModuleCompatibility,
  ModuleDependency,
  ModuleDescriptor,
  ModuleLifecycleState,
  ModuleManifest,
  ModuleManifestValidationIssue,
  ModuleManifestValidationResult,
  ModuleSystemSnapshot,
  ModuleVersion
} from "@veltryx/contracts";

import {
  MODULE_SYSTEM_STRUCTURAL_EVENTS,
  normalizeStructuralEventError,
  publishStructuralEvent
} from "./core/events/index.js";
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
const MODULE_DISCOVERY_METADATA = { source: "module-system", tags: ["module", "discovery", "structural"] } as const;
const MODULE_RESOLUTION_METADATA = { source: "module-system", tags: ["module", "resolution", "structural"] } as const;

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

  constructor(
    private readonly parser: IModuleManifestParser = new KernelModuleManifestParser(),
    private readonly structuralEvents?: IStructuralEventPublisher
  ) {}

  async discover(): Promise<readonly ModuleDescriptor[]> {
    const startedAt = new Date();
    publishStructuralEvent(this.structuralEvents, {
      eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryStarted,
      eventType: "module",
      payload: {
        candidatesCount: 0,
        startedAt: startedAt.toISOString()
      },
      metadata: MODULE_DISCOVERY_METADATA,
      occurredAt: startedAt
    });

    try {
      const discovered: readonly ModuleDescriptor[] = [];
      const completedAt = new Date();
      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryCompleted,
        eventType: "module",
        payload: {
          candidatesCount: 0,
          validModules: discovered.length,
          invalidModules: 0,
          duplicatedModules: 0,
          completedAt: completedAt.toISOString()
        },
        metadata: MODULE_DISCOVERY_METADATA,
        occurredAt: completedAt
      });

      return discovered;
    } catch (error) {
      const failedAt = new Date();
      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryFailed,
        eventType: "module",
        payload: {
          failedAt: failedAt.toISOString(),
          error: normalizeStructuralEventError(error)
        },
        metadata: MODULE_DISCOVERY_METADATA,
        occurredAt: failedAt
      });

      throw error;
    }
  }

  async register(manifest: ModuleManifest, source?: string): Promise<ModuleDescriptor> {
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
    const modules = await this.list();
    const startedAt = new Date();
    publishStructuralEvent(this.structuralEvents, {
      eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionStarted,
      eventType: "module",
      payload: {
        modulesCount: modules.length,
        startedAt: startedAt.toISOString()
      },
      metadata: MODULE_RESOLUTION_METADATA,
      occurredAt: startedAt
    });

    try {
      const resolution = { order: modules };
      const completedAt = new Date();
      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionCompleted,
        eventType: "module",
        payload: {
          modulesCount: modules.length,
          resolvedModules: resolution.order.length,
          missingDependencies: 0,
          cyclesDetected: 0,
          completedAt: completedAt.toISOString()
        },
        metadata: MODULE_RESOLUTION_METADATA,
        occurredAt: completedAt
      });

      return resolution;
    } catch (error) {
      const failedAt = new Date();
      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionFailed,
        eventType: "module",
        payload: {
          failedAt: failedAt.toISOString(),
          error: normalizeStructuralEventError(error)
        },
        metadata: MODULE_RESOLUTION_METADATA,
        occurredAt: failedAt
      });

      throw error;
    }
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
      modules: await this.list()
    }).snapshot();
  }
}

function validateCompatibility(
  candidate: unknown,
  issues: ModuleManifestValidationIssue[]
): void {
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

function validateDependencies(
  candidate: unknown,
  issues: ModuleManifestValidationIssue[]
): void {
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
      issues.push({ field: `${field}.${index}`, message: `${field} entries must be non-empty strings` });
    }
  });
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}

function isNonEmptyString(candidate: unknown): candidate is string {
  return typeof candidate === "string" && candidate.trim().length > 0;
}


