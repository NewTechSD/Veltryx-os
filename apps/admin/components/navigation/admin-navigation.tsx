import type { AdminNavigationViewModel } from "../../lib/navigation/admin-navigation-view-model";

export function AdminNavigation({ viewModel }: Readonly<{ viewModel: AdminNavigationViewModel }>) {
  if (viewModel.status === "error") return <NavigationFallback tone="error" title="Navigation unavailable" description="Use a known Admin URL or try again." />;
  if (viewModel.status === "empty" || viewModel.groups.length === 0) return <NavigationFallback tone="empty" title="Navigation is empty" description="No menu items are currently available." />;
  return <nav aria-label="Admin navigation" className="space-y-4 px-3 pb-4">{viewModel.groups.map((group) => <section aria-labelledby={`navigation-group-${group.id}`} key={group.id}><h2 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500" id={`navigation-group-${group.id}`}>{group.label}</h2>{group.items.length ? <div className="flex gap-1 overflow-x-auto lg:block lg:space-y-1">{group.items.map((item) => item.disabled ? <span aria-disabled="true" className="flex cursor-not-allowed items-center justify-between whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-zinc-600" key={item.id} title={item.description}>{item.label}{item.badge && <NavigationBadge>{item.badge}</NavigationBadge>}</span> : <a aria-current={item.active ? "page" : undefined} className={item.active ? "flex items-center justify-between whitespace-nowrap rounded-md bg-emerald-400/15 px-3 py-2 text-sm font-semibold text-emerald-200" : "flex items-center justify-between whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"} href={item.href} key={item.id} title={item.description}>{item.label}{item.badge && <NavigationBadge>{item.badge}</NavigationBadge>}</a>)}</div> : <p className="px-3 text-sm text-zinc-500">Empty group.</p>}</section>)}</nav>;
}

function NavigationBadge({ children }: Readonly<{ children: string }>) { return <span className="ml-3 rounded-full border border-zinc-600 px-2 py-0.5 text-xs">{children}</span>; }

function NavigationFallback({ title, description, tone }: Readonly<{ title: string; description: string; tone: "empty" | "error" }>) {
  return <div className={tone === "error" ? "mx-3 mb-4 rounded-md border border-red-900 bg-red-950/40 p-3 text-red-200" : "mx-3 mb-4 rounded-md border border-zinc-700 bg-zinc-900 p-3 text-zinc-400"} role={tone === "error" ? "alert" : "status"}><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs">{description}</p></div>;
}
