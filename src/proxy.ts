import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/erp-session";
import { loginHref } from "@/lib/next-path";

/*
 * Optimistic gate for /account/*: no session cookie, no account page — the
 * request is redirected to login before any HTML is rendered.
 *
 * Presence only, by design (Next docs: guides/authentication, "Optimistic checks
 * with Proxy"). Proxy runs on every matched request including prefetches, so it
 * doesn't call the ERP. The real check is verifySession() in src/lib/dal.ts,
 * which each account page awaits, and the ERP itself, which checks the token on
 * every /account/* data call.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  return NextResponse.redirect(new URL(loginHref(`${pathname}${search}`), request.url));
}

export const config = {
  matcher: ["/account/:path*"],
};
