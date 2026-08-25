export type { EventType } from "@veltryx/contracts";

export const KERNEL_EVENT_TYPES = ["kernel", "module", "metadata", "runtime", "system"] as const;

export function isKernelEventType(candidate: unknown): candidate is (typeof KERNEL_EVENT_TYPES)[number] {
  return typeof candidate === "string" && KERNEL_EVENT_TYPES.includes(candidate as never);
}
