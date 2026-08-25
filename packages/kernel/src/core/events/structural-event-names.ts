import type { KernelStructuralEventName, ModuleSystemStructuralEventName, StructuralEventName } from "@veltryx/contracts";

export const KERNEL_STRUCTURAL_EVENTS = {
  bootstrapStarted: "kernel.bootstrap.started",
  bootstrapCompleted: "kernel.bootstrap.completed",
  bootstrapFailed: "kernel.bootstrap.failed",
  ready: "kernel.ready"
} as const satisfies Record<string, KernelStructuralEventName>;

export const MODULE_SYSTEM_STRUCTURAL_EVENTS = {
  discoveryStarted: "module.discovery.started",
  discoveryCompleted: "module.discovery.completed",
  discoveryFailed: "module.discovery.failed",
  resolutionStarted: "module.resolution.started",
  resolutionCompleted: "module.resolution.completed",
  resolutionFailed: "module.resolution.failed",
  loadingStarted: "module.loading.started",
  loadingCompleted: "module.loading.completed",
  loadingFailed: "module.loading.failed"
} as const satisfies Record<string, ModuleSystemStructuralEventName>;

export const STRUCTURAL_EVENT_NAMES: readonly StructuralEventName[] = [
  KERNEL_STRUCTURAL_EVENTS.bootstrapStarted,
  KERNEL_STRUCTURAL_EVENTS.bootstrapCompleted,
  KERNEL_STRUCTURAL_EVENTS.bootstrapFailed,
  KERNEL_STRUCTURAL_EVENTS.ready,
  MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryStarted,
  MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryCompleted,
  MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryFailed,
  MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionStarted,
  MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionCompleted,
  MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionFailed,
  MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingStarted,
  MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingCompleted,
  MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingFailed
];
