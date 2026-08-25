export type ModuleSystemStatus = "ready" | "partial" | "empty" | "error" | "notBootstrapped";
export type ModulePublicStatus = "ok" | "warning" | "error";
export type ModuleLifecycleState =
  | "discovered"
  | "validated"
  | "installed"
  | "resolved"
  | "loaded"
  | "initialized"
  | "enabled"
  | "running"
  | "disabled"
  | "unloaded"
  | "uninstalled";
export type ModuleDiscoveryStatus = "valid" | "invalid" | "duplicated" | "unknown";
export type ModuleResolutionStatus = "resolved" | "missingDependency" | "cycleDetected" | "conflict" | "unknown";
export type ModuleLoadingStatus = "loaded" | "rejected" | "notLoaded" | "unknown";
export type ModuleDependencySnapshotStatus = "resolved" | "missing" | "optionalMissing" | "incompatible" | "unknown";
export type ModuleSystemDiagnosticSeverity = "info" | "warning" | "error";
export type ModuleSystemDiagnosticSource = "module-system" | "discovery" | "resolution" | "loading" | "registry" | "snapshot";

export interface AdminModuleSystemWarning {
  readonly code: string;
  readonly message: string;
  readonly moduleId?: string;
  readonly source: ModuleSystemDiagnosticSource;
  readonly detail?: string;
}

export interface AdminModuleSystemError {
  readonly code: string;
  readonly message: string;
  readonly moduleId?: string;
  readonly source: ModuleSystemDiagnosticSource;
  readonly detail?: string;
}

export interface AdminModuleSystemDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: ModuleSystemDiagnosticSeverity;
  readonly source: ModuleSystemDiagnosticSource;
  readonly moduleId?: string;
  readonly detail?: string;
}

export interface AdminModuleDependencySnapshot {
  readonly moduleId: string;
  readonly required: boolean;
  readonly version?: string;
  readonly status: ModuleDependencySnapshotStatus;
  readonly reason?: string;
}

export interface AdminModulePublicSnapshot {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly state: ModuleLifecycleState | "invalid" | "rejected";
  readonly status: ModulePublicStatus;
  readonly discoveryStatus: ModuleDiscoveryStatus;
  readonly resolutionStatus: ModuleResolutionStatus;
  readonly loadingStatus: ModuleLoadingStatus;
  readonly dependencies: readonly AdminModuleDependencySnapshot[];
  readonly optionalDependencies: readonly AdminModuleDependencySnapshot[];
  readonly warnings: readonly AdminModuleSystemWarning[];
  readonly errors: readonly AdminModuleSystemError[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AdminModuleSystemSnapshot {
  readonly status: ModuleSystemStatus;
  readonly generatedAt: string;
  readonly modulesDiscovered: number;
  readonly modulesValid: number;
  readonly modulesInvalid: number;
  readonly modulesDuplicated: number;
  readonly modulesResolved: number;
  readonly modulesLoaded: number;
  readonly modulesRejected: number;
  readonly modules: readonly AdminModulePublicSnapshot[];
  readonly warnings: readonly AdminModuleSystemWarning[];
  readonly errors: readonly AdminModuleSystemError[];
  readonly diagnostics: readonly AdminModuleSystemDiagnosticEntry[];
  readonly reports?: unknown;
}

export interface ModuleSystemSummaryViewModel {
  readonly modulesDiscovered: number;
  readonly modulesValid: number;
  readonly modulesInvalid: number;
  readonly modulesDuplicated: number;
  readonly modulesResolved: number;
  readonly modulesLoaded: number;
  readonly modulesRejected: number;
}

export interface ModuleDiagnosticViewModel {
  readonly code: string;
  readonly message: string;
  readonly severity: ModuleSystemDiagnosticSeverity;
  readonly source: string;
  readonly details?: string;
}

export interface ModuleDependencyViewModel {
  readonly moduleId: string;
  readonly required: boolean;
  readonly requiredLabel: string;
  readonly version?: string;
  readonly status: ModuleDependencySnapshotStatus;
  readonly statusLabel: string;
  readonly reason?: string;
}

export interface ModuleCardViewModel {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly state: ModuleLifecycleState | "invalid" | "rejected";
  readonly stateLabel: string;
  readonly status: ModulePublicStatus;
  readonly statusLabel: string;
  readonly discoveryStatus: ModuleDiscoveryStatus;
  readonly discoveryStatusLabel: string;
  readonly resolutionStatus: ModuleResolutionStatus;
  readonly resolutionStatusLabel: string;
  readonly loadingStatus: ModuleLoadingStatus;
  readonly loadingStatusLabel: string;
  readonly dependenciesCount: number;
  readonly optionalDependenciesCount: number;
  readonly warningsCount: number;
  readonly errorsCount: number;
  readonly dependencies: readonly ModuleDependencyViewModel[];
  readonly optionalDependencies: readonly ModuleDependencyViewModel[];
  readonly warnings: readonly ModuleDiagnosticViewModel[];
  readonly errors: readonly ModuleDiagnosticViewModel[];
}

export interface ModuleSystemViewModel {
  readonly status: ModuleSystemStatus;
  readonly statusLabel: string;
  readonly statusDescription: string;
  readonly generatedAt: string;
  readonly summary: ModuleSystemSummaryViewModel;
  readonly modules: readonly ModuleCardViewModel[];
  readonly warnings: readonly ModuleDiagnosticViewModel[];
  readonly errors: readonly ModuleDiagnosticViewModel[];
  readonly diagnostics: readonly ModuleDiagnosticViewModel[];
  readonly isEmpty: boolean;
  readonly hasWarnings: boolean;
  readonly hasErrors: boolean;
  readonly hasModules: boolean;
}