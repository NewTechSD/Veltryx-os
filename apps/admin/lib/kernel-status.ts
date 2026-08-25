import { getKernelStatusSnapshot } from "./kernel-status-adapter";
import type {
  KernelSnapshotAvailability,
  KernelSnapshotMetric,
  KernelStatusCard,
  KernelStatusSnapshot,
  KernelStatusViewModel
} from "./kernel-status-types";

export type {
  KernelSnapshotAvailability,
  KernelSnapshotIssue,
  KernelSnapshotMetric,
  KernelStatus,
  KernelStatusCard,
  KernelStatusSnapshot,
  KernelStatusSummary,
  KernelStatusViewModel
} from "./kernel-status-types";

export async function getKernelStatusViewModel(): Promise<KernelStatusViewModel> {
  return createKernelStatusViewModel(await getKernelStatusSnapshot());
}

export function createKernelStatusViewModel(snapshot: KernelStatusSnapshot): KernelStatusViewModel {
  const cards = createCards(snapshot);

  return {
    status: snapshot.kernelStatus,
    statusLabel: snapshot.kernelStatus === "error" ? "Kernel Status: Error" : `Kernel ${titleCase(snapshot.kernelStatus)}`,
    generatedAt: snapshot.bootTimestamp ?? "Kernel boot timestamp unavailable",
    summary: {
      ready: cards.filter((card) => card.tone === "success").length,
      unavailable: cards.filter((card) => card.state === "Unavailable" || card.state === "Not Bootstrapped").length,
      notImplemented: cards.filter((card) => card.state === "Not Implemented").length,
      errors: snapshot.errors.length
    },
    cards,
    errors: snapshot.errors,
    warnings: snapshot.warnings
  };
}

function createCards(snapshot: KernelStatusSnapshot): readonly KernelStatusCard[] {
  return [
    {
      id: "kernel-status",
      title: "Kernel Status",
      value: snapshot.kernelStatus === "error" ? "Error" : titleCase(snapshot.kernelStatus),
      description:
        snapshot.kernelStatus === "error"
          ? errorDescription(snapshot)
          : "Status returned after server-side Kernel bootstrap, initialize, and ready lifecycle calls.",
      state: titleCase(snapshot.kernelStatus),
      scope: "Kernel",
      tone: snapshot.kernelStatus === "error" ? "critical" : "success"
    },
    metricCard("modules-discovered", "Modules Discovered", snapshot.modulesDiscovered, "Modules"),
    metricCard("modules-resolved", "Modules Resolved", snapshot.modulesResolved, "Modules"),
    metricCard("modules-loaded", "Modules Loaded", snapshot.modulesLoaded, "Modules"),
    metricCard("service-registry", "Services Registered", snapshot.servicesRegistered, "Services"),
    {
      id: "metadata-registry",
      title: "Metadata Registry",
      value: availabilityValue(snapshot.metadataRegistryStatus.status),
      description: snapshot.metadataRegistryStatus.detail,
      state: availabilityState(snapshot.metadataRegistryStatus.status),
      scope: "Metadata",
      tone: availabilityTone(snapshot.metadataRegistryStatus.status)
    },
    {
      id: "runtime",
      title: "Runtime",
      value: titleCase(snapshot.runtimeStatus),
      description: "Runtime state reported by the Kernel public status snapshot.",
      state: titleCase(snapshot.runtimeStatus),
      scope: "Runtime",
      tone: snapshot.runtimeStatus === "ready" ? "success" : availabilityTone(snapshot.runtimeStatus)
    },
    {
      id: "environment",
      title: "Environment",
      value: snapshot.environment,
      description: "Execution environment reported by the Kernel public status snapshot.",
      state: "Available",
      scope: "Admin",
      tone: "success"
    }
  ];
}

function metricCard(
  id: string,
  title: string,
  metric: KernelSnapshotMetric,
  scope: string
): KernelStatusCard {
  return {
    id,
    title,
    value: metric.value === undefined ? availabilityValue(metric.status) : String(metric.value),
    description: metric.detail,
    state: availabilityState(metric.status),
    scope,
    tone: availabilityTone(metric.status)
  };
}

function availabilityValue(status: KernelSnapshotAvailability | string): string {
  return status === "available" ? "Available" : availabilityState(status);
}

function availabilityState(status: KernelSnapshotAvailability | string): string {
  if (status === "notBootstrapped") {
    return "Not Bootstrapped";
  }

  if (status === "notImplemented") {
    return "Not Implemented";
  }

  return titleCase(status);
}

function availabilityTone(status: KernelSnapshotAvailability | string): KernelStatusCard["tone"] {
  if (status === "available" || status === "ready") {
    return "success";
  }

  if (status === "notBootstrapped" || status === "unavailable") {
    return "critical";
  }

  return "warning";
}

function errorDescription(snapshot: KernelStatusSnapshot): string {
  return snapshot.errors[0]?.message ?? "Kernel bootstrap failed before a ready snapshot was available.";
}

function titleCase(value: string): string {
  const spaced = value.replace(/([a-z])([A-Z])/g, "$1 $2");

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

