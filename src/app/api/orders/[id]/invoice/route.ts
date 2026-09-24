import { NextResponse, type NextRequest } from "next/server";
import { erpUrl } from "@/lib/catalogue";

/*
 * GET /api/orders/:id/invoice?phone= — the GST tax invoice PDF for an order,
 * streamed from the ERP (which renders it and checks the phone). Never cached:
 * an invoice is personal data.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/orders/[id]/invoice">) {
  const { id } = await ctx.params;
  const phone = (request.nextUrl.searchParams.get("phone") ?? "").trim();
  if (!phone) return NextResponse.json({ error: "missing" }, { status: 400 });

  try {
    const upstream = await fetch(
      erpUrl(`/orders/${encodeURIComponent(id.toUpperCase())}/invoice?phone=${encodeURIComponent(phone)}`),
      { headers: { "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "" }, cache: "no-store" },
    );
    if (!upstream.ok) {
      const body = await upstream.json().catch(() => ({}));
      return NextResponse.json(body, { status: upstream.status });
    }
    const headers = new Headers({ "cache-control": "private, no-store" });
    for (const name of ["content-type", "content-disposition", "content-length"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("[invoice] ERP unreachable:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
