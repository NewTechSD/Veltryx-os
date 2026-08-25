import type {
  LoadedModule,
  ModuleLoadingIgnoredEntry,
  ModuleLoadingRejectedEntry,
  ModuleLoadingResult
} from "@veltryx/contracts";

import { createKernelModuleLoadingReport } from "./loading-report.js";

export function createKernelModuleLoadingResult(input: {
  readonly requested: number;
  readonly loaded: readonly LoadedModule[];
  readonly ignored: readonly ModuleLoadingIgnoredEntry[];
  readonly rejected: readonly ModuleLoadingRejectedEntry[];
  readonly duplicated: readonly ModuleLoadingRejectedEntry[];
  readonly errors?: readonly string[];
}): ModuleLoadingResult {
  const report = createKernelModuleLoadingReport(input);

  return {
    valid: report.errors.length === 0,
    loaded: input.loaded,
    ignored: input.ignored,
    rejected: input.rejected,
    duplicated: input.duplicated,
    errors: report.errors,
    warnings: report.warnings,
    totalLoaded: input.loaded.length,
    report
  };
}