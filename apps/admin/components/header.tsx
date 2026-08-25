export function Header({
  generatedAt,
  statusLabel
}: Readonly<{ generatedAt: string; statusLabel: string }>) {
  return (
    <header className="border-b border-line bg-white">
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-muted">Kernel Control Surface</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">Platform Status</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 font-medium text-ok">
            <span className="h-2 w-2 rounded-full bg-ok" />
            {statusLabel}
          </span>
          <span className="rounded-md border border-line bg-surface px-3 py-2 text-muted">{generatedAt}</span>
        </div>
      </div>
    </header>
  );
}
