import type { KernelStatusSnapshot } from "../lib/kernel-status";

interface StatusSummaryProps {
  readonly snapshot: KernelStatusSnapshot;
}

export function StatusSummary({ snapshot }: StatusSummaryProps) {
  const metrics = [
    ["Kernel", snapshot.kernelStatus],
    ["Bootstrap", snapshot.bootStatus],
    ["Environment", snapshot.environment],
    ["Runtime", snapshot.runtimeStatus],
    ["Module System", snapshot.moduleSystemStatus.status],
    ["Metadata Registry", snapshot.metadataRegistryStatus.status]
  ] as const;

  return (
    <section className="mx-auto w-full max-w-7xl" id="status">
      <div className="border-b border-line pb-5">
        <p className="text-sm font-medium uppercase tracking-normal text-muted">Public Kernel Snapshot</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">Status</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Server-side status from the Kernel public snapshot. The Admin displays these values without inspecting Kernel internals.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value]) => (
          <div className="rounded-md border border-line bg-white p-4 shadow-sm" key={label}>
            <div className="text-xs font-medium uppercase tracking-normal text-muted">{label}</div>
            <div className="mt-2 text-lg font-semibold text-ink">{String(value)}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <MetricBlock title="Services Registered" value={snapshot.servicesRegistered.value} detail={snapshot.servicesRegistered.detail} state={snapshot.servicesRegistered.status} />
        <MetricBlock title="Modules Discovered" value={snapshot.modulesDiscovered.value} detail={snapshot.modulesDiscovered.detail} state={snapshot.modulesDiscovered.status} />
        <MetricBlock title="Modules Resolved" value={snapshot.modulesResolved.value} detail={snapshot.modulesResolved.detail} state={snapshot.modulesResolved.status} />
        <MetricBlock title="Modules Loaded" value={snapshot.modulesLoaded.value} detail={snapshot.modulesLoaded.detail} state={snapshot.modulesLoaded.status} />
      </div>

      <IssueList title="Warnings" entries={snapshot.warnings} />
      <IssueList title="Errors" entries={snapshot.errors} />
    </section>
  );
}

function MetricBlock({ detail, state, title, value }: Readonly<{ detail: string; state: string; title: string; value?: number }>) {
  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-normal text-muted">{title}</div>
          <div className="mt-2 text-xl font-semibold text-ink">{value === undefined ? state : value}</div>
        </div>
        <span className="rounded-md border border-line px-2 py-1 text-xs font-medium uppercase tracking-normal text-muted">{state}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}

function IssueList({ entries, title }: Readonly<{ entries: readonly { code: string; message: string; severity: string; source: string }[]; title: string }>) {
  return (
    <div className="mt-5 rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold uppercase tracking-normal text-muted">{title}</div>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted">None</p>
      ) : (
        <div className="mt-3 space-y-3">
          {entries.map((entry) => (
            <div className="border-t border-line pt-3 first:border-t-0 first:pt-0" key={`${entry.source}:${entry.code}:${entry.message}`}>
              <div className="text-sm font-semibold text-ink">{entry.code}</div>
              <p className="mt-1 text-sm leading-6 text-muted">{entry.message}</p>
              <div className="mt-2 text-xs font-medium uppercase tracking-normal text-muted">{entry.severity} / {entry.source}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
