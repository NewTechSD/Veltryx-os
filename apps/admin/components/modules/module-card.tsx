import type { ModuleCardViewModel } from "../../lib/module-system-view-model";

import { ModuleDependenciesList } from "./module-dependencies-list";
import { ModuleDiagnosticsList } from "./module-diagnostics-list";

export function ModuleCard({ module }: Readonly<{ module: ModuleCardViewModel }>) {
  const states = [
    ["State", module.stateLabel],
    ["Status", module.statusLabel],
    ["Discovery", module.discoveryStatusLabel],
    ["Resolution", module.resolutionStatusLabel],
    ["Loading", module.loadingStatusLabel]
  ] as const;

  return (
    <article className="rounded-md border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-ink">{module.name}</h3>
          <p className="mt-1 text-sm text-muted">
            <span className="font-medium text-ink">{module.id}</span> · v{module.version}
          </p>
          {module.description ? (
            <p className="mt-3 text-sm leading-6 text-muted">{module.description}</p>
          ) : null}
        </div>
        <span className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink">
          {module.statusLabel}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {states.map(([label, value]) => (
          <div className="rounded-md bg-surface p-3" key={label}>
            <dt className="text-xs font-medium uppercase text-muted">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted">
        <span>{module.dependenciesCount} required dependencies</span>
        <span>·</span>
        <span>{module.optionalDependenciesCount} optional dependencies</span>
        <span>·</span>
        <span>{module.warningsCount} warnings</span>
        <span>·</span>
        <span>{module.errorsCount} errors</span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ModuleDependenciesList title="Required dependencies" dependencies={module.dependencies} />
        <ModuleDependenciesList
          title="Optional dependencies"
          dependencies={module.optionalDependencies}
        />
      </div>
      {module.warnings.length > 0 || module.errors.length > 0 ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <ModuleDiagnosticsList title="Module warnings" tone="warning" entries={module.warnings} />
          <ModuleDiagnosticsList title="Module errors" tone="error" entries={module.errors} />
        </div>
      ) : null}
    </article>
  );
}
