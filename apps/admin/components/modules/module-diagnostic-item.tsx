import type { ModuleDiagnosticViewModel } from "../../lib/module-system-view-model";

export function ModuleDiagnosticItem({ entry }: Readonly<{ entry: ModuleDiagnosticViewModel }>) {
  return (
    <li className="border-t border-line pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{entry.code}</span>
        <span className="text-xs font-medium uppercase text-muted">
          {entry.severity} / {entry.source}
        </span>
      </div>
      <p className="mt-1 text-sm leading-6 text-muted">{entry.message}</p>
      {entry.details ? <p className="mt-2 text-xs leading-5 text-muted">{entry.details}</p> : null}
    </li>
  );
}
