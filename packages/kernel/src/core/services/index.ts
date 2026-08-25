export { createServiceDescriptor, freezeDescriptor } from "./service-descriptor.js";
export { createRegistrySummaryDiagnostics } from "./service-registry-diagnostics.js";
export { KernelServiceRegistry, type KernelServiceRegistryOptions } from "./service-registry.js";
export { createServiceRegistrySnapshot } from "./service-registry-snapshot.js";
export { ServiceRegistryValidator } from "./service-registry-validator.js";
export {
  KERNEL_SERVICE_TOKENS,
  freezeServiceToken,
  serviceTokenId,
  validateServiceTokenId
} from "./service-token.js";
export type { InternalServiceRegistration } from "./service-registration.js";
export type {
  IServiceRegistry,
  ServiceCategory,
  ServiceDescriptor,
  ServiceDescriptorInput,
  ServiceDescriptorSnapshot,
  ServiceLifecycle,
  ServiceProvider,
  ServiceRegistrationOptions,
  ServiceRegistryDiagnosticEntry,
  ServiceRegistryError,
  ServiceRegistrySnapshot,
  ServiceRegistryStatus,
  ServiceRegistryWarning,
  ServiceScope,
  ServiceStatus,
  ServiceToken
} from "@veltryx/contracts";
