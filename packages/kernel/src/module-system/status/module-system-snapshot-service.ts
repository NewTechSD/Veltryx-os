import type {
  IModuleSystemStatusService,
  LoadedModule,
  ModuleDependency,
  ModuleDependencyConflictEntry,
  ModuleDependencyMissingEntry,
  ModuleDependencyResolutionResult,
  ModuleDependencySnapshot,
  ModuleDescriptor,
  ModuleDiscoveryDuplicateEntry,
  ModuleDiscoveryInvalidEntry,
  ModuleDiscoveryResult,
  ModuleLoadingRejectedEntry,
  ModuleLoadingResult,
  ModulePublicSnapshot,
  ModuleSystemDiagnosticEntry,
  ModuleSystemError,
  ModuleSystemSnapshot,
  ModuleSystemSnapshotReports,
  ModuleSystemStatus,
  ModuleSystemWarning
} from "@veltryx/contracts";

export interface ModuleSystemSnapshotServiceInput {
  readonly modules?: readonly ModuleDescriptor[];
  readonly discoveryResult?: ModuleDiscoveryResult;
  readonly resolutionResult?: ModuleDependencyResolutionResult;
  readonly loadingResult?: ModuleLoadingResult;
  readonly loadedModules?: readonly LoadedModule[];
  readonly generatedAt?: Date;
}

export class ModuleSystemSnapshotService implements IModuleSystemStatusService {
  constructor(private readonly input: ModuleSystemSnapshotServiceInput = {}) {}

  async snapshot(): Promise<ModuleSystemSnapshot> {
    try {
      return createModuleSystemSnapshot(this.input);
    } catch (error) {
      return createModuleSystemErrorSnapshot(error, this.input.generatedAt ?? new Date());
    }
  }
}

export function createModuleSystemSnapshot(input: ModuleSystemSnapshotServiceInput = {}): ModuleSystemSnapshot {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const warnings: ModuleSystemWarning[] = [];
  const errors: ModuleSystemError[] = [];
  const diagnostics: ModuleSystemDiagnosticEntry[] = [];
  const modulesById = new Map<string, ModulePublicSnapshotDraft>();

  for (const descriptor of input.modules ?? []) {
    mergeModuleDraft(modulesById, descriptor.manifest.id, createDraftFromDescriptor(descriptor));
  }

  for (const descriptor of input.discoveryResult?.valid ?? []) {
    mergeModuleDraft(modulesById, descriptor.manifest.id, createDraftFromDescriptor(descriptor));
  }

  for (const invalid of input.discoveryResult?.invalid ?? []) {
    const draft = createDraftFromInvalidDiscovery(invalid);
    draft.errors.push(createModuleSystemError("MODULE_DISCOVERY_INVALID", "Module manifest is invalid.", "discovery", draft.id));
    for (const issue of invalid.issues) {
      draft.errors.push(createModuleSystemError("MODULE_DISCOVERY_VALIDATION_ISSUE", issue.message, "discovery", draft.id, issue.field));
    }
    mergeModuleDraft(modulesById, draft.id, draft);
  }

  for (const duplicate of input.discoveryResult?.duplicated ?? []) {
    const draft = createDraftFromDuplicateDiscovery(duplicate);
    draft.errors.push(createModuleSystemError("MODULE_DISCOVERY_DUPLICATED", `Module is duplicated: ${duplicate.id}`, "discovery", duplicate.id));
    mergeModuleDraft(modulesById, duplicate.id, draft);
  }

  for (const descriptor of input.resolutionResult?.resolved ?? []) {
    const draft = getOrCreateDraft(modulesById, descriptor);
    draft.resolutionStatus = "resolved";
    draft.state = descriptor.state === "loaded" ? "loaded" : "resolved";
  }

  for (const missing of input.resolutionResult?.missing ?? []) {
    applyMissingDependency(modulesById, missing);
  }

  for (const conflict of input.resolutionResult?.conflicts ?? []) {
    applyConflict(modulesById, conflict);
  }

  for (const cycle of input.resolutionResult?.cycles ?? []) {
    for (const moduleId of cycle.moduleIds) {
      const draft = getOrCreatePlaceholderDraft(modulesById, moduleId);
      draft.resolutionStatus = "cycleDetected";
      draft.errors.push(createModuleSystemError("MODULE_RESOLUTION_CYCLE", `Dependency cycle detected for module: ${moduleId}`, "resolution", moduleId, cycle.moduleIds.join(" -> ")));
    }
  }

  for (const loaded of [...(input.loadedModules ?? []), ...(input.loadingResult?.loaded ?? [])]) {
    const draft = getOrCreateDraft(modulesById, loaded.descriptor);
    draft.state = "loaded";
    draft.loadingStatus = "loaded";
    draft.resolutionStatus = draft.resolutionStatus === "unknown" ? "resolved" : draft.resolutionStatus;
  }

  for (const rejected of input.loadingResult?.rejected ?? []) {
    applyRejectedLoading(modulesById, rejected);
  }

  appendReportDiagnostics(diagnostics, input, modulesById.size);
  appendReportWarningsAndErrors(warnings, errors, input);
  appendModuleIssueSummaries(warnings, errors, modulesById);

  if (modulesById.size > 0 && !input.discoveryResult) {
    warnings.push(createModuleSystemWarning("MODULE_DISCOVERY_REPORT_UNAVAILABLE", "Discovery report is unavailable for the current Module System snapshot.", "discovery"));
  }

  if (modulesById.size > 0 && !input.resolutionResult) {
    warnings.push(createModuleSystemWarning("MODULE_RESOLUTION_REPORT_UNAVAILABLE", "Resolution report is unavailable for the current Module System snapshot.", "resolution"));
  }

  if (modulesById.size > 0 && !input.loadingResult) {
    warnings.push(createModuleSystemWarning("MODULE_LOADING_REPORT_UNAVAILABLE", "Loading report is unavailable for the current Module System snapshot.", "loading"));
  }

  const modules = [...modulesById.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(finalizeModuleDraft);

  const modulesDiscovered = input.discoveryResult?.report.found ?? modules.length;
  const modulesValid = input.discoveryResult?.report.valid ?? modules.filter((module) => module.discoveryStatus === "valid").length;
  const modulesInvalid = input.discoveryResult?.report.invalid ?? modules.filter((module) => module.discoveryStatus === "invalid").length;
  const modulesDuplicated = input.discoveryResult?.report.duplicated ?? modules.filter((module) => module.discoveryStatus === "duplicated").length;
  const modulesResolved = input.resolutionResult?.report.resolved ?? modules.filter((module) => module.resolutionStatus === "resolved").length;
  const modulesLoaded = input.loadingResult?.report.loaded ?? modules.filter((module) => module.loadingStatus === "loaded").length;
  const modulesRejected = input.loadingResult?.report.rejected ?? modules.filter((module) => module.loadingStatus === "rejected").length;
  const status = determineModuleSystemStatus({
    modulesDiscovered,
    modulesValid,
    modulesResolved,
    modulesLoaded,
    modulesRejected,
    hasSnapshotErrors: false,
    warnings,
    errors
  });

  return freezeSnapshot({
    status,
    generatedAt,
    modulesDiscovered,
    modulesValid,
    modulesInvalid,
    modulesDuplicated,
    modulesResolved,
    modulesLoaded,
    modulesRejected,
    modules,
    warnings: warnings.map(freezeWarning),
    errors: errors.map(freezeError),
    diagnostics: diagnostics.map(freezeDiagnostic),
    reports: freezeReports({
      discovery: cloneDiscoveryReport(input.discoveryResult?.report),
      resolution: cloneResolutionReport(input.resolutionResult?.report),
      loading: cloneLoadingReport(input.loadingResult?.report)
    })
  });
}

interface ModulePublicSnapshotDraft {
  id: string;
  name: string;
  version: string;
  description?: string;
  state: ModulePublicSnapshot["state"];
  discoveryStatus: ModulePublicSnapshot["discoveryStatus"];
  resolutionStatus: ModulePublicSnapshot["resolutionStatus"];
  loadingStatus: ModulePublicSnapshot["loadingStatus"];
  dependencies: ModuleDependencySnapshot[];
  optionalDependencies: ModuleDependencySnapshot[];
  warnings: ModuleSystemWarning[];
  errors: ModuleSystemError[];
  metadata?: Record<string, unknown>;
}

function createDraftFromDescriptor(descriptor: ModuleDescriptor): ModulePublicSnapshotDraft {
  const manifestDependencies = Array.isArray(descriptor.manifest.dependencies)
    ? descriptor.manifest.dependencies
    : [];
  const dependencies = manifestDependencies.filter((dependency) => dependency.optional !== true);
  const optionalDependencies = manifestDependencies.filter((dependency) => dependency.optional === true);
  const errors = Array.isArray(descriptor.manifest.dependencies)
    ? []
    : [
        createModuleSystemError(
          "MODULE_DESCRIPTOR_DEPENDENCIES_INVALID",
          "Module descriptor dependencies are unavailable or malformed.",
          "snapshot",
          descriptor.manifest.id
        )
      ];

  return {
    id: descriptor.manifest.id,
    name: descriptor.manifest.name,
    version: descriptor.manifest.version,
    description: descriptor.manifest.description,
    state: descriptor.state,
    discoveryStatus: "valid",
    resolutionStatus: descriptor.state === "resolved" || descriptor.state === "loaded" ? "resolved" : "unknown",
    loadingStatus: descriptor.state === "loaded" ? "loaded" : "notLoaded",
    dependencies: dependencies.map((dependency) => createDependencySnapshot(dependency, "unknown")),
    optionalDependencies: optionalDependencies.map((dependency) => createDependencySnapshot(dependency, "unknown")),
    warnings: [],
    errors,
    metadata: createManifestMetadata(descriptor)
  };
}

function createDraftFromInvalidDiscovery(entry: ModuleDiscoveryInvalidEntry): ModulePublicSnapshotDraft {
  const candidate = isRecord(entry.candidate) ? entry.candidate : {};
  const id = toExplicitString(candidate["id"]);
  const name = toExplicitString(candidate["name"]);
  const version = toExplicitString(candidate["version"]);

  return {
    id,
    name,
    version,
    state: "invalid",
    discoveryStatus: "invalid",
    resolutionStatus: "unknown",
    loadingStatus: "unknown",
    dependencies: [],
    optionalDependencies: [],
    warnings: [],
    errors: []
  };
}

function createDraftFromDuplicateDiscovery(entry: ModuleDiscoveryDuplicateEntry): ModulePublicSnapshotDraft {
  return {
    id: entry.id,
    name: entry.candidate.name,
    version: entry.candidate.version,
    description: entry.candidate.description,
    state: "invalid",
    discoveryStatus: "duplicated",
    resolutionStatus: "unknown",
    loadingStatus: "unknown",
    dependencies: entry.candidate.dependencies.filter((dependency) => dependency.optional !== true).map((dependency) => createDependencySnapshot(dependency, "unknown")),
    optionalDependencies: entry.candidate.dependencies.filter((dependency) => dependency.optional === true).map((dependency) => createDependencySnapshot(dependency, "unknown")),
    warnings: [],
    errors: [],
    metadata: {
      author: entry.candidate.author,
      compatibility: cloneRecord(entry.candidate.compatibility as Record<string, unknown>),
      permissions: [...entry.candidate.permissions],
      routes: [...entry.candidate.routes],
      metadata: [...entry.candidate.metadata],
      events: [...entry.candidate.events],
      providers: [...entry.candidate.providers],
      components: [...entry.candidate.components],
      migrations: [...entry.candidate.migrations],
      seeds: [...entry.candidate.seeds]
    }
  };
}

function createDependencySnapshot(
  dependency: ModuleDependency,
  status: ModuleDependencySnapshot["status"],
  reason?: string
): ModuleDependencySnapshot {
  return freezeDependency({
    moduleId: dependency.id,
    required: dependency.optional !== true,
    version: dependency.version,
    status,
    reason
  });
}

function applyMissingDependency(
  modulesById: Map<string, ModulePublicSnapshotDraft>,
  missing: ModuleDependencyMissingEntry
): void {
  const draft = getOrCreatePlaceholderDraft(modulesById, missing.moduleId);
  const status = missing.optional ? "optionalMissing" : "missing";
  const reason = missing.optional ? "Optional dependency is not present." : "Required dependency is not present.";
  draft.resolutionStatus = missing.optional ? draft.resolutionStatus : "missingDependency";

  const dependency = findDependency(draft, missing.dependencyId);
  if (dependency) {
    replaceDependency(draft, missing.dependencyId, { ...dependency, status, reason });
  } else {
    const missingSnapshot = freezeDependency({ moduleId: missing.dependencyId, required: !missing.optional, status, reason });
    if (missing.optional) {
      draft.optionalDependencies.push(missingSnapshot);
    } else {
      draft.dependencies.push(missingSnapshot);
    }
  }

  const issue = missing.optional
    ? createModuleSystemWarning("MODULE_OPTIONAL_DEPENDENCY_MISSING", `Optional dependency is missing: ${missing.dependencyId}`, "resolution", missing.moduleId)
    : createModuleSystemError("MODULE_REQUIRED_DEPENDENCY_MISSING", `Required dependency is missing: ${missing.dependencyId}`, "resolution", missing.moduleId);

  if (missing.optional) {
    draft.warnings.push(issue);
  } else {
    draft.errors.push(issue);
  }
}

function applyConflict(
  modulesById: Map<string, ModulePublicSnapshotDraft>,
  conflict: ModuleDependencyConflictEntry
): void {
  const draft = getOrCreatePlaceholderDraft(modulesById, conflict.moduleId);
  draft.resolutionStatus = "conflict";
  draft.errors.push(createModuleSystemError("MODULE_RESOLUTION_CONFLICT", conflict.message, "resolution", conflict.moduleId, conflict.field));

  if (conflict.dependencyId) {
    const dependency = findDependency(draft, conflict.dependencyId);
    if (dependency) {
      replaceDependency(draft, conflict.dependencyId, { ...dependency, status: "incompatible", reason: conflict.message });
    }
  }
}

function applyRejectedLoading(
  modulesById: Map<string, ModulePublicSnapshotDraft>,
  rejected: ModuleLoadingRejectedEntry
): void {
  const draft = getOrCreateDraft(modulesById, rejected.descriptor);
  draft.state = "rejected";
  draft.loadingStatus = "rejected";
  draft.errors.push(createModuleSystemError("MODULE_LOADING_REJECTED", rejected.message, "loading", rejected.descriptor.manifest.id, rejected.reason));
}

function appendReportDiagnostics(
  diagnostics: ModuleSystemDiagnosticEntry[],
  input: ModuleSystemSnapshotServiceInput,
  registryModules: number
): void {
  diagnostics.push(createModuleSystemDiagnostic("MODULE_REGISTRY_SUMMARY", "Module registry snapshot collected.", "info", "registry", undefined, `modules=${registryModules}`));

  if (input.discoveryResult) {
    diagnostics.push(createModuleSystemDiagnostic("MODULE_DISCOVERY_REPORT", "Last discovery report is available.", "info", "discovery", undefined, `found=${input.discoveryResult.report.found};valid=${input.discoveryResult.report.valid};invalid=${input.discoveryResult.report.invalid}`));
  }

  if (input.resolutionResult) {
    diagnostics.push(createModuleSystemDiagnostic("MODULE_RESOLUTION_REPORT", "Last resolution report is available.", "info", "resolution", undefined, `resolved=${input.resolutionResult.report.resolved};missing=${input.resolutionResult.report.missing};cycles=${input.resolutionResult.report.cycles}`));
  }

  if (input.loadingResult) {
    diagnostics.push(createModuleSystemDiagnostic("MODULE_LOADING_REPORT", "Last loading report is available.", "info", "loading", undefined, `loaded=${input.loadingResult.report.loaded};rejected=${input.loadingResult.report.rejected}`));
  }
}

function appendReportWarningsAndErrors(
  warnings: ModuleSystemWarning[],
  errors: ModuleSystemError[],
  input: ModuleSystemSnapshotServiceInput
): void {
  for (const warning of input.discoveryResult?.report.warnings ?? []) {
    warnings.push(createModuleSystemWarning("MODULE_DISCOVERY_WARNING", warning, "discovery"));
  }

  for (const error of input.discoveryResult?.errors ?? input.discoveryResult?.report.errors ?? []) {
    errors.push(createModuleSystemError("MODULE_DISCOVERY_ERROR", error, "discovery"));
  }

  for (const warning of input.resolutionResult?.warnings ?? input.resolutionResult?.report.warnings ?? []) {
    warnings.push(createModuleSystemWarning("MODULE_RESOLUTION_WARNING", warning, "resolution"));
  }

  for (const error of input.resolutionResult?.errors ?? input.resolutionResult?.report.errors ?? []) {
    errors.push(createModuleSystemError("MODULE_RESOLUTION_ERROR", error, "resolution"));
  }

  for (const warning of input.loadingResult?.warnings ?? input.loadingResult?.report.warnings ?? []) {
    warnings.push(createModuleSystemWarning("MODULE_LOADING_WARNING", warning, "loading"));
  }

  for (const error of input.loadingResult?.errors ?? input.loadingResult?.report.errors ?? []) {
    errors.push(createModuleSystemError("MODULE_LOADING_ERROR", error, "loading"));
  }
}

function appendModuleIssueSummaries(
  warnings: ModuleSystemWarning[],
  errors: ModuleSystemError[],
  modulesById: Map<string, ModulePublicSnapshotDraft>
): void {
  for (const draft of modulesById.values()) {
    warnings.push(...draft.warnings);
    errors.push(...draft.errors);
  }
}

function determineModuleSystemStatus(input: {
  readonly modulesDiscovered: number;
  readonly modulesValid: number;
  readonly modulesResolved: number;
  readonly modulesLoaded: number;
  readonly modulesRejected: number;
  readonly hasSnapshotErrors: boolean;
  readonly warnings: readonly ModuleSystemWarning[];
  readonly errors: readonly ModuleSystemError[];
}): ModuleSystemStatus {
  if (input.hasSnapshotErrors) {
    return "error";
  }

  if (input.modulesDiscovered === 0) {
    return "empty";
  }

  const hasModuleErrors = input.errors.length > 0 || input.modulesRejected > 0;
  if (hasModuleErrors || input.warnings.length > 0) {
    return "partial";
  }

  if (
    input.modulesValid === input.modulesDiscovered &&
    input.modulesResolved === input.modulesValid &&
    input.modulesLoaded === input.modulesResolved
  ) {
    return "ready";
  }

  return "partial";
}

function finalizeModuleDraft(draft: ModulePublicSnapshotDraft): ModulePublicSnapshot {
  const warnings = draft.warnings.map(freezeWarning);
  const errors = draft.errors.map(freezeError);
  const status: ModulePublicSnapshot["status"] = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "ok";
  const metadata = draft.metadata ? freezeRecord(cloneRecord(draft.metadata)) : undefined;

  return Object.freeze({
    id: draft.id,
    name: draft.name,
    version: draft.version,
    description: draft.description,
    state: draft.state,
    status,
    discoveryStatus: draft.discoveryStatus,
    resolutionStatus: draft.resolutionStatus,
    loadingStatus: draft.loadingStatus,
    dependencies: Object.freeze(draft.dependencies.map((dependency) => freezeDependency({ ...dependency }))),
    optionalDependencies: Object.freeze(draft.optionalDependencies.map((dependency) => freezeDependency({ ...dependency }))),
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
    metadata
  });
}

function getOrCreateDraft(
  modulesById: Map<string, ModulePublicSnapshotDraft>,
  descriptor: ModuleDescriptor
): ModulePublicSnapshotDraft {
  const existing = modulesById.get(descriptor.manifest.id);
  if (existing) {
    return existing;
  }

  const draft = createDraftFromDescriptor(descriptor);
  modulesById.set(draft.id, draft);
  return draft;
}

function getOrCreatePlaceholderDraft(
  modulesById: Map<string, ModulePublicSnapshotDraft>,
  moduleId: string
): ModulePublicSnapshotDraft {
  const existing = modulesById.get(moduleId);
  if (existing) {
    return existing;
  }

  const draft: ModulePublicSnapshotDraft = {
    id: moduleId,
    name: "unavailable",
    version: "unavailable",
    state: "discovered",
    discoveryStatus: "unknown",
    resolutionStatus: "unknown",
    loadingStatus: "unknown",
    dependencies: [],
    optionalDependencies: [],
    warnings: [],
    errors: []
  };
  modulesById.set(moduleId, draft);
  return draft;
}

function mergeModuleDraft(
  modulesById: Map<string, ModulePublicSnapshotDraft>,
  key: string,
  draft: ModulePublicSnapshotDraft
): void {
  const existing = modulesById.get(key);
  if (!existing) {
    modulesById.set(key, draft);
    return;
  }

  existing.name = pickAvailable(existing.name, draft.name);
  existing.version = pickAvailable(existing.version, draft.version);
  existing.description = existing.description ?? draft.description;
  existing.state = draft.state === "invalid" || draft.state === "rejected"
    ? draft.state
    : pickMoreAdvancedState(existing.state, draft.state);
  existing.discoveryStatus = draft.discoveryStatus === "invalid" || draft.discoveryStatus === "duplicated"
    ? draft.discoveryStatus
    : pickKnown(existing.discoveryStatus, draft.discoveryStatus);
  existing.resolutionStatus = pickKnown(existing.resolutionStatus, draft.resolutionStatus);
  existing.loadingStatus = pickKnown(existing.loadingStatus, draft.loadingStatus);
  existing.dependencies = mergeDependencies(existing.dependencies, draft.dependencies);
  existing.optionalDependencies = mergeDependencies(existing.optionalDependencies, draft.optionalDependencies);
  existing.warnings.push(...draft.warnings);
  existing.errors.push(...draft.errors);
  existing.metadata = existing.metadata ?? draft.metadata;
}

function mergeDependencies(
  current: ModuleDependencySnapshot[],
  incoming: ModuleDependencySnapshot[]
): ModuleDependencySnapshot[] {
  const byId = new Map(current.map((dependency) => [dependency.moduleId, dependency]));
  for (const dependency of incoming) {
    const existing = byId.get(dependency.moduleId);
    byId.set(dependency.moduleId, existing && existing.status !== "unknown" ? existing : dependency);
  }
  return [...byId.values()];
}

function findDependency(
  draft: ModulePublicSnapshotDraft,
  dependencyId: string
): ModuleDependencySnapshot | undefined {
  return [...draft.dependencies, ...draft.optionalDependencies].find((dependency) => dependency.moduleId === dependencyId);
}

function replaceDependency(
  draft: ModulePublicSnapshotDraft,
  dependencyId: string,
  replacement: ModuleDependencySnapshot
): void {
  draft.dependencies = draft.dependencies.map((dependency) => dependency.moduleId === dependencyId ? freezeDependency(replacement) : dependency);
  draft.optionalDependencies = draft.optionalDependencies.map((dependency) => dependency.moduleId === dependencyId ? freezeDependency(replacement) : dependency);
}

function createManifestMetadata(descriptor: ModuleDescriptor): Record<string, unknown> {
  return {
    source: descriptor.source,
    author: descriptor.manifest.author,
    compatibility: cloneRecord(descriptor.manifest.compatibility as Record<string, unknown>),
    permissions: [...descriptor.manifest.permissions],
    routes: [...descriptor.manifest.routes],
    metadata: [...descriptor.manifest.metadata],
    events: [...descriptor.manifest.events],
    providers: [...descriptor.manifest.providers],
    components: [...descriptor.manifest.components],
    migrations: [...descriptor.manifest.migrations],
    seeds: [...descriptor.manifest.seeds]
  };
}

function createModuleSystemErrorSnapshot(error: unknown, generatedAt: Date): ModuleSystemSnapshot {
  const message = error instanceof Error ? error.message : "Unknown Module System snapshot failure";
  const snapshotError = createModuleSystemError("MODULE_SYSTEM_SNAPSHOT_FAILED", message, "snapshot");
  const diagnostic = createModuleSystemDiagnostic("MODULE_SYSTEM_SNAPSHOT_FAILED", message, "error", "snapshot");

  return freezeSnapshot({
    status: "error",
    generatedAt: generatedAt.toISOString(),
    modulesDiscovered: 0,
    modulesValid: 0,
    modulesInvalid: 0,
    modulesDuplicated: 0,
    modulesResolved: 0,
    modulesLoaded: 0,
    modulesRejected: 0,
    modules: Object.freeze([]),
    warnings: Object.freeze([]),
    errors: Object.freeze([freezeError(snapshotError)]),
    diagnostics: Object.freeze([freezeDiagnostic(diagnostic)]),
    reports: freezeReports({})
  });
}

function cloneDiscoveryReport(report: ModuleSystemSnapshotReports["discovery"]): ModuleSystemSnapshotReports["discovery"] {
  return report ? Object.freeze({ ...report, errors: Object.freeze([...report.errors]), warnings: Object.freeze([...report.warnings]) }) : undefined;
}

function cloneResolutionReport(report: ModuleSystemSnapshotReports["resolution"]): ModuleSystemSnapshotReports["resolution"] {
  return report ? Object.freeze({ ...report, order: Object.freeze([...report.order]), errors: Object.freeze([...report.errors]), warnings: Object.freeze([...report.warnings]) }) : undefined;
}

function cloneLoadingReport(report: ModuleSystemSnapshotReports["loading"]): ModuleSystemSnapshotReports["loading"] {
  return report ? Object.freeze({ ...report, order: Object.freeze([...report.order]), errors: Object.freeze([...report.errors]), warnings: Object.freeze([...report.warnings]) }) : undefined;
}

function createModuleSystemWarning(
  code: string,
  message: string,
  source: ModuleSystemWarning["source"],
  moduleId?: string,
  detail?: string
): ModuleSystemWarning {
  return { code, message, source, moduleId, detail };
}

function createModuleSystemError(
  code: string,
  message: string,
  source: ModuleSystemError["source"],
  moduleId?: string,
  detail?: string
): ModuleSystemError {
  return { code, message, source, moduleId, detail };
}

function createModuleSystemDiagnostic(
  code: string,
  message: string,
  severity: ModuleSystemDiagnosticEntry["severity"],
  source: ModuleSystemDiagnosticEntry["source"],
  moduleId?: string,
  detail?: string
): ModuleSystemDiagnosticEntry {
  return { code, message, severity, source, moduleId, detail };
}

function freezeSnapshot(snapshot: ModuleSystemSnapshot): ModuleSystemSnapshot {
  return Object.freeze({
    ...snapshot,
    modules: Object.freeze([...snapshot.modules]),
    warnings: Object.freeze([...snapshot.warnings]),
    errors: Object.freeze([...snapshot.errors]),
    diagnostics: Object.freeze([...snapshot.diagnostics]),
    reports: freezeReports(snapshot.reports)
  });
}

function freezeReports(reports: ModuleSystemSnapshotReports): ModuleSystemSnapshotReports {
  return Object.freeze({
    discovery: reports.discovery,
    resolution: reports.resolution,
    loading: reports.loading
  });
}

function freezeWarning(warning: ModuleSystemWarning): ModuleSystemWarning {
  return Object.freeze({ ...warning });
}

function freezeError(error: ModuleSystemError): ModuleSystemError {
  return Object.freeze({ ...error });
}

function freezeDiagnostic(diagnostic: ModuleSystemDiagnosticEntry): ModuleSystemDiagnosticEntry {
  return Object.freeze({ ...diagnostic });
}

function freezeDependency(dependency: ModuleDependencySnapshot): ModuleDependencySnapshot {
  return Object.freeze({ ...dependency });
}

function freezeRecord(record: Record<string, unknown>): Readonly<Record<string, unknown>> {
  return Object.freeze(record);
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return { ...record };
}

function pickAvailable(current: string, incoming: string): string {
  return current === "unavailable" ? incoming : current;
}

function pickKnown<T extends string>(current: T, incoming: T): T {
  return current === "unknown" ? incoming : current;
}

function pickMoreAdvancedState(
  current: ModulePublicSnapshot["state"],
  incoming: ModulePublicSnapshot["state"]
): ModulePublicSnapshot["state"] {
  const order: readonly ModulePublicSnapshot["state"][] = [
    "invalid",
    "rejected",
    "discovered",
    "validated",
    "installed",
    "resolved",
    "loaded",
    "initialized",
    "enabled",
    "running",
    "disabled",
    "unloaded",
    "uninstalled"
  ];
  return order.indexOf(incoming) > order.indexOf(current) ? incoming : current;
}

function toExplicitString(candidate: unknown): string {
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate : "unavailable";
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}


