import type { IExecutionContext } from "./context.js";

export type ConfigurationScope =
  "global" | "environment" | "tenant" | "workspace" | "module" | "plugin" | "user";
export type VeltryxEnvironment = "development" | "test" | "preview" | "production";
export type RuntimeMode = "development" | "preview" | "production" | "test";
export type ConfigurationValue = string | boolean | number;
export type ConfigurationSourceType = "default" | "environment" | "in-memory";
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
}
