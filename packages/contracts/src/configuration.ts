import type { IExecutionContext } from "./context.js";

export type ConfigurationScope =
  "global" | "environment" | "tenant" | "workspace" | "module" | "plugin" | "user";
export type VeltryxEnvironment = "development" | "test" | "preview" | "production";
export type RuntimeMode = "development" | "preview" | "production" | "test";
export type ConfigurationValue = string | boolean | number;
export type ConfigurationSourceType = "default" | "environment" | "in-memory" | "persistence";
export type ConfigurationDiagnosticSeverity = "info" | "warning" | "error";

export const CONFIGURATION_KEYS = {
  appName: "app.name",
  appVersion: "app.version",
  environment: "environment",
  runtimeMode: "runtime.mode",
  debugEnabled: "debug.enabled",
  kernelStatusEnabled: "kernel.status.enabled",
  structuralEventsEnabled: "events.structural.enabled",
  moduleSnapshotEnabled: "modules.snapshot.enabled"
} as const;

export type ConfigurationKey = (typeof CONFIGURATION_KEYS)[keyof typeof CONFIGURATION_KEYS];
export type ConfigurationValues = Readonly<Partial<Record<ConfigurationKey, unknown>>>;
export interface ConfigurationQuery {
  readonly key: string;
  readonly scope?: ConfigurationScope;
  readonly context?: IExecutionContext;
}
export interface ConfigurationSourceSnapshot {
  readonly name: string;
  readonly type: ConfigurationSourceType;
  readonly loadedKeys: readonly ConfigurationKey[];
}
export interface ConfigurationWarning {
  readonly code: string;
  readonly message: string;
  readonly source: string;
  readonly key?: string;
}
export interface ConfigurationError {
  readonly code: string;
  readonly message: string;
  readonly source: string;
  readonly key?: string;
}
export interface ConfigurationDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: ConfigurationDiagnosticSeverity;
  readonly source: string;
  readonly key?: string;
}
export interface ConfigurationSnapshot {
  readonly generatedAt: string;
  readonly environment: VeltryxEnvironment;
  readonly appName: string;
  readonly appVersion: string;
  readonly runtimeMode: RuntimeMode;
  readonly debugEnabled: boolean;
  readonly sources: readonly ConfigurationSourceSnapshot[];
  readonly warnings: readonly ConfigurationWarning[];
  readonly errors: readonly ConfigurationError[];
  readonly diagnostics: readonly ConfigurationDiagnosticEntry[];
}
export interface IConfigurationSource {
  readonly name: string;
  readonly type: ConfigurationSourceType;
  load(): ConfigurationValues;
}
export interface ConfigurationValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly key?: string;
  readonly severity: "warning" | "error";
}
export interface ConfigurationValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ConfigurationValidationIssue[];
}
export interface IConfigurationValidator {
  isKnownKey(key: string): key is ConfigurationKey;
  validateValue(key: ConfigurationKey, value: unknown): ConfigurationValidationResult;
  validate(values: ConfigurationValues): ConfigurationValidationResult;
  validateNumber(value: unknown, key?: string): ConfigurationValidationResult;
}
export interface ConfigurationResolutionResult {
  readonly values: Readonly<Record<ConfigurationKey, ConfigurationValue>>;
  readonly sources: readonly ConfigurationSourceSnapshot[];
  readonly warnings: readonly ConfigurationWarning[];
  readonly errors: readonly ConfigurationError[];
  readonly diagnostics: readonly ConfigurationDiagnosticEntry[];
}
export interface IConfigurationResolver {
  resolve(sources: readonly IConfigurationSource[]): ConfigurationResolutionResult;
}
export interface IConfigurationProvider {
  get<TValue>(query: ConfigurationQuery): Promise<TValue | undefined>;
  get(key: string): unknown;
  getString(key: string): string | undefined;
  getBoolean(key: string): boolean | undefined;
  getNumber(key: string): number | undefined;
  has(key: string): boolean;
  snapshot(): ConfigurationSnapshot;
  applyPersistenceOverrides?(values: ConfigurationValues, options?: { readonly allowOverride?: boolean }): ConfigurationValidationResult;
}

export type ConfigurationPersistenceStatus = "ready" | "empty" | "warning" | "error";
export type ConfigurationPersistenceOperation = "persistConfiguration" | "persistKey" | "loadKey" | "listKeys" | "hydrateConfiguration";
export type ConfigurationPersistenceValue = import("./persistence.js").PersistenceValue;
export interface ConfigurationPersistenceEntry { readonly key: string; readonly value: ConfigurationPersistenceValue; readonly source: "persistence"; readonly persistedAt: string; readonly metadata?: { readonly persistedBy?: string; readonly reason?: string } }
export interface PersistConfigurationInput { readonly keys?: readonly ConfigurationKey[] }
export interface PersistConfigurationKeyInput { readonly key: string; readonly value: ConfigurationPersistenceValue; readonly metadata?: ConfigurationPersistenceEntry["metadata"] }
export interface LoadConfigurationKeyInput { readonly key: string }
export interface ListConfigurationKeysInput { readonly limit?: number; readonly offset?: number }
export interface HydrateConfigurationInput { readonly allowOverride?: boolean }
export interface ConfigurationHydrationResult { readonly keysHydrated: number; readonly conflicts: number; readonly invalidEntries: number; readonly blockedEntries: number }
export interface ConfigurationPersistenceResult<T = undefined> { readonly ok: boolean; readonly data?: T; readonly warnings: readonly ConfigurationWarning[]; readonly errors: readonly ConfigurationError[]; readonly diagnostics: readonly ConfigurationDiagnosticEntry[] }
export interface ConfigurationPersistenceSummary { readonly status: ConfigurationPersistenceStatus; readonly providerId: string; readonly providerKind: import("./persistence.js").PersistenceProviderKind; readonly keysPersisted: number; readonly keysHydrated: number; readonly warnings: number; readonly errors: number; readonly diagnostics: number }
export interface ConfigurationPersistenceSnapshot { readonly status: ConfigurationPersistenceStatus; readonly generatedAt: string; readonly provider: { readonly id: string; readonly kind: import("./persistence.js").PersistenceProviderKind }; readonly keysPersisted: number; readonly keysHydrated: number; readonly allowedKeys: readonly string[]; readonly blockedKeysCount: number; readonly warnings: readonly ConfigurationWarning[]; readonly errors: readonly ConfigurationError[]; readonly diagnostics: readonly ConfigurationDiagnosticEntry[] }
export interface IConfigurationPersistenceService {
  persistConfiguration(input?: PersistConfigurationInput): Promise<ConfigurationPersistenceResult<ConfigurationPersistenceSummary>>;
  persistKey(input: PersistConfigurationKeyInput): Promise<ConfigurationPersistenceResult<ConfigurationPersistenceEntry>>;
  loadKey(input: LoadConfigurationKeyInput): Promise<ConfigurationPersistenceResult<ConfigurationPersistenceEntry | null>>;
  listKeys(input?: ListConfigurationKeysInput): Promise<ConfigurationPersistenceResult<readonly ConfigurationPersistenceEntry[]>>;
  hydrateConfiguration(input?: HydrateConfigurationInput): Promise<ConfigurationPersistenceResult<ConfigurationHydrationResult>>;
  snapshot(): ConfigurationPersistenceSnapshot;
}
