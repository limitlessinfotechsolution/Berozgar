import { NextResponse } from "next/server";
import { erpUrl } from "@/lib/catalogue";

/*
 * Forwards a small JSON POST from the browser to the ERP's public API, so the
 * browser never talks to the ERP directly. The client IP travels for the ERP's
 * per-IP rate limit. Answers { success } plus the ERP's status; the ERP body is
 * not passed through, so nothing internal leaks to the page.
 */
export async function forwardPost(request: Request, path: string): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  try {
    const response = await fetch(erpUrl(path), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    return NextResponse.json({ success: response.ok }, { status: response.ok ? 201 : response.status });
  } catch (error) {
    console.error(`[erp-proxy] ${path} unreachable:`, error);
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
