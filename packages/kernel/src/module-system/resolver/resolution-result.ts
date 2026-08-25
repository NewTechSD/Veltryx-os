import type {
  ModuleDependencyConflictEntry,
  ModuleDependencyCycle,
  ModuleDependencyMissingEntry,
  ModuleDependencyResolutionResult,
  ModuleDescriptor
} from "@veltryx/contracts";

import { createKernelModuleDependencyResolutionReport } from "./resolution-report.js";

export function createKernelModuleDependencyResolutionResult(input: {
  readonly analyzed: readonly ModuleDescriptor[];
  readonly order: readonly ModuleDescriptor[];
  readonly missing: readonly ModuleDependencyMissingEntry[];
  readonly conflicts: readonly ModuleDependencyConflictEntry[];
  readonly cycles: readonly ModuleDependencyCycle[];
}): ModuleDependencyResolutionResult {
  const report = createKernelModuleDependencyResolutionReport(input);

  return {
    valid: report.errors.length === 0,
    order: input.order,
    resolved: input.order,
    missing: input.missing,
    conflicts: input.conflicts,
    cycles: input.cycles,
    errors: report.errors,
    warnings: report.warnings,
    report
  };
}