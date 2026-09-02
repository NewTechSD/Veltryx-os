import { AppShell } from "../../components/app-shell";
import { DiagnosticsPanel } from "../../components/diagnostics-panel";
import { createDiagnosticsStatus } from "../../lib/diagnostics-status";
import { createKernelStatusViewModel } from "../../lib/kernel-status";
import { getKernelStatusSnapshot } from "../../lib/kernel-status-adapter";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage() {
  const snapshot = await getKernelStatusSnapshot();
  const viewModel = createKernelStatusViewModel(snapshot);
  const diagnostics = createDiagnosticsStatus(snapshot, {
    uptimeSeconds: process.uptime(),
    includeTechnicalDetails: snapshot.environment === "development"
  });

  return (
    <AppShell currentPath="/diagnostics" statusLabel={viewModel.statusLabel} generatedAt={viewModel.generatedAt}>
      <DiagnosticsPanel diagnostics={diagnostics} />
    </AppShell>
  );
}
