import { AppShell } from "../../components/app-shell";
import { StatusSummary } from "../../components/status-summary";
import { createKernelStatusViewModel } from "../../lib/kernel-status";
import { getKernelStatusSnapshot } from "../../lib/kernel-status-adapter";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const snapshot = await getKernelStatusSnapshot();
  const viewModel = createKernelStatusViewModel(snapshot);

  return (
    <AppShell statusLabel={viewModel.statusLabel} generatedAt={viewModel.generatedAt}>
      <StatusSummary snapshot={snapshot} />
    </AppShell>
  );
}
