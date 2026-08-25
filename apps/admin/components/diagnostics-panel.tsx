import type { DiagnosticsStatus } from "../lib/diagnostics-status";

import { DiagnosticsEntry } from "./diagnostics-entry";

export function DiagnosticsPanel({ diagnostics }: Readonly<{ diagnostics: DiagnosticsStatus }>) {
  const facts = [
    ["App Name", diagnostics.appName],
    ["App Version", diagnostics.appVersion],
    ["Environment", diagnostics.environment],
    ["Boot Timestamp", diagnostics.bootTimestamp],
    ["Uptime", diagnostics.uptime],
    ["Kernel", diagnostics.kernelStatus],
    ["Bootstrap", diagnostics.bootStatus],
    ["Runtime", diagnostics.runtimeStatus],
    ["Module System", diagnostics.moduleSystemStatus.status],
    ["Metadata Registry", diagnostics.metadataRegistryStatus.status]
  ] as const;

  return (
    <section className="mx-auto w-full max-w-7xl" id="diagnostics">
      <div className="border-b border-line pb-5">
        <p className="text-sm font-medium uppercase tracking-normal text-muted">Operational Diagnostics</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">Diagnostics</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Structured diagnostics from the Kernel public snapshot for local, preview, and initial production validation.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {facts.map(([label, value]) => (
          <div className="rounded-md border border-line bg-white p-4 shadow-sm" key={label}>
            <div className="text-xs font-medium uppercase tracking-normal text-muted">{label}</div>
            <div className="mt-2 break-words text-lg font-semibold text-ink">{String(value)}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <StatusBlock title="Module System" rows={[ ["Discovered", diagnostics.moduleSystemStatus.discovered.status], ["Resolved", diagnostics.moduleSystemStatus.resolved.status], ["Loaded", diagnostics.moduleSystemStatus.loaded.status] ]} />
        <StatusBlock title="Metadata Registry" rows={[ ["Status", diagnostics.metadataRegistryStatus.status], ["Detail", diagnostics.metadataRegistryStatus.detail] ]} />
      </div>

      <EntryGroup title="Diagnostics" entries={diagnostics.diagnostics} />
      <EntryGroup title="Warnings" entries={diagnostics.warnings} />
      <EntryGroup title="Errors" entries={diagnostics.errors} />
    </section>
  );
}

function StatusBlock({ rows, title }: Readonly<{ rows: readonly (readonly [string, string])[]; title: string }>) {
  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-normal text-muted">{title}</h3>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div className="flex justify-between gap-4 text-sm" key={label}>
            <dt className="text-muted">{label}</dt>
            <dd className="break-words text-right font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EntryGroup({ entries, title }: Readonly<{ entries: DiagnosticsStatus["diagnostics"]; title: string }>) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold uppercase tracking-normal text-muted">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 rounded-md border border-line bg-white p-4 text-sm text-muted shadow-sm">None</p>
      ) : (
        <div className="mt-3 grid gap-3">
          {entries.map((entry) => (
            <DiagnosticsEntry entry={entry} key={`${entry.source}:${entry.code}:${entry.message}`} />
          ))}
        </div>
      )}
    </div>
  );
}
