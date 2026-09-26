import { NextResponse } from "next/server";
import { erpOrigin } from "@/lib/catalogue";

/*
 * GET /api/health — for an uptime monitor. 200 when the site and the ERP both
 * answer; 503 when the ERP doesn't, because a storefront that can't reach the
 * ERP shows an empty shop and can't take orders even though its pages load.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let erp: "up" | "down" = "down";
  try {
    const res = await fetch(`${erpOrigin()}/api/v1/health`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
    if (res.ok) erp = "up";
  } catch {
    // down
  }
  return NextResponse.json(
    { ok: erp === "up", erp, erpMs: Date.now() - started },
    { status: erp === "up" ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
