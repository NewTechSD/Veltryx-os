const navigationItems = [
  { label: "Overview", href: "/" },
  { label: "Status", href: "/status" },
  { label: "Diagnostics", href: "/diagnostics" },
  { label: "Kernel", href: "/#dashboard" },
  { label: "Modules", href: "/modules" },
  { label: "Dynamic Screen", href: "/runtime/page/system/admin-overview" },
  { label: "Services", href: "/#dashboard" },
  { label: "Metadata", href: "/#dashboard" },
  { label: "Runtime", href: "/#dashboard" }
] as const;

export function Sidebar() {
  return (
    <aside className="border-b border-zinc-200 bg-zinc-950 text-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:border-zinc-800">
      <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block lg:px-6 lg:py-7">
        <div>
          <div className="text-xl font-semibold tracking-normal">Veltryx</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-normal text-emerald-300">Admin Shell</div>
        </div>
        <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200 lg:mt-6 lg:inline-block">
          Online
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:px-3 lg:pb-0">
        {navigationItems.map((item) => (
          <a
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white lg:flex"
            href={item.href}
            key={item.label}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
