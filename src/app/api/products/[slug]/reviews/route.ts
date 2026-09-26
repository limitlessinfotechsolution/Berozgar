import { NextResponse, type NextRequest } from "next/server";
import { erpUrl } from "@/lib/catalogue";
import { erpHeaders } from "@/lib/erp-session";

/*
 * GET /api/products/:slug/reviews?page= → ERP approved reviews for a product.
 * Cached briefly under "reviews"; approving a review in the admin shows within a minute.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const page = Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1;
  try {
    const response = await fetch(erpUrl(`/products/${encodeURIComponent(slug)}/reviews?page=${page}`), {
      headers: erpHeaders(request),
      next: { tags: ["reviews"], revalidate: 60 },
    });
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("[reviews] ERP unreachable:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
