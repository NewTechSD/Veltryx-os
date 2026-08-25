import type {
  LoadedModule,
  ModuleLoadingIgnoredEntry,
  ModuleLoadingRejectedEntry,
  ModuleLoadingReport
} from "@veltryx/contracts";

export function createKernelModuleLoadingReport(input: {
  readonly requested: number;
  readonly loaded: readonly LoadedModule[];
  readonly ignored: readonly ModuleLoadingIgnoredEntry[];
  readonly rejected: readonly ModuleLoadingRejectedEntry[];
  readonly duplicated: readonly ModuleLoadingRejectedEntry[];
  readonly errors?: readonly string[];
}): ModuleLoadingReport {
  const errors = [...(input.errors ?? []), ...input.rejected.map((entry) => entry.message)];
  const warnings = input.ignored.map((entry) => entry.message);

  return {
    requested: input.requested,
    loaded: input.loaded.length,
    rejected: input.rejected.length,
    ignored: input.ignored.length,
    duplicated: input.duplicated.length,
    order: input.loaded.map((module) => module.manifest.id),
    errors,
    warnings
  };
}