export type {
  KernelBootstrapCompletedPayload,
  KernelBootstrapFailedPayload,
  KernelBootstrapStartedPayload,
  KernelReadyPayload,
  KernelStructuralEventPayload,
  ModuleDiscoveryCompletedPayload,
  ModuleDiscoveryFailedPayload,
  ModuleDiscoveryStartedPayload,
  ModuleLoadingCompletedPayload,
  ModuleLoadingFailedPayload,
  ModuleLoadingStartedPayload,
  ModuleResolutionCompletedPayload,
  ModuleResolutionFailedPayload,
  ModuleResolutionStartedPayload,
  ModuleSystemStructuralEventPayload,
  StructuralEventErrorPayload,
  StructuralEventPayload
} from "@veltryx/contracts";

export function normalizeStructuralEventError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return {
    name: "Error",
    message: "Unknown structural event failure"
  };
}
