/*
 * Where to send a shopper after they sign in. Pure, so the proxy, the server-side
 * session check and the login form share one rule, and it can be tested.
 */

/*
 * Only a path on this site. "//evil.com" and "/\evil.com" both start with "/" but
 * a browser resolves them to another host (it reads "\" as "/"), so both are refused.
 */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/")) return "/account";
  const second = value.charAt(1);
  if (second === "/" || second === "\\") return "/account";
  return value;
}

export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(safeNext(next))}`;
}
