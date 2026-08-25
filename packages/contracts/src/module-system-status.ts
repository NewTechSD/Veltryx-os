import type {
  ModuleDependencyResolutionReport,
  ModuleDiscoveryReport,
  ModuleLifecycleState,
  ModuleLoadingReport
} from "./modules.js";

export type ModuleSystemStatus = "ready" | "partial" | "empty" | "error" | "notBootstrapped";

export type ModulePublicStatus = "ok" | "warning" | "error";

export type ModuleDiscoveryStatus = "valid" | "invalid" | "duplicated" | "unknown";

export type ModuleResolutionStatus =
  | "resolved"
  | "missingDependency"
  | "cycleDetected"
  | "conflict"
  | "unknown";

export type ModuleLoadingStatus = "loaded" | "rejected" | "notLoaded" | "unknown";

export type ModuleDependencySnapshotStatus =
  | "resolved"
  | "missing"
  | "optionalMissing"
  | "incompatible"
  | "unknown";

export type ModuleSystemDiagnosticSeverity = "info" | "warning" | "error";

export interface ModuleSystemWarning {
  readonly code: string;
  readonly message: string;
  readonly moduleId?: string;
  readonly source: "module-system" | "discovery" | "resolution" | "loading" | "registry" | "snapshot";
  readonly detail?: string;
}

export interface ModuleSystemError {
  readonly code: string;
  readonly message: string;
  readonly moduleId?: string;
  readonly source: "module-system" | "discovery" | "resolution" | "loading" | "registry" | "snapshot";
  readonly detail?: string;
}

export interface ModuleSystemDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: ModuleSystemDiagnosticSeverity;
  readonly source: "module-system" | "discovery" | "resolution" | "loading" | "registry" | "snapshot";
  readonly moduleId?: string;
  readonly detail?: string;
}

export interface ModuleDependencySnapshot {
  readonly moduleId: string;
  readonly required: boolean;
  readonly version?: string;
  readonly status: ModuleDependencySnapshotStatus;
  readonly reason?: string;
}

export interface ModulePublicSnapshot {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly state: ModuleLifecycleState | "invalid" | "rejected";
  readonly status: ModulePublicStatus;
  readonly discoveryStatus: ModuleDiscoveryStatus;
  readonly resolutionStatus: ModuleResolutionStatus;
  readonly loadingStatus: ModuleLoadingStatus;
  readonly dependencies: readonly ModuleDependencySnapshot[];
  readonly optionalDependencies: readonly ModuleDependencySnapshot[];
  readonly warnings: readonly ModuleSystemWarning[];
  readonly errors: readonly ModuleSystemError[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ModuleSystemSnapshotReports {
  readonly discovery?: ModuleDiscoveryReport;
  readonly resolution?: ModuleDependencyResolutionReport;
  readonly loading?: ModuleLoadingReport;
}

export interface ModuleSystemSnapshot {
  readonly status: ModuleSystemStatus;
  readonly generatedAt: string;
  readonly modulesDiscovered: number;
  readonly modulesValid: number;
  readonly modulesInvalid: number;
  readonly modulesDuplicated: number;
  readonly modulesResolved: number;
  readonly modulesLoaded: number;
  readonly modulesRejected: number;
  readonly modules: readonly ModulePublicSnapshot[];
  readonly warnings: readonly ModuleSystemWarning[];
  readonly errors: readonly ModuleSystemError[];
  readonly diagnostics: readonly ModuleSystemDiagnosticEntry[];
  readonly reports: ModuleSystemSnapshotReports;
}

export interface IModuleSystemStatusService {
  snapshot(): Promise<ModuleSystemSnapshot>;
}
