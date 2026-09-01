import type {
  ConfigurationSnapshot,
  IConfigurationProvider,
  RuntimeMode,
  VeltryxEnvironment
} from "./configuration.js";
import type { ExecutionContextSnapshot, IExecutionContext } from "./context.js";
import type {
  DependencyInjectionSnapshot,
  IDependencyInjectionContainer
} from "./dependency-injection.js";
import type { ModuleSystemSnapshot } from "./module-system-status.js";
import type { IMetadataSnapshotService, MetadataEngineSnapshot } from "./metadata.js";
import type { ComponentRegistrySnapshot } from "./components.js";
import type { UICompositionSnapshot } from "./ui-composition.js";
import type { IModuleLoader } from "./modules.js";
import type { IServiceRegistry, ServiceRegistrySnapshot } from "./services.js";

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
  context(): RuntimeContext | undefined;
  snapshot(): RuntimeStatusSnapshot | undefined;
  status(): RuntimeLifecycleStatus;
}
export type RuntimeLifecycleStatus =
  "idle" | "bootstrapping" | "ready" | "warning" | "error" | "stopped";
export interface RuntimeDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: "info" | "warning" | "error";
  readonly source: "runtime";
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp?: string;
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
  readonly dependencyInjection?: IDependencyInjectionContainer;
  readonly metadata?: IMetadataSnapshotService;
  readonly componentRegistry?: { snapshot(): ComponentRegistrySnapshot };
  readonly uiComposition?: { snapshot(): UICompositionSnapshot };
}
export interface IRuntimeBootstrapService {
  bootstrap(execution?: ExecutionContextSnapshot): Promise<RuntimeStructuralBootstrapResult>;
  status(): RuntimeBootstrapStatus;
  context(): RuntimeContext | undefined;
  snapshot(): RuntimeStatusSnapshot | undefined;
  stop(): void;
}

export interface RuntimeConfigurationContext {
  readonly status: "ready" | "warning" | "error";
  readonly appName: string;
  readonly appVersion: string;
  readonly debugEnabled: boolean;
}
export interface RuntimeServicesContext {
  readonly status: string;
  readonly registered: number;
  readonly available: number;
  readonly withWarnings: number;
  readonly withErrors: number;
}
export interface RuntimeDependencyInjectionContext {
  readonly status: string;
  readonly providersRegistered: number;
  readonly providersResolved: number;
  readonly singletonProviders: number;
  readonly transientProviders: number;
  readonly providersWithWarnings: number;
  readonly providersWithErrors: number;
}
export interface RuntimeModulesContext {
  readonly status: string;
  readonly discovered: number;
  readonly resolved: number;
  readonly loaded: number;
  readonly withWarnings: number;
  readonly withErrors: number;
}
export interface RuntimeMetadataContext {
  readonly status: string;
  readonly namespacesRegistered: number;
  readonly resourcesRegistered: number;
  readonly entitiesRegistered: number;
  readonly pagesRegistered: number;
}
export interface RuntimeComponentRegistryContext {
  readonly status: string;
  readonly componentsRegistered: number;
}
export interface RuntimeUICompositionContext {
  readonly status: string;
  readonly compositionsGenerated: number;
}
export interface RuntimeExecutionContextSummary {
  readonly requestId: string;
  readonly correlationId: string;
  readonly tenantAvailable: boolean;
  readonly workspaceAvailable: boolean;
  readonly userAvailable: boolean;
}
export interface RuntimeContext {
  readonly runtimeId: string;
  readonly lifecycle: RuntimeLifecycleStatus;
  readonly environment: VeltryxEnvironment;
  readonly runtimeMode: RuntimeMode;
  readonly bootstrappedAt?: string;
  readonly generatedAt: string;
  readonly configuration: RuntimeConfigurationContext;
  readonly services: RuntimeServicesContext;
  readonly dependencyInjection: RuntimeDependencyInjectionContext;
  readonly modules: RuntimeModulesContext;
  readonly metadata: RuntimeMetadataContext;
  readonly componentRegistry?: RuntimeComponentRegistryContext;
  readonly uiComposition?: RuntimeUICompositionContext;
  readonly execution?: RuntimeExecutionContextSummary;
  readonly warnings: readonly RuntimeWarning[];
  readonly errors: readonly RuntimeError[];
  readonly diagnostics: readonly RuntimeDiagnosticEntry[];
}
export type RuntimeContextSnapshot = RuntimeContext;
export interface RuntimeStatusSnapshot {
  readonly status: RuntimeLifecycleStatus;
  readonly generatedAt: string;
  readonly runtimeId: string;
  readonly environment: VeltryxEnvironment;
  readonly runtimeMode: RuntimeMode;
  readonly bootstrappedAt?: string;
  readonly uptimeMs?: number;
  readonly configurationStatus: string;
  readonly serviceRegistryStatus: string;
  readonly dependencyInjectionStatus: string;
  readonly moduleSystemStatus: string;
  readonly metadataStatus: string;
  readonly metadataNamespacesRegistered: number;
  readonly metadataResourcesRegistered: number;
  readonly metadataEntitiesRegistered: number;
  readonly metadataPagesRegistered: number;
  readonly componentRegistryStatus?: string;
  readonly componentsRegistered?: number;
  readonly uiCompositionStatus?: string;
  readonly compositionsGenerated?: number;
  readonly servicesAvailable: number;
  readonly providersRegistered: number;
  readonly providersResolved: number;
  readonly modulesDiscovered: number;
  readonly modulesResolved: number;
  readonly modulesLoaded: number;
  readonly warnings: readonly RuntimeWarning[];
  readonly errors: readonly RuntimeError[];
  readonly diagnostics: readonly RuntimeDiagnosticEntry[];
}
export interface RuntimeContextFactoryInput {
  readonly runtimeId: string;
  readonly lifecycle: RuntimeLifecycleStatus;
  readonly configuration: ConfigurationSnapshot;
  readonly services: ServiceRegistrySnapshot;
  readonly dependencyInjection: DependencyInjectionSnapshot;
  readonly modules: ModuleSystemSnapshot;
  readonly metadata?: MetadataEngineSnapshot;
  readonly componentRegistry?: ComponentRegistrySnapshot;
  readonly uiComposition?: UICompositionSnapshot;
  readonly bootstrap: RuntimeBootstrapStatus;
  readonly execution?: ExecutionContextSnapshot;
}
export interface RuntimeContextValidationResult {
  readonly valid: boolean;
  readonly errors: readonly RuntimeError[];
}
export interface IRuntimeContextFactory {
  create(input: RuntimeContextFactoryInput): RuntimeContext;
}
export interface IRuntimeContextValidator {
  validate(context: RuntimeContext): RuntimeContextValidationResult;
}
export interface IRuntimeLifecycleController {
  status(): RuntimeLifecycleStatus;
  transition(status: RuntimeLifecycleStatus): RuntimeLifecycleStatus;
}
export interface IRuntimeStatusSnapshotService {
  snapshot(context: RuntimeContext): RuntimeStatusSnapshot;
}




