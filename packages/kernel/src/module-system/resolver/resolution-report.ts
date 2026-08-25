import type {
  ModuleDependencyConflictEntry,
  ModuleDependencyCycle,
  ModuleDependencyMissingEntry,
  ModuleDependencyResolutionReport,
  ModuleDescriptor
} from "@veltryx/contracts";

export function createKernelModuleDependencyResolutionReport(input: {
  readonly analyzed: readonly ModuleDescriptor[];
  readonly order: readonly ModuleDescriptor[];
  readonly missing: readonly ModuleDependencyMissingEntry[];
  readonly conflicts: readonly ModuleDependencyConflictEntry[];
  readonly cycles: readonly ModuleDependencyCycle[];
}): ModuleDependencyResolutionReport {
  const blockingMissing = input.missing.filter((entry) => !entry.optional);
  const optionalMissing = input.missing.filter((entry) => entry.optional);
  const errors = [
    ...blockingMissing.map(
      (entry) => `missing dependency: ${entry.moduleId} requires ${entry.dependencyId}`
    ),
    ...input.conflicts.map((entry) => entry.message),
    ...input.cycles.map((cycle) => `dependency cycle: ${cycle.moduleIds.join(" -> ")}`)
  ];
  const warnings = optionalMissing.map(
    (entry) => `optional dependency missing: ${entry.moduleId} references ${entry.dependencyId}`
  );

  return {
    analyzed: input.analyzed.length,
    resolved: input.order.length,
    order: input.order.map((descriptor) => descriptor.manifest.id),
    missing: input.missing.length,
    conflicts: input.conflicts.length,
    cycles: input.cycles.length,
    errors,
    warnings
  };
}