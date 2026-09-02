import { AppShell } from "../../../../../components/app-shell";
import { DynamicScreenRenderer } from "../../../../../components/dynamic/dynamic-screen-renderer";
import { getAdminCompositionScreenViewModel } from "../../../../../lib/runtime/admin-composition-adapter";

export const dynamic = "force-dynamic";

export default async function DynamicRuntimePage({ params }: Readonly<{ params: Promise<{ sourceType: string; namespace: string; sourceId: string }> }>) {
  const input = await params;
  const viewModel = await getAdminCompositionScreenViewModel(input);
  const statusLabel = viewModel.status === "ready" ? "Ready" : viewModel.status === "warning" ? "Warning" : viewModel.status === "empty" ? "Empty" : "Error";
  return <AppShell statusLabel={statusLabel} generatedAt={viewModel.generatedAt}><DynamicScreenRenderer viewModel={viewModel} /></AppShell>;
}
