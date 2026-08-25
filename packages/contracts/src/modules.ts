import type { ModuleSystemSnapshot } from "./module-system-status.js";

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

export interface ModuleDependency {
  readonly id: string;
  readonly version?: string;
  readonly optional?: boolean;
}

export interface ModuleVersion {
  readonly value: string;
}

export interface ModuleCompatibility {
  readonly kernel?: string;
  readonly runtime?: string;
  readonly metadata?: string;
}

export interface IModuleManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly dependencies: readonly ModuleDependency[];
  readonly compatibility: ModuleCompatibility;
  readonly permissions: readonly string[];
  readonly routes: readonly string[];
  readonly metadata: readonly string[];
  readonly events: readonly string[];
  readonly providers: readonly string[];
  readonly components: readonly string[];
  readonly migrations: readonly string[];
  readonly seeds: readonly string[];
}

export type ModuleManifest = IModuleManifest;

export interface ModuleManifestValidationIssue {
  readonly field: string;
  readonly message: string;
}

export interface ModuleManifestValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ModuleManifestValidationIssue[];
}

export interface IModuleManifestParser {
  parse(candidate: unknown): ModuleManifest;
  validate(candidate: unknown): ModuleManifestValidationResult;
}

export interface IModuleManifestValidator {
  validate(candidate: unknown): ModuleManifestValidationResult;
}

export interface ModuleDescriptor {
  readonly manifest: ModuleManifest;
  readonly state: ModuleLifecycleState;
  readonly source?: string;
}

export interface ModuleDiscoveryInvalidEntry {
  readonly candidate: unknown;
  readonly issues: readonly ModuleManifestValidationIssue[];
}

export interface ModuleDiscoveryDuplicateEntry {
  readonly id: string;
  readonly candidate: ModuleManifest;
  readonly existing: ModuleDescriptor;
  readonly issues: readonly ModuleManifestValidationIssue[];
}

export interface ModuleDiscoveryIgnoredEntry {
  readonly candidate: unknown;
  readonly reason: "invalid" | "duplicate";
  readonly issues: readonly ModuleManifestValidationIssue[];
}

export interface ModuleDiscoveryReport {
  readonly total: number;
  readonly found: number;
  readonly valid: number;
  readonly invalid: number;
  readonly duplicated: number;
  readonly ignored: number;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface ModuleDiscoveryResult {
  readonly found: readonly unknown[];
  readonly valid: readonly ModuleDescriptor[];
  readonly invalid: readonly ModuleDiscoveryInvalidEntry[];
  readonly ignored: readonly ModuleDiscoveryIgnoredEntry[];
  readonly duplicated: readonly ModuleDiscoveryDuplicateEntry[];
  readonly total: number;
  readonly errors: readonly string[];
  readonly report: ModuleDiscoveryReport;
}

export interface ModuleDiscoveryValidationResult extends ModuleManifestValidationResult {
  readonly manifest?: ModuleManifest;
  readonly duplicate?: boolean;
}

export interface IModuleCatalog {
  register(descriptor: ModuleDescriptor): void;
  remove(moduleId: string): boolean;
  find(moduleId: string): ModuleDescriptor | undefined;
  list(): readonly ModuleDescriptor[];
  has(moduleId: string): boolean;
}

export interface IModuleDiscoveryValidator {
  validate(
    candidate: unknown,
    catalog: IModuleCatalog,
    discoveredIds: ReadonlySet<string>
  ): ModuleDiscoveryValidationResult;
}

export interface IModuleDiscovery {
  discover(candidates: readonly unknown[]): ModuleDiscoveryResult;
}

export interface ModuleDependencyEdge {
  readonly from: string;
  readonly to: string;
  readonly optional: boolean;
}

export interface ModuleDependencyMissingEntry {
  readonly moduleId: string;
  readonly dependencyId: string;
  readonly optional: boolean;
}

export interface ModuleDependencyConflictEntry {
  readonly moduleId: string;
  readonly dependencyId?: string;
  readonly field: string;
  readonly message: string;
}

export interface ModuleDependencyCycle {
  readonly moduleIds: readonly string[];
}

export interface ModuleDependencyResolutionReport {
  readonly analyzed: number;
  readonly resolved: number;
  readonly order: readonly string[];
  readonly missing: number;
  readonly conflicts: number;
  readonly cycles: number;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface ModuleDependencyResolutionResult {
  readonly valid: boolean;
  readonly order: readonly ModuleDescriptor[];
  readonly resolved: readonly ModuleDescriptor[];
  readonly missing: readonly ModuleDependencyMissingEntry[];
  readonly conflicts: readonly ModuleDependencyConflictEntry[];
  readonly cycles: readonly ModuleDependencyCycle[];
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly report: ModuleDependencyResolutionReport;
}

export interface IModuleDependencyGraph {
  addModule(descriptor: ModuleDescriptor): void;
  addDependency(moduleId: string, dependencyId: string, optional?: boolean): void;
  getModule(moduleId: string): ModuleDescriptor | undefined;
  getModuleIds(): readonly string[];
  getDependencies(moduleId: string): readonly ModuleDependencyEdge[];
  getDependents(moduleId: string): readonly ModuleDependencyEdge[];
  hasModule(moduleId: string): boolean;
}

export interface IModuleCycleDetector {
  detect(graph: IModuleDependencyGraph): readonly ModuleDependencyCycle[];
}

export interface IModuleTopologicalSorter {
  sort(graph: IModuleDependencyGraph): readonly ModuleDescriptor[];
}

export interface IModuleDependencyResolver {
  resolve(modules: readonly ModuleDescriptor[]): ModuleDependencyResolutionResult;
}

export type ModuleLoadingState = "discovered" | "validated" | "resolved" | "loaded";

export interface LoadedModule {
  readonly descriptor: ModuleDescriptor;
  readonly manifest: ModuleManifest;
  readonly state: "loaded";
  readonly loadedAt: Date;
  readonly source?: string;
}

export interface ModuleLoadingRejectedEntry {
  readonly descriptor: ModuleDescriptor;
  readonly reason: "invalid-resolution" | "invalid-descriptor" | "invalid-state" | "duplicate";
  readonly message: string;
}

export interface ModuleLoadingIgnoredEntry {
  readonly descriptor: ModuleDescriptor;
  readonly reason: "duplicate";
  readonly message: string;
}

export interface ModuleLoadingReport {
  readonly requested: number;
  readonly loaded: number;
  readonly rejected: number;
  readonly ignored: number;
  readonly duplicated: number;
  readonly order: readonly string[];
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface ModuleLoadingResult {
  readonly valid: boolean;
  readonly loaded: readonly LoadedModule[];
  readonly ignored: readonly ModuleLoadingIgnoredEntry[];
  readonly rejected: readonly ModuleLoadingRejectedEntry[];
  readonly duplicated: readonly ModuleLoadingRejectedEntry[];
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly totalLoaded: number;
  readonly report: ModuleLoadingReport;
}

export interface IModuleRegistry {
  register(module: LoadedModule): void;
  remove(moduleId: string): boolean;
  find(moduleId: string): LoadedModule | undefined;
  list(): readonly LoadedModule[];
  has(moduleId: string): boolean;
}

export interface IModuleStateValidator {
  canTransition(from: ModuleLoadingState, to: ModuleLoadingState): boolean;
  transition(from: ModuleLoadingState, to: ModuleLoadingState): ModuleLoadingState;
  isAllowed(state: ModuleLifecycleState): state is ModuleLoadingState;
}

export interface IModuleLoadingService {
  load(resolution: ModuleDependencyResolutionResult): ModuleLoadingResult;
}
export interface ModuleDependencyResolution {
  readonly order: readonly ModuleDescriptor[];
}

export interface IModuleLoader {
  discover(): Promise<readonly ModuleDescriptor[]>;
  register(manifest: ModuleManifest, source?: string): Promise<ModuleDescriptor>;
  validate(manifest: ModuleManifest): Promise<ModuleManifestValidationResult>;
  resolveDependencies(): Promise<ModuleDependencyResolution>;
  transition(moduleId: string, state: ModuleLifecycleState): Promise<ModuleDescriptor>;
  list(): Promise<readonly ModuleDescriptor[]>;
  snapshot(): Promise<ModuleSystemSnapshot>;
}


