import { handleApi, getRuntimeApiBridge } from "../../../../../lib/api/runtime-api-http-adapter";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const bridge = await getRuntimeApiBridge(); return handleApi(request, (context) => bridge.runtimeStatus(context)); }
