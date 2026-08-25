import type { ModuleDiagnosticViewModel } from "../../lib/module-system-view-model";

export function ModuleErrorState({
  errors
}: Readonly<{ errors: readonly ModuleDiagnosticViewModel[] }>) {
  return (
    <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4" role="alert">
      <h3 className="font-semibold text-red-900">Module System indisponível.</h3>
      <p className="mt-1 text-sm leading-6 text-red-800">
        A página permaneceu disponível, mas o snapshot contém falhas normalizadas.
      </p>
      {errors.length > 0 ? (
        <p className="mt-2 text-sm text-red-900">
          {errors.length} error record(s) available below.
        </p>
      ) : null}
    </div>
  );
}
