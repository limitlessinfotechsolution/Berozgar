import { NextResponse, type NextRequest } from "next/server";
import { callErp, sameOrigin, sessionToken } from "@/lib/erp-session";

/*
 * POST /api/contact → ERP POST /api/public/v1/contact: the contact form becomes a
 * support ticket (SUP-YYYY-NNNNN). A signed-in shopper's session goes along so the
 * ticket is linked to their account.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const result = await callErp(request, "/contact", { method: "POST", body, token: sessionToken(request) });
  return NextResponse.json(result.body ?? {}, { status: result.status });
}
