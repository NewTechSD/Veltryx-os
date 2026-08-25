import type { IExecutionContext } from "./context.js";

export type ServiceScope =
  "global" | "singleton" | "transient" | "scoped" | "request" | "tenant" | "workspace";
export type ServiceCategory =
  | "kernel"
  | "configuration"
  | "events"
  | "modules"
  | "metadata"
  | "runtime"
  | "execution"
  | "status"
  | "system";
export type ServiceLifecycle =
  "registered" | "available" | "unavailable" | "replaced" | "removed" | "error";
export type ServiceStatus = "ok" | "warning" | "error" | "unknown";
export type ServiceRegistryStatus = "ready" | "empty" | "partial" | "error";
export type ServiceRegistryDiagnosticSeverity = "info" | "warning" | "error";

export interface ServiceToken {
  readonly id: string;
  readonly version: string;
  readonly owner: string;
  readonly scope: ServiceScope;
  readonly description?: string;
}

export interface ServiceRegistryWarning {
  readonly code: string;
  readonly message: string;
  readonly token?: string;
  readonly source: string;
}

export interface ServiceRegistryError {
  readonly code: string;
  readonly message: string;
  readonly token?: string;
  readonly source: string;
}

export interface ServiceRegistryDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: ServiceRegistryDiagnosticSeverity;
  readonly token?: string;
  readonly source: string;
  readonly detail?: string;
}

export interface ServiceDescriptorInput {
  readonly name: string;
  readonly description?: string;
  readonly category: ServiceCategory;
  readonly lifecycle: ServiceLifecycle;
  readonly scope: ServiceScope;
  readonly status?: ServiceStatus;
  readonly source?: string;
  readonly version?: string;
  readonly tags?: readonly string[];
  readonly warnings?: readonly ServiceRegistryWarning[];
  readonly errors?: readonly ServiceRegistryError[];
  readonly diagnostics?: readonly ServiceRegistryDiagnosticEntry[];
}

export interface ServiceDescriptorSnapshot {
  readonly token: string;
  readonly name: string;
  readonly description?: string;
  readonly category: ServiceCategory;
  readonly lifecycle: ServiceLifecycle;
  readonly scope: ServiceScope;
  readonly status: ServiceStatus;
  readonly registeredAt: string;
  readonly source?: string;
  readonly version?: string;
  readonly tags: readonly string[];
  readonly warnings: readonly ServiceRegistryWarning[];
  readonly errors: readonly ServiceRegistryError[];
  readonly diagnostics: readonly ServiceRegistryDiagnosticEntry[];
}

export type ServiceDescriptor = ServiceDescriptorSnapshot;

export interface ServiceRegistrationOptions {
  readonly replace?: boolean;
}

export interface ServiceRegistrySnapshot {
  readonly status: ServiceRegistryStatus;
  readonly generatedAt: string;
  readonly servicesRegistered: number;
  readonly servicesAvailable: number;
  readonly servicesWithWarnings: number;
  readonly servicesWithErrors: number;
  readonly services: readonly ServiceDescriptorSnapshot[];
  readonly warnings: readonly ServiceRegistryWarning[];
  readonly errors: readonly ServiceRegistryError[];
  readonly diagnostics: readonly ServiceRegistryDiagnosticEntry[];
}

export interface ServiceProvider<TService = unknown> {
  readonly token: ServiceToken;
  readonly resolve: (context?: IExecutionContext) => Promise<TService> | TService;
}

export interface IServiceRegistry {
  register<TService>(provider: ServiceProvider<TService>): Promise<void>;
  register<TService>(
    token: ServiceToken | string,
    service: TService,
    descriptor: ServiceDescriptorInput,
    options?: ServiceRegistrationOptions
  ): Promise<void>;
  resolve<TService>(token: ServiceToken, context?: IExecutionContext): Promise<TService>;
  get<TService>(token: ServiceToken | string): TService | undefined;
  has(token: ServiceToken | string): boolean;
  list(): readonly ServiceToken[];
  remove(token: ServiceToken | string): boolean;
  snapshot(): ServiceRegistrySnapshot;
}
