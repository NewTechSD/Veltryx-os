import type { RuntimeState } from "./runtime.js";

export type KernelStatus = "created" | "bootstrapped" | "initialized" | "ready" | "degraded" | "error";

export type KernelBootStatus = "notBootstrapped" | "bootstrapped" | "initialized" | "ready" | "failed";

export type KernelSnapshotAvailability = "available" | "notBootstrapped" | "notImplemented" | "unavailable";

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
  readonly source: "kernel" | "bootstrap" | "modules" | "metadata" | "runtime" | "services";
  readonly detail?: string;
  readonly stack?: string;
}

export interface KernelStatusSnapshot {
  readonly kernelStatus: KernelStatus;
  readonly bootStatus: KernelBootStatus;
  readonly bootTimestamp?: string;
  readonly environment: string;
  readonly servicesRegistered: KernelStatusMetric;
  readonly modulesDiscovered: KernelStatusMetric;
  readonly modulesResolved: KernelStatusMetric;
  readonly modulesLoaded: KernelStatusMetric;
  readonly moduleSystemStatus: KernelModuleSystemStatus;
  readonly metadataRegistryStatus: KernelRegistryStatus;
  readonly runtimeStatus: RuntimeState | KernelSnapshotAvailability;
  readonly warnings: readonly KernelDiagnosticEntry[];
  readonly errors: readonly KernelDiagnosticEntry[];
  readonly diagnostics: readonly KernelDiagnosticEntry[];
}

export interface IKernelStatusService {
  snapshot(): Promise<KernelStatusSnapshot>;
}
