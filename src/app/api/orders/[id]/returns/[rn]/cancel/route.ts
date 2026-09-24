import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { erpUrl } from "@/lib/catalogue";

/* POST /api/orders/:id/returns/:rn/cancel { phone } — withdraw a claim still under review. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/orders/[id]/returns/[rn]/cancel">) {
  const { id, rn } = await ctx.params;
  const input = (await request.json().catch(() => null)) as { phone?: unknown } | null;
  const phone = typeof input?.phone === "string" ? input.phone.trim() : "";
  if (!phone) return NextResponse.json({ error: "missing" }, { status: 400 });

  try {
    const upstream = await fetch(
      erpUrl(`/orders/${encodeURIComponent(id.toUpperCase())}/returns/${encodeURIComponent(rn.toUpperCase())}/cancel`),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
        },
        body: JSON.stringify({ phone }),
        cache: "no-store",
      },
    );
    const body = await upstream.json().catch(() => ({}));
    if (upstream.ok) revalidateTag("orders", { expire: 0 });
    return NextResponse.json(body, { status: upstream.status });
  } catch (error) {
    console.error("[returns] ERP unreachable:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
