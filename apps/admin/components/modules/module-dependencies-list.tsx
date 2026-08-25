import type { ModuleDependencyViewModel } from "../../lib/module-system-view-model";

export function ModuleDependenciesList({
  dependencies,
  title
}: Readonly<{ dependencies: readonly ModuleDependencyViewModel[]; title: string }>) {
  return (
    <div className="rounded-md border border-line p-4">
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      {dependencies.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No dependencies.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {dependencies.map((dependency) => (
            <li
              className="border-t border-line pt-3 first:border-t-0 first:pt-0"
              key={`${dependency.moduleId}:${dependency.version ?? "any"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{dependency.moduleId}</span>
                <span className="text-xs font-medium text-muted">{dependency.statusLabel}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {dependency.requiredLabel}
                {dependency.version ? ` · ${dependency.version}` : ""}
              </p>
              {dependency.reason ? (
                <p className="mt-2 text-sm leading-5 text-muted">{dependency.reason}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
