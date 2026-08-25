import type { ServiceDescriptorInput, ServiceToken } from "./services.js";

export type ProviderKind = "value" | "factory" | "class";
export type ProviderLifecycle = "singleton" | "transient";
export type DependencyInjectionStatus = "empty" | "ready" | "partial" | "error";
export interface ProviderDefinition<T = unknown> {
  readonly token: ServiceToken | string;
  readonly kind: ProviderKind;
  readonly lifecycle: ProviderLifecycle;
  readonly dependencies?: readonly (ServiceToken | string)[];
  readonly useValue?: T;
  readonly useFactory?: (...dependencies: readonly unknown[]) => T | Promise<T>;
  readonly useClass?: new (...dependencies: readonly unknown[]) => T;
  readonly descriptor?: ServiceDescriptorInput;
}
export interface ProviderRegistrationOptions {
  readonly replace?: boolean;
}
export interface DependencyInjectionEntry {
  readonly code: string;
  readonly message: string;
  readonly token?: string;
  readonly source: "dependency-injection";
}
export interface DependencyInjectionDiagnosticEntry extends DependencyInjectionEntry {
  readonly severity: "info" | "warning" | "error";
}
export type DependencyInjectionWarning = DependencyInjectionEntry;
export type DependencyInjectionError = DependencyInjectionEntry;
export interface ProviderDescriptorSnapshot {
  readonly token: string;
  readonly kind: ProviderKind;
  readonly lifecycle: ProviderLifecycle;
  readonly dependencies: readonly string[];
  readonly resolved: boolean;
  readonly status: "registered" | "resolved" | "warning" | "error";
  readonly warnings: readonly DependencyInjectionWarning[];
  readonly errors: readonly DependencyInjectionError[];
  readonly diagnostics: readonly DependencyInjectionDiagnosticEntry[];
}
export interface DependencyInjectionSnapshot {
  readonly status: DependencyInjectionStatus;
  readonly generatedAt: string;
  readonly providersRegistered: number;
  readonly providersResolved: number;
  readonly singletonProviders: number;
  readonly transientProviders: number;
  readonly providersWithWarnings: number;
  readonly providersWithErrors: number;
  readonly providers: readonly ProviderDescriptorSnapshot[];
  readonly warnings: readonly DependencyInjectionWarning[];
  readonly errors: readonly DependencyInjectionError[];
  readonly diagnostics: readonly DependencyInjectionDiagnosticEntry[];
}
export interface IDependencyInjectionContainer {
  registerProvider<T>(provider: ProviderDefinition<T>, options?: ProviderRegistrationOptions): void;
  resolve<T>(token: ServiceToken | string): Promise<T>;
  has(token: ServiceToken | string): boolean;
  listProviders(): readonly ProviderDescriptorSnapshot[];
  snapshot(): DependencyInjectionSnapshot;
}
export interface IProviderResolver {
  resolve<T>(token: ServiceToken | string): Promise<T>;
}
export class CircularDependencyError extends Error {
  constructor(readonly path: readonly string[]) {
    super(`Circular dependency detected: ${path.join(" -> ")}`);
    this.name = "CircularDependencyError";
  }
}
