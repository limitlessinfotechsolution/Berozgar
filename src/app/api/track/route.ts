import { NextResponse, type NextRequest } from "next/server";
import { erpUrl } from "@/lib/catalogue";
import { erpHeaders, sessionToken } from "@/lib/erp-session";

const ORDERS_TAG = "orders";

/*
 * Order tracking: order number + the phone used at checkout → the ERP's view of
 * that order. Cached briefly under the "orders" tag; the admin panel expires it
 * whenever it moves an order's status. A signed-in shopper may omit the phone for
 * their own orders; those answers depend on the session, so they are never cached.
 */
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const id = (params.get("id") ?? "").trim().toUpperCase();
  const phone = (params.get("phone") ?? "").trim();
  const token = phone ? null : sessionToken(request);
  if (!id || (!phone && !token)) return NextResponse.json({ error: "missing" }, { status: 400 });

  try {
    const response = await fetch(
      erpUrl(`/orders/${encodeURIComponent(id)}${phone ? `?phone=${encodeURIComponent(phone)}` : ""}`),
      token
        ? { headers: erpHeaders(request, token), cache: "no-store" }
        : { headers: erpHeaders(request), next: { tags: [ORDERS_TAG], revalidate: 30 } },
    );
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("[track] ERP unreachable:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
