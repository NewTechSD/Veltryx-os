import type {
  KernelBootStatus,
  KernelDiagnosticEntry,
  KernelModuleSystemStatus,
  KernelRegistryStatus,
  KernelSnapshotAvailability,
  KernelStatus,
  KernelStatusMetric,
  KernelStatusSnapshot
} from "@veltryx/contracts";

export function createKernelStatusMetric(
  status: KernelSnapshotAvailability,
  detail: string,
  value?: number
): KernelStatusMetric {
  return value === undefined ? { status, detail } : { status, value, detail };
}

export function createKernelDiagnosticEntry(
  code: string,
  message: string,
  severity: KernelDiagnosticEntry["severity"],
  source: KernelDiagnosticEntry["source"],
  detail?: string,
  stack?: string
): KernelDiagnosticEntry {
  return {
    code,
    message,
    severity,
    source,
    detail,
    stack
  };
}

export function createKernelStatusSnapshot(input: {
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
  readonly runtimeStatus: KernelStatusSnapshot["runtimeStatus"];
  readonly warnings?: readonly KernelDiagnosticEntry[];
  readonly errors?: readonly KernelDiagnosticEntry[];
  readonly diagnostics?: readonly KernelDiagnosticEntry[];
}): KernelStatusSnapshot {
  const warnings = input.warnings ?? [];
  const errors = input.errors ?? [];
  const diagnostics = input.diagnostics ?? [...warnings, ...errors];

  return {
    kernelStatus: input.kernelStatus,
    bootStatus: input.bootStatus,
    bootTimestamp: input.bootTimestamp,
    environment: input.environment,
    servicesRegistered: input.servicesRegistered,
    modulesDiscovered: input.modulesDiscovered,
    modulesResolved: input.modulesResolved,
    modulesLoaded: input.modulesLoaded,
    moduleSystemStatus: input.moduleSystemStatus,
    metadataRegistryStatus: input.metadataRegistryStatus,
    runtimeStatus: input.runtimeStatus,
    warnings,
    errors,
    diagnostics
  };
}
