import type { KernelStatusViewModel } from "../lib/kernel-status";

import { StatusCard } from "./status-card";

export function KernelDashboard({ dashboard }: Readonly<{ dashboard: KernelStatusViewModel }>) {
  return (
    <section className="mx-auto w-full max-w-7xl" id="dashboard">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-md border border-line bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-normal text-muted">Administrative Dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">Kernel readiness overview</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Server-side snapshot from the Veltryx Kernel adapter. It reports platform surfaces only and does not create APIs, authentication, persistence, or business capabilities.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-md border border-line bg-white p-5 shadow-sm sm:p-6">
          <div>
            <div className="text-2xl font-semibold text-ink">{dashboard.summary.ready}</div>
            <div className="mt-1 text-sm text-muted">Available</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-ink">{dashboard.summary.unavailable}</div>
            <div className="mt-1 text-sm text-muted">Unavailable</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-ink">{dashboard.summary.notImplemented}</div>
            <div className="mt-1 text-sm text-muted">Not implemented</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-ink">{dashboard.summary.errors}</div>
            <div className="mt-1 text-sm text-muted">Errors</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboard.cards.map((card) => (
          <StatusCard card={card} key={card.id} />
        ))}
      </div>
    </section>
  );
}
