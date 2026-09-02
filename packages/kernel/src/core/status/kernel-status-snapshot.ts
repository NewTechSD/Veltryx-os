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
  readonly persistence?: KernelStatusSnapshot["persistence"];
  readonly metadataPersistence?: KernelStatusSnapshot["metadataPersistence"];
  readonly runtimeStatus: KernelStatusSnapshot["runtimeStatus"];
  readonly dependencyInjectionStatus?: KernelStatusSnapshot["dependencyInjectionStatus"];
  readonly providersRegistered?: number;
  readonly providersResolved?: number;
  readonly runtimeBootstrapStatus?: KernelStatusSnapshot["runtimeBootstrapStatus"];
  readonly runtimeLifecycle?: KernelStatusSnapshot["runtimeLifecycle"];
  readonly runtimeUptimeMs?: number;
  readonly runtimeWarnings?: number;
  readonly runtimeErrors?: number;
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
    appName: input.appName,
    appVersion: input.appVersion,
    runtimeMode: input.runtimeMode,
    servicesRegistered: input.servicesRegistered,
    serviceRegistryStatus: input.serviceRegistryStatus,
    modulesDiscovered: input.modulesDiscovered,
    modulesResolved: input.modulesResolved,
    modulesLoaded: input.modulesLoaded,
    moduleSystemStatus: input.moduleSystemStatus,
    metadataRegistryStatus: input.metadataRegistryStatus,
    metadataResourcesRegistered: input.metadataResourcesRegistered,
    metadataEntitiesRegistered: input.metadataEntitiesRegistered,
    metadataPagesRegistered: input.metadataPagesRegistered,
    componentRegistryStatus: input.componentRegistryStatus,
    componentsRegistered: input.componentsRegistered,
    uiCompositionStatus: input.uiCompositionStatus,
    compositionsGenerated: input.compositionsGenerated,
    persistence: input.persistence,
    metadataPersistence: input.metadataPersistence,
    runtimeStatus: input.runtimeStatus,
    dependencyInjectionStatus: input.dependencyInjectionStatus,
    providersRegistered: input.providersRegistered,
    providersResolved: input.providersResolved,
    runtimeBootstrapStatus: input.runtimeBootstrapStatus,
    runtimeLifecycle: input.runtimeLifecycle,
    runtimeUptimeMs: input.runtimeUptimeMs,
    runtimeWarnings: input.runtimeWarnings,
    runtimeErrors: input.runtimeErrors,
    warnings,
    errors,
    diagnostics
  };
}




