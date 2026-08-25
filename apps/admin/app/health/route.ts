import { NextResponse } from "next/server";

import { createHealthStatusResponse } from "../../lib/health-status";
import { getKernelStatusSnapshot } from "../../lib/kernel-status-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getKernelStatusSnapshot({ includeTechnicalDetails: false });

  return NextResponse.json(createHealthStatusResponse(snapshot));
}
