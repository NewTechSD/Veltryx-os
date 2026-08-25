import type { KernelStatus, KernelStatusSnapshot } from "./kernel-status-types";

export interface HealthStatusResponse {
  readonly status: "ok" | "error";
  readonly kernel: KernelStatus;
  readonly timestamp: string;
}

export function createHealthStatusResponse(
  snapshot: KernelStatusSnapshot,
  now: () => Date = () => new Date()
): HealthStatusResponse {
  return {
    status: snapshot.kernelStatus === "ready" ? "ok" : "error",
    kernel: snapshot.kernelStatus,
    timestamp: snapshot.bootTimestamp ?? now().toISOString()
  };
}
