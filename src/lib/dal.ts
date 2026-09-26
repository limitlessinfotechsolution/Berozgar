import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { erpUrl } from "@/lib/catalogue";
import { SESSION_COOKIE, erpHeaders } from "@/lib/erp-session";
import { loginHref } from "@/lib/next-path";

/*
 * The server-side session check for account pages (Next docs: guides/
 * authentication, "Creating a Data Access Layer").
 *
 * src/proxy.ts only checks that a cookie exists; this asks the ERP whether the
 * token behind it is still a live session, so a forged, expired or signed-out
 * cookie is redirected to login instead of rendering the account shell. Each
 * account page awaits it — not the layout, which doesn't re-render when you move
 * between account pages. cache() makes repeat calls in one render free.
 *
 * An ERP that can't be reached is not treated as signed out: the page renders
 * and its own data calls show the error, rather than bouncing a signed-in
 * shopper to a login that would fail the same way.
 */
export const verifySession = cache(async (path: string): Promise<{ verified: boolean }> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect(loginHref(path));

  let status: number;
  try {
    const request = new Request("http://storefront.internal", { headers: await headers() });
    const response = await fetch(erpUrl("/auth/session"), {
      headers: erpHeaders(request, token),
      cache: "no-store",
    });
    status = response.status;
  } catch (error) {
    console.error("[dal] ERP unreachable checking the session:", error);
    return { verified: false };
  }

  if (status === 401 || status === 403) redirect(loginHref(path));
  return { verified: status >= 200 && status < 300 };
});
