import { NextResponse, type NextRequest } from "next/server";
import { callErp, sameOrigin, sessionToken } from "@/lib/erp-session";

/*
 * POST /api/checkout/draft → ERP /checkout/draft: the checkout in progress, for
 * abandoned-cart recovery. Fire-and-forget from the checkout page; the ERP prices it.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const result = await callErp(request, "/checkout/draft", { method: "POST", body, token: sessionToken(request) });
  return NextResponse.json(result.body ?? {}, { status: result.status });
}
