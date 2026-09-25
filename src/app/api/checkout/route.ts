import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { erpUrl } from "@/lib/catalogue";
import { erpHeaders, sessionToken } from "@/lib/erp-session";

/*
 * Checkout → ERP order. A server-side proxy to POST /api/public/v1/checkout, so
 * the browser never talks to the ERP directly (no CORS, no ERP URL in the bundle),
 * the client IP is forwarded for the ERP's rate limit and audit trail, and a signed-in
 * shopper's session goes along so the order lands in their account.
 *
 * Contract with the checkout page: `{ success: true, orderId, razorpay }` on
 * success, where `razorpay` is the order to pay against (null for COD, or when
 * online payment isn't available); anything else is a failure and must not be
 * shown as an order. The ERP prices the order itself — this route never sends a total.
 */

type LineProblem = { variantId: string; reason: "unknown" | "unavailable" | "insufficient_stock"; available?: number };

function describe(status: number, body: { error?: string; message?: string; lines?: LineProblem[]; issues?: unknown }): string {
  if (status === 429) return "Too many attempts — wait a minute and try again.";
  // The ERP's own wording, e.g. "Cash on delivery is available on orders up to ₹3,000."
  if (body.error === "cod_unavailable" && body.message) return body.message;
  if (body.lines?.length) {
    return body.lines
      .map((l) =>
        l.reason === "insufficient_stock"
          ? `One item only has ${l.available ?? 0} left.`
          : "One item is no longer available."
      )
      .join(" ");
  }
  if (status === 422) return "Some details look wrong — check your phone number, PIN code and address.";
  return "The order service didn't accept the order.";
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Malformed request" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(erpUrl("/checkout"), {
      method: "POST",
      headers: { "content-type": "application/json", ...erpHeaders(request, sessionToken(request)) },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[checkout] ERP unreachable:", error);
    return NextResponse.json(
      { success: false, error: "The order service is unreachable. Your order was not placed." },
      { status: 502 }
    );
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.success || !body?.orderId) {
    return NextResponse.json(
      { success: false, error: describe(response.status, body ?? {}), lines: body?.lines ?? [] },
      { status: response.ok ? 502 : response.status }
    );
  }

  // The order just allocated stock, so the catalogue's availability moved.
  revalidateTag("catalogue", { expire: 0 });
  return NextResponse.json({
    success: true,
    orderId: body.orderId,
    grandTotal: body.grandTotal,
    razorpay: body.razorpay ?? null,
  });
}
