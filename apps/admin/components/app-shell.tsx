import type { ReactNode } from "react";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell({
  children,
  currentPath,
  generatedAt,
  statusLabel
}: Readonly<{ children: ReactNode; currentPath?: string; generatedAt: string; statusLabel: string }>) {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar currentPath={currentPath} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header generatedAt={generatedAt} statusLabel={statusLabel} />
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
