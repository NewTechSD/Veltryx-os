import type { ServiceDescriptorSnapshot, ServiceProvider, ServiceToken } from "@veltryx/contracts";

export interface InternalServiceRegistration {
  readonly token: ServiceToken;
  readonly service?: unknown;
  readonly provider?: ServiceProvider;
  readonly descriptor: ServiceDescriptorSnapshot;
}
