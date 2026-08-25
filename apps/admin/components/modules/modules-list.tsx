import type { ModuleCardViewModel } from "../../lib/module-system-view-model";

import { ModuleCard } from "./module-card";

export function ModulesList({ modules }: Readonly<{ modules: readonly ModuleCardViewModel[] }>) {
  if (modules.length === 0) {
    return (
      <p className="mt-5 rounded-md border border-line bg-white p-5 text-sm text-muted">
        No module records available.
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-4" aria-label="Module list">
      {modules.map((module) => (
        <ModuleCard key={module.id} module={module} />
      ))}
    </div>
  );
}
