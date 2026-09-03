import type { IRuntimeApiBridge, ApiRequestContext, ApiResponse, HealthApiView, DiagnosticsApiView } from "@veltryx/contracts";
import type { VeltryxKernel } from "../../kernel.js";

export class RuntimeApiBridge implements IRuntimeApiBridge {
  constructor(private readonly kernel: Pick<VeltryxKernel, "status" | "runtime" | "configuration" | "metadata" | "components" | "uiComposition" | "auth">, private readonly now: () => Date = () => new Date()) {}

  async health(context?: ApiRequestContext): Promise<ApiResponse<HealthApiView>> {
    const configuration = this.kernel.configuration().snapshot();
    const runtime = this.kernel.runtime().snapshot();
    return this.success({ status: "ok", appName: configuration.appName, appVersion: configuration.appVersion, environment: configuration.environment, uptimeMs: runtime?.uptimeMs }, context);
  }

  async status(context?: ApiRequestContext): Promise<ApiResponse<Record<string, unknown>>> {
    const snapshot = await this.kernel.status({ includeTechnicalDetails: false }).snapshot();
    return this.success(sanitize(snapshot) as Record<string, unknown>, context);
  }

  async diagnostics(context?: ApiRequestContext): Promise<ApiResponse<DiagnosticsApiView>> {
    const snapshot = await this.kernel.status({ includeTechnicalDetails: false }).snapshot();
    const diagnostics = (snapshot.diagnostics ?? []).slice(0, 50).map((entry) => ({ code: entry.code, message: entry.message, level: entry.severity === "error" ? "error" : entry.severity === "warning" ? "warning" : "info", timestamp: snapshot.bootTimestamp ?? this.now().toISOString() } as const));
    return this.success({ diagnostics, warnings: snapshot.warnings.slice(0, 50).map(issue), errors: snapshot.errors.slice(0, 50).map(issue) }, context);
  }

  async runtimeStatus(context?: ApiRequestContext): Promise<ApiResponse<Record<string, unknown>>> { return this.success(sanitize(this.kernel.runtime().snapshot() ?? { status: this.kernel.runtime().state() }) as Record<string, unknown>, context); }

  async configuration(context?: ApiRequestContext): Promise<ApiResponse<Record<string, unknown>>> {
    const value = this.kernel.configuration().snapshot();
    return this.success({ appName: value.appName, appVersion: value.appVersion, environment: value.environment, runtimeMode: value.runtimeMode, debugEnabled: value.debugEnabled, sources: value.sources.map((source) => ({ name: source.name, type: source.type, loadedKeys: source.loadedKeys.filter(publicKey) })) }, context);
  }

  async metadata(input: { limit?: number; offset?: number } = {}, context?: ApiRequestContext): Promise<ApiResponse<Record<string, unknown>>> {
    if (!validPage(input)) return this.error("api.input.invalidPagination", "Pagination is invalid.", 400, context);
    const value = this.kernel.metadata().snapshot();
    return this.success({ status: value.status, namespaces: value.namespacesRegistered, resources: value.resourcesRegistered, entities: value.entitiesRegistered, pages: value.pagesRegistered, warnings: value.warnings.slice(0, 50).map(issue), errors: value.errors.slice(0, 50).map(issue) }, context);
  }

  async components(input: { limit?: number; offset?: number } = {}, context?: ApiRequestContext): Promise<ApiResponse<Record<string, unknown>>> {
    if (!validPage(input)) return this.error("api.input.invalidPagination", "Pagination is invalid.", 400, context);
    const value = this.kernel.components().snapshot();
    return this.success({ status: value.status, count: value.componentsRegistered, componentsByType: value.componentsByType, componentsByCategory: value.componentsByCategory, components: value.components.slice(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 100)).map((component) => ({ key: component.key, version: component.version, type: component.type, category: component.category, label: component.label, capabilities: component.capabilities })) }, context);
  }

  async uiComposition(input: { limit?: number; offset?: number } = {}, context?: ApiRequestContext): Promise<ApiResponse<Record<string, unknown>>> {
    if (!validPage(input)) return this.error("api.input.invalidPagination", "Pagination is invalid.", 400, context);
    const value = this.kernel.uiComposition().snapshot();
    return this.success({ status: value.status, compositionsGenerated: value.compositionsGenerated, lastSourceType: value.lastSourceType, lastSourceId: value.lastSourceId }, context);
  }

  private success<T>(data: T, context?: ApiRequestContext): ApiResponse<T> { return Object.freeze({ ok: true as const, data: freeze(data), meta: meta(context, this.now(), this.kernel.auth()), warnings: [], diagnostics: [] }); }
  private error<T>(code: string, message: string, statusCode: number, context?: ApiRequestContext): ApiResponse<T> { return Object.freeze({ ok: false as const, error: { code, message, statusCode }, meta: meta(context, this.now(), this.kernel.auth()), warnings: [], diagnostics: [] }); }
}

function meta(context: ApiRequestContext | undefined, now: Date, auth: { snapshot(): { defaultPrincipalKind: "anonymous" | "system" | "user" | "service"; defaultSessionStatus: "anonymous" | "authenticated" | "system" | "expired" | "invalid"; defaultTenantId: string; defaultWorkspaceId: string } }) { const value = auth.snapshot(); return Object.freeze({ apiVersion: "v1" as const, requestId: safeId(context?.requestId) ?? `req-${now.getTime()}`, generatedAt: now.toISOString(), auth: { principalKind: value.defaultPrincipalKind, sessionStatus: value.defaultSessionStatus, tenantId: safeId(context?.tenantId) ?? value.defaultTenantId, workspaceId: safeId(context?.workspaceId) ?? value.defaultWorkspaceId } }); }
function safeId(value?: string): string | undefined { return value && /^[a-zA-Z0-9._:-]{1,128}$/.test(value) ? value : undefined; }
function validPage(input: { limit?: number; offset?: number }): boolean { return (input.limit === undefined || (Number.isInteger(input.limit) && input.limit >= 1 && input.limit <= 100)) && (input.offset === undefined || (Number.isInteger(input.offset) && input.offset >= 0)); }
function publicKey(key: string): boolean { return !/(secret|token|password|credential|private|apikey|connection|string|database|jwt|session|cookie)/i.test(key); }
function issue(entry: { code: string; message: string }) { return { code: entry.code, message: entry.message }; }
function sanitize(value: unknown): unknown { if (Array.isArray(value)) return value.slice(0, 100).map(sanitize); if (!value || typeof value !== "object") return value; const output: Record<string, unknown> = {}; for (const [key, child] of Object.entries(value)) { if (/stack|secret|token|password|credential|connection|string|database|env|provider|repository|records|tree|nodes|props/i.test(key)) continue; output[key] = sanitize(child); } return output; }
function freeze<T>(value: T): T { if (!value || typeof value !== "object") return value; Object.freeze(value); for (const child of Object.values(value as Record<string, unknown>)) freeze(child); return value; }
