import type { VeltryxKernel } from "@veltryx/kernel";

export type HostModuleManifest = Parameters<ReturnType<VeltryxKernel["modules"]>["register"]>[0];

export interface HostModuleRegistration {
  readonly manifest: HostModuleManifest;
  readonly source?: string;
}

// The host owns this allow-list. It is intentionally empty until the host
// explicitly supplies an authorized manifest; Kernel never discovers modules.
export const ADMIN_HOST_MODULE_CATALOG: readonly HostModuleRegistration[] = Object.freeze([]);
