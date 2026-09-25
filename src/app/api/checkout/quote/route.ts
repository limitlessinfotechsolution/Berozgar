import { NextResponse } from "next/server";
import { erpUrl } from "@/lib/catalogue";
import { erpHeaders } from "@/lib/erp-session";

/*
 * The ERP's price for the bag — subtotal, shipping, GST, total — so the review
 * step shows exactly what the order will be created at. Proxied for the same
 * reasons as /api/checkout.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  try {
    const response = await fetch(erpUrl("/checkout/quote"), {
      method: "POST",
      headers: { "content-type": "application/json", ...erpHeaders(request) },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("[quote] ERP unreachable:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
