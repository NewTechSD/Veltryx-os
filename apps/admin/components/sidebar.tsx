import { getAdminNavigationViewModel } from "../lib/navigation/admin-navigation-adapter";
import type { AdminNavigationViewModel } from "../lib/navigation/admin-navigation-view-model";
import { AdminNavigation } from "./navigation/admin-navigation";

export function Sidebar({ currentPath, navigation }: Readonly<{ currentPath?: string; navigation?: AdminNavigationViewModel }> = {}) {
  const viewModel = navigation ?? getAdminNavigationViewModel({ currentPath });
  return <aside className="border-b border-zinc-200 bg-zinc-950 text-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:border-zinc-800"><div className="flex items-center justify-between gap-4 px-5 py-5 lg:block lg:px-6 lg:py-7"><div><div className="text-xl font-semibold tracking-normal">Veltryx</div><div className="mt-1 text-xs font-medium uppercase tracking-normal text-emerald-300">Admin Shell</div></div><div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200 lg:mt-6 lg:inline-block">Online</div></div><AdminNavigation viewModel={viewModel} /></aside>;
}
