export function ModuleSummaryCard({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-normal text-muted">{label}</div>
    </div>
  );
}
