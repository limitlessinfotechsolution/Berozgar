/*
 * The site's public origin, used for canonical URLs, the sitemap, robots.txt
 * and OG image URLs.
 *
 * This used to be a hardcoded "https://berozgar.example" duplicated across
 * sitemap.ts and robots.ts. Getting it wrong isn't a local bug: the
 * placeholder origin ends up in the sitemap Google reads, so a build with no
 * origin configured must fail rather than publish one.
 */
const DEV_FALLBACK = "http://localhost:3003";

/* Pure so the failure modes can be tested — the assertion below only protects a
   production build if it actually throws, and that is worth proving. */
export function resolveSiteUrl(configured: string | undefined, isProduction: boolean): string {
  const value = configured?.trim();

  if (!value) {
    if (isProduction) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL is not set. A production build needs the real origin " +
          "(e.g. https://berozgar.com) — it goes into the sitemap, robots.txt and OG image URLs."
      );
    }
    return DEV_FALLBACK;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL is not a valid URL: ${value}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`NEXT_PUBLIC_SITE_URL must be http or https, got ${parsed.protocol}`);
  }

  /* No trailing slash — every caller concatenates a path that starts with one. */
  return parsed.origin;
}

export const SITE_URL = resolveSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NODE_ENV === "production"
);

/* Absolute URL for a site-relative path ("/shop" → "https://…/shop"). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
