export type AuthTenantStatus = "active" | "inactive" | "unknown";
export type TenantContext = { readonly id: string; readonly slug?: string; readonly name?: string; readonly status: AuthTenantStatus; readonly metadata: Readonly<Record<string, string | number | boolean | null>> };
export type WorkspaceStatus = "active" | "inactive" | "unknown";
export type WorkspaceContext = { readonly id: string; readonly tenantId: string; readonly slug?: string; readonly name?: string; readonly status: WorkspaceStatus; readonly metadata: Readonly<Record<string, string | number | boolean | null>> };
