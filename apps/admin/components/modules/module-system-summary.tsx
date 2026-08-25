import type { ModuleSystemViewModel } from "../../lib/module-system-view-model";

import { ModuleSummaryCard } from "./module-summary-card";

export function ModuleSystemSummary({ viewModel }: Readonly<{ viewModel: ModuleSystemViewModel }>) {
  const counters = [
    ["Discovered", viewModel.summary.modulesDiscovered],
    ["Valid", viewModel.summary.modulesValid],
    ["Invalid", viewModel.summary.modulesInvalid],
    ["Duplicated", viewModel.summary.modulesDuplicated],
    ["Resolved", viewModel.summary.modulesResolved],
    ["Loaded", viewModel.summary.modulesLoaded],
    ["Rejected", viewModel.summary.modulesRejected]
  ] as const;

  return (
    <div className="mt-5">
      <div className="rounded-md border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal text-muted">
              Overall status
            </p>
            <h3 className="mt-2 text-xl font-semibold text-ink">{viewModel.statusLabel}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{viewModel.statusDescription}</p>
          </div>
          <div className="text-sm text-muted">
            <span className="font-medium text-ink">Generated at</span>
            <div className="mt-1">{viewModel.generatedAt}</div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {counters.map(([label, value]) => (
          <ModuleSummaryCard key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}
