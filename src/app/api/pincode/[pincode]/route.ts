import { NextResponse, type NextRequest } from "next/server";
import { erpUrl } from "@/lib/catalogue";

/*
 * GET /api/pincode/:pincode?total= → the ERP's city/state, delivery window and
 * COD decision for a pincode. Cached for an hour: the answer only changes when
 * the storefront settings do.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/pincode/[pincode]">) {
  const { pincode } = await ctx.params;
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return NextResponse.json({ error: "invalid_pincode" }, { status: 400 });
  const total = request.nextUrl.searchParams.get("total");
  const query = total && /^\d{1,8}(\.\d{1,2})?$/.test(total) ? `?total=${total}` : "";

  try {
    const response = await fetch(erpUrl(`/pincode/${pincode}${query}`), {
      headers: { "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "" },
      next: { revalidate: 3600 },
    });
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("[pincode] ERP unreachable:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
