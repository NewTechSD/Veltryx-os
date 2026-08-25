import type {
  DependencyInjectionDiagnosticEntry,
  DependencyInjectionError,
  DependencyInjectionSnapshot,
  DependencyInjectionWarning,
  IDependencyInjectionContainer,
  IServiceRegistry,
  ProviderDefinition,
  ProviderDescriptorSnapshot,
  ProviderRegistrationOptions,
  ServiceToken
} from "@veltryx/contracts";
import { CircularDependencyError } from "@veltryx/contracts";
import { serviceTokenId } from "../services/index.js";

interface ProviderRecord {
  readonly definition: ProviderDefinition;
  instance?: unknown;
  resolved: boolean;
  readonly warnings: DependencyInjectionWarning[];
  readonly errors: DependencyInjectionError[];
  readonly diagnostics: DependencyInjectionDiagnosticEntry[];
}

export class DependencyInjectionContainer implements IDependencyInjectionContainer {
  private readonly providers = new Map<string, ProviderRecord>();
  private readonly warnings: DependencyInjectionWarning[] = [];
  private readonly errors: DependencyInjectionError[] = [];
  private readonly diagnostics: DependencyInjectionDiagnosticEntry[] = [];

  constructor(
    private readonly registry?: IServiceRegistry,
    private readonly now: () => Date = () => new Date()
  ) {}

  registerProvider<T>(
    provider: ProviderDefinition<T>,
    options: ProviderRegistrationOptions = {}
  ): void {
    const id = serviceTokenId(provider.token);
    this.validate(provider);
    if (this.providers.has(id) && options.replace !== true)
      throw this.fail("PROVIDER_DUPLICATE", `Provider already registered: ${id}`, id);

    const definition = Object.freeze({
      ...provider,
      dependencies: Object.freeze([...(provider.dependencies ?? [])])
    }) as ProviderDefinition;
    const record: ProviderRecord = {
      definition,
      resolved: false,
      warnings: [],
      errors: [],
      diagnostics: []
    };
    if (this.providers.has(id)) {
      const warning = this.entry(
        "PROVIDER_REPLACED",
        "Provider was replaced through explicit authorization.",
        id
      );
      record.warnings.push(warning);
      this.warnings.push(warning);
    }
    this.providers.set(id, record);
    this.diagnostics.push({
      ...this.entry("PROVIDER_REGISTERED", "Provider registered.", id),
      severity: "info"
    });
  }

  async resolve<T>(token: ServiceToken | string): Promise<T> {
    return this.resolvePath<T>(serviceTokenId(token), []);
  }

  has(token: ServiceToken | string): boolean {
    return this.providers.has(serviceTokenId(token));
  }

  listProviders(): readonly ProviderDescriptorSnapshot[] {
    return Object.freeze(
      [...this.providers].map(([id, record]) => this.snapshotProvider(id, record))
    );
  }

  snapshot(): DependencyInjectionSnapshot {
    const providers = this.listProviders();
    const errors = Object.freeze([...this.errors]);
    const warnings = Object.freeze([...this.warnings]);
    const status =
      providers.length === 0
        ? "empty"
        : errors.length
          ? providers.some((provider) => provider.resolved)
            ? "partial"
            : "error"
          : "ready";
    return Object.freeze({
      status,
      generatedAt: this.now().toISOString(),
      providersRegistered: providers.length,
      providersResolved: providers.filter((provider) => provider.resolved).length,
      singletonProviders: providers.filter((provider) => provider.lifecycle === "singleton").length,
      transientProviders: providers.filter((provider) => provider.lifecycle === "transient").length,
      providersWithWarnings: providers.filter((provider) => provider.warnings.length > 0).length,
      providersWithErrors: providers.filter((provider) => provider.errors.length > 0).length,
      providers,
      warnings,
      errors,
      diagnostics: Object.freeze([...this.diagnostics])
    });
  }

  private async resolvePath<T>(id: string, path: readonly string[]): Promise<T> {
    if (path.includes(id)) {
      const cycle = Object.freeze([...path, id]);
      const error = new CircularDependencyError(cycle);
      this.recordError(id, "CIRCULAR_DEPENDENCY", error.message);
      throw error;
    }
    const record = this.providers.get(id);
    if (!record) throw this.fail("PROVIDER_NOT_FOUND", `Provider not registered: ${id}`, id);
    if (record.definition.lifecycle === "singleton" && record.resolved) return record.instance as T;
    try {
      const dependencies = await Promise.all(
        (record.definition.dependencies ?? []).map((dependency) =>
          this.resolvePath(serviceTokenId(dependency), [...path, id])
        )
      );
      const instance = await this.create(record.definition, dependencies);
      record.resolved = true;
      if (record.definition.lifecycle === "singleton") record.instance = instance;
      record.diagnostics.push({
        ...this.entry("PROVIDER_RESOLVED", "Provider resolved.", id),
        severity: "info"
      });
      if (this.registry && !this.registry.has(id) && record.definition.descriptor)
        await this.registry.register(id, instance, record.definition.descriptor);
      return instance as T;
    } catch (error) {
      if (!(error instanceof CircularDependencyError) && record.errors.length === 0)
        this.recordError(id, "PROVIDER_RESOLUTION_FAILED", `Provider resolution failed: ${id}`);
      throw error instanceof Error ? error : new Error(`Provider resolution failed: ${id}`);
    }
  }

  private async create(
    definition: ProviderDefinition,
    dependencies: readonly unknown[]
  ): Promise<unknown> {
    if (definition.kind === "value") return definition.useValue;
    if (definition.kind === "factory") return definition.useFactory!(...dependencies);
    return new definition.useClass!(...dependencies);
  }

  private validate(provider: ProviderDefinition): void {
    serviceTokenId(provider.token);
    if (!(["value", "factory", "class"] as const).includes(provider.kind))
      throw this.fail("PROVIDER_INVALID", "Provider kind is invalid.");
    if (!(["singleton", "transient"] as const).includes(provider.lifecycle))
      throw this.fail("PROVIDER_INVALID", "Provider lifecycle is invalid.");
    if (provider.kind === "value" && provider.useValue === undefined)
      throw this.fail("PROVIDER_INVALID", "Value provider requires useValue.");
    if (provider.kind === "factory" && typeof provider.useFactory !== "function")
      throw this.fail("PROVIDER_INVALID", "Factory provider requires useFactory.");
    if (provider.kind === "class" && typeof provider.useClass !== "function")
      throw this.fail("PROVIDER_INVALID", "Class provider requires useClass.");
  }

  private snapshotProvider(id: string, record: ProviderRecord): ProviderDescriptorSnapshot {
    const warnings = Object.freeze([...record.warnings]);
    const errors = Object.freeze([...record.errors]);
    return Object.freeze({
      token: id,
      kind: record.definition.kind,
      lifecycle: record.definition.lifecycle,
      dependencies: Object.freeze((record.definition.dependencies ?? []).map(serviceTokenId)),
      resolved: record.resolved,
      status: errors.length
        ? "error"
        : warnings.length
          ? "warning"
          : record.resolved
            ? "resolved"
            : "registered",
      warnings,
      errors,
      diagnostics: Object.freeze([...record.diagnostics])
    });
  }

  private entry(code: string, message: string, token?: string) {
    return Object.freeze({ code, message, token, source: "dependency-injection" as const });
  }

  private recordError(token: string, code: string, message: string): void {
    const entry = this.entry(code, message, token);
    this.errors.push(entry);
    const record = this.providers.get(token);
    if (record) {
      record.errors.push(entry);
      record.diagnostics.push({ ...entry, severity: "error" });
    }
  }

  private fail(code: string, message: string, token?: string): Error {
    this.errors.push(this.entry(code, message, token));
    return new Error(message);
  }
}
