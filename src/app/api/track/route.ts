import { NextResponse } from "next/server";
import { erpUrl } from "@/lib/catalogue";

const ORDERS_TAG = "orders";

/*
 * Order tracking: order number + the phone used at checkout → the ERP's view of
 * that order. Cached briefly under the "orders" tag; the admin panel expires it
 * whenever it moves an order's status.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = (params.get("id") ?? "").trim().toUpperCase();
  const phone = (params.get("phone") ?? "").trim();
  if (!id || !phone) return NextResponse.json({ error: "missing" }, { status: 400 });

  try {
    const response = await fetch(erpUrl(`/orders/${encodeURIComponent(id)}?phone=${encodeURIComponent(phone)}`), {
      headers: { "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "" },
      next: { tags: [ORDERS_TAG], revalidate: 30 },
    });
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("[track] ERP unreachable:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
