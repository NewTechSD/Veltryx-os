import type {
  ModuleDependencySnapshotStatus,
  ModuleDiscoveryStatus,
  ModuleLifecycleState,
  ModuleLoadingStatus,
  ModulePublicStatus,
  ModuleResolutionStatus,
  ModuleSystemStatus
} from "./module-system-view-model";

export function moduleSystemStatusLabel(status: ModuleSystemStatus): string {
  return label(status, {
    ready: "Ready",
    partial: "Partial",
    empty: "Empty",
    error: "Error",
    notBootstrapped: "Not Bootstrapped"
  });
}

export function moduleSystemStatusDescription(status: ModuleSystemStatus): string {
  return label(status, {
    ready: "Module System snapshot is complete and all known modules are loaded.",
    partial: "Module System snapshot is available, but part of the module lifecycle is incomplete or has issues.",
    empty: "Module System snapshot is available and no modules are known yet.",
    error: "Module System snapshot could not be collected safely.",
    notBootstrapped: "Module System snapshot is not available before Kernel bootstrap."
  });
}

export function moduleStateLabel(state: ModuleLifecycleState | "invalid" | "rejected"): string {
  return label(state, {
    discovered: "Discovered",
    validated: "Validated",
    installed: "Installed",
    resolved: "Resolved",
    loaded: "Loaded",
    initialized: "Initialized",
    enabled: "Enabled",
    running: "Running",
    disabled: "Disabled",
    unloaded: "Unloaded",
    uninstalled: "Uninstalled",
    invalid: "Invalid",
    rejected: "Rejected"
  });
}

export function moduleStatusLabel(status: ModulePublicStatus): string {
  return label(status, {
    ok: "OK",
    warning: "Warning",
    error: "Error"
  });
}

export function moduleDiscoveryStatusLabel(status: ModuleDiscoveryStatus): string {
  return label(status, {
    valid: "Valid",
    invalid: "Invalid",
    duplicated: "Duplicated",
    unknown: "Unknown"
  });
}

export function moduleResolutionStatusLabel(status: ModuleResolutionStatus): string {
  return label(status, {
    resolved: "Resolved",
    missingDependency: "Missing Dependency",
    cycleDetected: "Cycle Detected",
    conflict: "Conflict",
    unknown: "Unknown"
  });
}

export function moduleLoadingStatusLabel(status: ModuleLoadingStatus): string {
  return label(status, {
    loaded: "Loaded",
    rejected: "Rejected",
    notLoaded: "Not Loaded",
    unknown: "Unknown"
  });
}

export function moduleDependencyRequiredLabel(required: boolean): string {
  return required ? "Required" : "Optional";
}

export function moduleDependencyStatusLabel(status: ModuleDependencySnapshotStatus): string {
  return label(status, {
    resolved: "Resolved",
    missing: "Missing",
    optionalMissing: "Optional Missing",
    incompatible: "Incompatible",
    unknown: "Unknown"
  });
}

function label<T extends string>(value: T, labels: Readonly<Record<T, string>>): string {
  return labels[value] ?? titleCase(value);
}

function titleCase(value: string): string {
  const spaced = value.replace(/([a-z])([A-Z])/g, "$1 $2");

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}