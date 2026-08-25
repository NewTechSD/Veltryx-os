import type { KernelSnapshotIssue } from "../lib/kernel-status";

export function DiagnosticsEntry({ entry }: Readonly<{ entry: KernelSnapshotIssue }>) {
  return (
    <article className="rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{entry.code}</h3>
        <span className="rounded-md border border-line px-2 py-1 text-xs font-medium uppercase tracking-normal text-muted">
          {entry.severity} / {entry.source}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{entry.message}</p>
      {entry.detail ? <p className="mt-2 text-sm leading-6 text-muted">{entry.detail}</p> : null}
    </article>
  );
}

