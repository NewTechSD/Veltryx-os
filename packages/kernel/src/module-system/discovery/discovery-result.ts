import type {
  ModuleDescriptor,
  ModuleDiscoveryDuplicateEntry,
  ModuleDiscoveryIgnoredEntry,
  ModuleDiscoveryInvalidEntry,
  ModuleDiscoveryResult
} from "@veltryx/contracts";

import { createKernelModuleDiscoveryReport } from "./discovery-report.js";

export function createKernelModuleDiscoveryResult(input: {
  readonly found: readonly unknown[];
  readonly valid: readonly ModuleDescriptor[];
  readonly invalid: readonly ModuleDiscoveryInvalidEntry[];
  readonly duplicated: readonly ModuleDiscoveryDuplicateEntry[];
  readonly ignored: readonly ModuleDiscoveryIgnoredEntry[];
}): ModuleDiscoveryResult {
  const report = createKernelModuleDiscoveryReport(input);

  return {
    found: input.found,
    valid: input.valid,
    invalid: input.invalid,
    ignored: input.ignored,
    duplicated: input.duplicated,
    total: input.found.length,
    errors: report.errors,
    report
  };
}
