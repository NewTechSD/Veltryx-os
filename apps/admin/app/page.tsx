import { AppShell } from "../components/app-shell";
import { KernelDashboard } from "../components/kernel-dashboard";
import { getKernelStatusViewModel } from "../lib/kernel-status";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const status = await getKernelStatusViewModel();

  return (
    <AppShell currentPath="/" statusLabel={status.statusLabel} generatedAt={status.generatedAt}>
      <KernelDashboard dashboard={status} />
    </AppShell>
  );
}
