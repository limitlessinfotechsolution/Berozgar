import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { erpUrl } from "@/lib/catalogue";
import { erpHeaders, sessionToken } from "@/lib/erp-session";

/*
 * POST /api/orders/:id/returns — a return / exchange claim with its photos
 * (multipart), forwarded to the ERP as-is. The ERP authorises it with the phone
 * in the form or the signed-in shopper's session, validates the photos and applies
 * the claim window.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/orders/[id]/returns">) {
  const { id } = await ctx.params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Expected a form with photos" }, { status: 400 });
  }

  try {
    const upstream = await fetch(erpUrl(`/orders/${encodeURIComponent(id.toUpperCase())}/returns`), {
      method: "POST",
      body: form,
      headers: erpHeaders(request, sessionToken(request)),
      cache: "no-store",
    });
    const body = await upstream.json().catch(() => ({}));
    // The cached order lookup (/api/track, tag "orders") now shows the claim.
    if (upstream.ok) revalidateTag("orders", { expire: 0 });
    return NextResponse.json(body, { status: upstream.status });
  } catch (error) {
    console.error("[returns] ERP unreachable:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
