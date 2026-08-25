import type { ModuleSystemViewModel } from "../../lib/module-system-view-model";

import { ModuleDiagnosticsList } from "./module-diagnostics-list";
import { ModuleEmptyState } from "./module-empty-state";
import { ModuleErrorState } from "./module-error-state";
import { ModulePartialState } from "./module-partial-state";
import { ModuleSystemSummary } from "./module-system-summary";
import { ModulesList } from "./modules-list";

export function ModuleSystemScreen({ viewModel }: Readonly<{ viewModel: ModuleSystemViewModel }>) {
  return (
    <section className="mx-auto w-full max-w-7xl" id="modules">
      <div className="border-b border-line pb-5">
        <p className="text-sm font-medium uppercase tracking-normal text-muted">Module System</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">Modules</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Estado público de discovery, resolution e loading, obtido pelo adapter administrativo.
        </p>
      </div>

      {viewModel.status === "partial" ? <ModulePartialState viewModel={viewModel} /> : null}
      {viewModel.hasErrors || viewModel.status === "error" ? (
        <ModuleErrorState errors={viewModel.errors} />
      ) : null}

      <ModuleSystemSummary viewModel={viewModel} />
      {viewModel.isEmpty ? <ModuleEmptyState /> : <ModulesList modules={viewModel.modules} />}

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <ModuleDiagnosticsList title="Warnings" tone="warning" entries={viewModel.warnings} />
        <ModuleDiagnosticsList title="Errors" tone="error" entries={viewModel.errors} />
        <ModuleDiagnosticsList title="Diagnostics" tone="neutral" entries={viewModel.diagnostics} />
      </div>
    </section>
  );
}
