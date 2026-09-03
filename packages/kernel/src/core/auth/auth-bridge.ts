import type { AuthBridgeSnapshot, AuthContext, AuthResolutionInput, AuthSession, IAuthBridge, Principal, TenantContext, WorkspaceContext } from "@veltryx/contracts";

export class AuthBridge implements IAuthBridge {
  private resolvedContexts = 0;
  private anonymousContexts = 0;
  private systemContexts = 0;
  private readonly warnings: { code: string; message: string }[] = [];
  private readonly diagnostics: { code: string; message: string; level: "info" | "warning" | "error"; timestamp: string }[] = [];
  constructor(private readonly now: () => Date = () => new Date()) {}
  resolve(input: AuthResolutionInput = {}): AuthContext { return input.mode === "system" || input.mode === "internal" ? this.system(input) : this.anonymous(input); }
  anonymous(input: AuthResolutionInput = {}): AuthContext { this.anonymousContexts++; return this.create("anonymous", input); }
  system(input: AuthResolutionInput = {}): AuthContext { this.systemContexts++; return this.create("system", { ...input, mode: "system" }); }
  snapshot(): AuthBridgeSnapshot { return Object.freeze({ status: this.warnings.length ? "warning" : "ready", generatedAt: this.now().toISOString(), defaultPrincipalKind: "anonymous", defaultSessionStatus: "anonymous", defaultTenantId: "default", defaultWorkspaceId: "default", resolvedContexts: this.resolvedContexts, anonymousContexts: this.anonymousContexts, systemContexts: this.systemContexts, warnings: Object.freeze([...this.warnings]), diagnostics: Object.freeze([...this.diagnostics]) }); }
  private create(kind: "anonymous" | "system", input: AuthResolutionInput): AuthContext {
    this.resolvedContexts++;
    const principal: Principal = Object.freeze({ id: kind, kind, status: kind === "system" ? "active" : "unknown", roles: Object.freeze(kind === "system" ? ["system"] : []), claims: Object.freeze({}) });
    const session: AuthSession = Object.freeze({ id: `${kind}-session`, status: kind === "system" ? "system" : "anonymous", principal, metadata: Object.freeze({}) });
    const tenant: TenantContext = Object.freeze({ id: safe(input.tenantHint?.id) ?? "default", slug: safe(input.tenantHint?.slug) ?? "default", name: "Default Tenant", status: "active", metadata: Object.freeze({}) });
    const workspace: WorkspaceContext = Object.freeze({ id: safe(input.workspaceHint?.id) ?? "default", tenantId: tenant.id, slug: safe(input.workspaceHint?.slug) ?? "default", name: "Default Workspace", status: "active", metadata: Object.freeze({}) });
    return Object.freeze({ session, principal, tenant, workspace, resolvedAt: this.now().toISOString(), warnings: Object.freeze([]), diagnostics: Object.freeze([]) });
  }
}
function safe(value?: string): string | undefined { return value && /^[a-zA-Z0-9._:-]{1,128}$/.test(value) ? value : undefined; }
