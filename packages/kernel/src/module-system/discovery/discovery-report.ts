import type {
  ModuleDiscoveryDuplicateEntry,
  ModuleDiscoveryIgnoredEntry,
  ModuleDiscoveryInvalidEntry,
  ModuleDiscoveryReport
} from "@veltryx/contracts";

export function createKernelModuleDiscoveryReport(input: {
  readonly found: readonly unknown[];
  readonly valid: readonly unknown[];
  readonly invalid: readonly ModuleDiscoveryInvalidEntry[];
  readonly duplicated: readonly ModuleDiscoveryDuplicateEntry[];
  readonly ignored: readonly ModuleDiscoveryIgnoredEntry[];
}): ModuleDiscoveryReport {
  const errors = [
    ...input.invalid.flatMap((entry) => entry.issues.map((issue) => issue.message)),
    ...input.duplicated.flatMap((entry) => entry.issues.map((issue) => issue.message))
  ];

  const warnings = input.ignored.map((entry) => `module candidate ignored: ${entry.reason}`);

  return {
    total: input.found.length,
    found: input.found.length,
    valid: input.valid.length,
    invalid: input.invalid.length,
    duplicated: input.duplicated.length,
    ignored: input.ignored.length,
    errors,
    warnings
  };
}
