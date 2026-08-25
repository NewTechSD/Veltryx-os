export function ModuleEmptyState() {
  return (
    <div className="mt-5 rounded-md border border-dashed border-line bg-white p-8 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-ink">Nenhum módulo encontrado ainda.</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted">
        O Kernel está pronto, mas nenhum módulo foi descoberto, resolvido ou carregado neste
        ambiente.
      </p>
    </div>
  );
}
