import type { RuntimeState } from "./runtime.js";

export type KernelStatus =
  "created" | "bootstrapped" | "initialized" | "ready" | "degraded" | "error";

export type KernelBootStatus =
  "notBootstrapped" | "bootstrapped" | "initialized" | "ready" | "failed";

export type KernelSnapshotAvailability =
  "available" | "notBootstrapped" | "notImplemented" | "unavailable";

export interface KernelStatusMetric {
  readonly status: KernelSnapshotAvailability;
  readonly value?: number;
  readonly detail: string;
}

export interface KernelModuleSystemStatus {
  readonly status: KernelSnapshotAvailability;
  readonly discovered: KernelStatusMetric;
  readonly resolved: KernelStatusMetric;
  readonly loaded: KernelStatusMetric;
}

export interface KernelRegistryStatus {
  readonly status: KernelSnapshotAvailability;
  readonly detail: string;
}

export type KernelDiagnosticSeverity = "info" | "warning" | "error";

export interface KernelDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: KernelDiagnosticSeverity;
  readonly source: "kernel" | "bootstrap" | "modules" | "metadata" | "runtime" | "services" | "components" | "ui-composition" | "persistence";
  readonly detail?: string;
  readonly stack?: string;
}

export interface KernelStatusSnapshot {
  readonly kernelStatus: KernelStatus;
  readonly bootStatus: KernelBootStatus;
  readonly bootTimestamp?: string;
  readonly environment: string;
  readonly appName?: string;
  readonly appVersion?: string;
  readonly runtimeMode?: string;
  readonly servicesRegistered: KernelStatusMetric;
  readonly serviceRegistryStatus?: KernelRegistryStatus;
  readonly modulesDiscovered: KernelStatusMetric;
  readonly modulesResolved: KernelStatusMetric;
  readonly modulesLoaded: KernelStatusMetric;
  readonly moduleSystemStatus: KernelModuleSystemStatus;
  readonly metadataRegistryStatus: KernelRegistryStatus;
  readonly metadataResourcesRegistered?: number;
  readonly metadataEntitiesRegistered?: number;
  readonly metadataPagesRegistered?: number;
  readonly componentRegistryStatus?: KernelRegistryStatus;
  readonly componentsRegistered?: number;
  readonly uiCompositionStatus?: KernelRegistryStatus;
  readonly compositionsGenerated?: number;
  readonly persistence?: import("./persistence.js").PersistenceSummary;
  readonly runtimeStatus: RuntimeState | KernelSnapshotAvailability;
  readonly dependencyInjectionStatus?: import("./dependency-injection.js").DependencyInjectionStatus;
  readonly providersRegistered?: number;
  readonly providersResolved?: number;
  readonly runtimeBootstrapStatus?: import("./runtime.js").RuntimeLifecycleStatus;
  readonly runtimeLifecycle?: import("./runtime.js").RuntimeLifecycleStatus;
  readonly runtimeUptimeMs?: number;
  readonly runtimeWarnings?: number;
  readonly runtimeErrors?: number;
  readonly warnings: readonly KernelDiagnosticEntry[];
  readonly errors: readonly KernelDiagnosticEntry[];
  readonly diagnostics: readonly KernelDiagnosticEntry[];
}

export interface IKernelStatusService {
  snapshot(): Promise<KernelStatusSnapshot>;
}




