import { NextResponse } from "next/server";
import { VeltryxKernel, createBootstrapContext } from "@veltryx/kernel";
type ApiRequestContext = { readonly apiVersion?: "v1"; readonly correlationId?: string; readonly requestId?: string; readonly tenantId?: string; readonly workspaceId?: string };
type ApiResponse<T = unknown> = { readonly ok: true; readonly data: T; readonly [key: string]: unknown } | { readonly ok: false; readonly error: { readonly code: string; readonly message: string; readonly statusCode: number }; readonly [key: string]: unknown };

export async function getRuntimeApiBridge() {
  const kernel = new VeltryxKernel();
  const context = createBootstrapContext();
  await kernel.bootstrap(context);
  await kernel.initialize(context);
  await kernel.ready(context);
  return kernel.runtimeApi();
}

export function requestContext(request: Request): ApiRequestContext {
  const safe = (value: string | null) => value && /^[a-zA-Z0-9._:-]{1,128}$/.test(value) ? value : undefined;
  return { apiVersion: "v1", requestId: safe(request.headers.get("x-request-id")), correlationId: safe(request.headers.get("x-correlation-id")), tenantId: safe(request.headers.get("x-tenant-id")), workspaceId: safe(request.headers.get("x-workspace-id")) };
}

export function jsonResponse<T>(response: ApiResponse<T>): NextResponse { return NextResponse.json(response, { status: response.ok ? 200 : response.error.statusCode, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }

export async function handleApi(request: Request, action: (context: ApiRequestContext) => Promise<ApiResponse<unknown>>): Promise<NextResponse> {
  try { return jsonResponse(await action(requestContext(request))); }
  catch { return jsonResponse({ ok: false, error: { code: "api.internal.error", message: "API request could not be completed.", statusCode: 500 }, meta: { apiVersion: "v1", requestId: `req-${Date.now()}`, generatedAt: new Date().toISOString() }, warnings: [], diagnostics: [] }); }
}
