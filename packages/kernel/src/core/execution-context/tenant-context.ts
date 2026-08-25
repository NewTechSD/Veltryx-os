import type { ITenantContext, TenantStatus } from "@veltryx/contracts";

export class KernelTenantContext implements ITenantContext {
  constructor(
    readonly tenantId: string,
    readonly tenantSlug: string | undefined = undefined,
    readonly tenantName: string | undefined = undefined,
    readonly status: TenantStatus = "active"
  ) {
    Object.freeze(this);
  }
}