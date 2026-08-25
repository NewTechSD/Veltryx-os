import { AppShell } from "../../components/app-shell";
import { ModuleSystemScreen } from "../../components/modules/module-system-screen";
import { getModuleSystemViewModel } from "../../lib/module-system-adapter";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const viewModel = await getModuleSystemViewModel();

  return (
    <AppShell statusLabel={viewModel.statusLabel} generatedAt={viewModel.generatedAt}>
      <ModuleSystemScreen viewModel={viewModel} />
    </AppShell>
  );
}
