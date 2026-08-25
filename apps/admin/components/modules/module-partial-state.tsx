import type { ModuleSystemViewModel } from "../../lib/module-system-view-model";

export function ModulePartialState({ viewModel }: Readonly<{ viewModel: ModuleSystemViewModel }>) {
  const availability = [
    ["Modules", viewModel.hasModules],
    ["Warnings", viewModel.warnings.length > 0],
    ["Errors", viewModel.errors.length > 0],
    ["Diagnostics", viewModel.diagnostics.length > 0]
  ] as const;

  return (
    <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold text-amber-950">Module System parcialmente disponível.</h3>
      <p className="mt-1 text-sm leading-6 text-amber-900">
        Somente os dados presentes no snapshot público são exibidos.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-amber-950">
        {availability.map(([label, available]) => (
          <li className="rounded-md border border-amber-300 px-2 py-1" key={label}>
            {label}: {available ? "available" : "unavailable"}
          </li>
        ))}
      </ul>
    </div>
  );
}
