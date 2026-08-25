import type { ModuleDiagnosticViewModel } from "../../lib/module-system-view-model";

import { ModuleDiagnosticItem } from "./module-diagnostic-item";

const toneClasses = {
  neutral: "border-line bg-white",
  warning: "border-amber-200 bg-amber-50/40",
  error: "border-red-200 bg-red-50/50"
} as const;

export function ModuleDiagnosticsList({
  entries,
  title,
  tone
}: Readonly<{
  entries: readonly ModuleDiagnosticViewModel[];
  title: string;
  tone: keyof typeof toneClasses;
}>) {
  return (
    <section className={`rounded-md border p-4 shadow-sm ${toneClasses[tone]}`}>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted">None.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {entries.map((entry, index) => (
            <ModuleDiagnosticItem entry={entry} key={`${entry.source}:${entry.code}:${index}`} />
          ))}
        </ul>
      )}
    </section>
  );
}
