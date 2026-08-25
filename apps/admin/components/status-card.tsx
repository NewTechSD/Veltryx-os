import type { KernelStatusCard } from "../lib/kernel-status";

const toneStyles: Record<KernelStatusCard["tone"], string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-800",
  neutral: "border-line bg-white text-ink",
  success: "border-emerald-200 bg-emerald-50 text-ok",
  warning: "border-amber-200 bg-amber-50 text-warn"
};

const badgeStyles: Record<KernelStatusCard["tone"], string> = {
  critical: "bg-rose-700",
  neutral: "bg-zinc-500",
  success: "bg-ok",
  warning: "bg-warn"
};

export function StatusCard({ card }: Readonly<{ card: KernelStatusCard }>) {
  return (
    <article className={`rounded-md border p-4 shadow-sm ${toneStyles[card.tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-normal text-muted">{card.title}</h3>
          <p className="mt-2 text-xl font-semibold leading-tight text-ink">{card.value}</p>
        </div>
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${badgeStyles[card.tone]}`} />
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">{card.description}</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-current/10 pt-3 text-xs font-medium uppercase tracking-normal text-muted">
        <span>{card.scope}</span>
        <span>{card.state}</span>
      </div>
    </article>
  );
}
