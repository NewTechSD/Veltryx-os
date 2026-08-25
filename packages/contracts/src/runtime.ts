import type { IConfigurationProvider, RuntimeMode, VeltryxEnvironment } from "./configuration.js";
import type { IExecutionContext } from "./context.js";
import type { IModuleLoader } from "./modules.js";
import type { IServiceRegistry } from "./services.js";

export type RuntimeState =
  | "created"
  | "bootstrapped"
  | "initialized"
  | "ready"
  | "running"
  | "reloading"
  | "stopping"
  | "disposed";
export interface RuntimeBootstrapResult {
  readonly state: RuntimeState;
  readonly message: string;
  readonly session: RuntimeSession;
}
export interface RuntimeSession {
  readonly id: string;
  readonly state: RuntimeState;
  readonly context: IExecutionContext;
  readonly startedAt: Date;
}
export interface IRuntime {
  bootstrap(context: IExecutionContext): Promise<RuntimeBootstrapResult>;
  session(): RuntimeSession | undefined;
  state(): RuntimeState;
}
export type RuntimeLifecycleStatus =
  "idle" | "bootstrapping" | "ready" | "warning" | "error" | "stopped";
export interface RuntimeDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: "info" | "warning" | "error";
  readonly source: "runtime";
}
export type RuntimeWarning = Omit<RuntimeDiagnosticEntry, "severity">;
export type RuntimeError = Omit<RuntimeDiagnosticEntry, "severity">;
export interface RuntimeBootstrapStatus {
  readonly status: RuntimeLifecycleStatus;
  readonly bootstrappedAt?: string;
  readonly runtimeMode: RuntimeMode;
  readonly environment: VeltryxEnvironment;
  readonly servicesAvailable: number;
  readonly modulesAvailable: number;
  readonly warnings: readonly RuntimeWarning[];
  readonly errors: readonly RuntimeError[];
  readonly diagnostics: readonly RuntimeDiagnosticEntry[];
}
export interface RuntimeStructuralBootstrapResult {
  readonly status: RuntimeBootstrapStatus;
  readonly success: boolean;
}
export interface RuntimeBootstrapDependencies {
  readonly configuration: IConfigurationProvider;
  readonly services: IServiceRegistry;
  readonly modules: IModuleLoader;
}
export interface IRuntimeBootstrapService {
  bootstrap(): Promise<RuntimeStructuralBootstrapResult>;
  status(): RuntimeBootstrapStatus;
  stop(): void;
}
