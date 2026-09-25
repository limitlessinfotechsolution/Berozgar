import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { erpUrl } from "@/lib/catalogue";
import { erpHeaders } from "@/lib/erp-session";

/*
 * Razorpay's success callback → ERP POST /api/public/v1/checkout/verify. The ERP
 * checks the signature with the key secret, which never leaves it. On success the
 * order's tracking data is expired so the confirmation page reads PAID at once.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  try {
    const response = await fetch(erpUrl("/checkout/verify"), {
      method: "POST",
      headers: { "content-type": "application/json", ...erpHeaders(request) },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.success) {
      return NextResponse.json({ success: false }, { status: response.ok ? 502 : response.status });
    }
    revalidateTag("orders", { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[checkout/verify] ERP unreachable:", error);
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
