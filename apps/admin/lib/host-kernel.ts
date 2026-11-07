import { VeltryxKernel } from "@veltryx/kernel";

import { ADMIN_HOST_MODULE_CATALOG, type HostModuleRegistration } from "./host-module-catalog";

export interface AdminHostKernelOptions {
  readonly registrations?: readonly HostModuleRegistration[];
}

/**
 * Composition root for the Admin host. Registration is explicit and happens
 * before Kernel.initialize(); no filesystem or package discovery is involved.
 */
export async function createAdminHostKernel(
  options: AdminHostKernelOptions = {}
): Promise<VeltryxKernel> {
  const kernel = new VeltryxKernel();
  const registrations = options.registrations ?? ADMIN_HOST_MODULE_CATALOG;

  for (const registration of registrations) {
    await kernel.modules().register(registration.manifest, registration.source);
  }

  return kernel;
}
