import { toProduct, type ErpProduct } from "@/lib/catalogue-map";
import type { Product } from "@/lib/products";

/*
 * Server-side reads from the ERP's public API (apps/api → /api/public/v1).
 * Server components and route handlers only — client components get the list
 * from <CatalogueProvider>, seeded by the root layout.
 *
 * Cached under the "catalogue" tag: the admin panel posts to /api/revalidate on
 * every product, price, stock or image change, which expires it immediately.
 * The 60s window is only the safety net for changes that don't come through the
 * admin (e.g. a script, or the hook failing).
 *
 * If the ERP is unreachable a *page* still renders, with an empty catalogue and
 * `unavailable: true` so the UI can say so. A *build* must not: see
 * getCatalogueOrThrow below.
 */

export const CATALOGUE_TAG = "catalogue";
const REVALIDATE_SECONDS = 60;

export class CatalogueUnavailableError extends Error {
  constructor(cause: unknown) {
    super(
      "The ERP catalogue is unreachable, so this build would bake an empty shop into the " +
        "sitemap and generate no product pages. Failing instead leaves the last good deploy " +
        "serving. Set ALLOW_EMPTY_CATALOGUE=1 to build without the ERP (CI does this)."
    );
    this.name = "CatalogueUnavailableError";
    this.cause = cause;
  }
}

/*
 * Whether an unreachable ERP should fail the caller or degrade to an empty list.
 *
 * Pure so the failure modes can be tested — the guard only protects a production
 * build if it actually throws, and that is worth proving. Same reasoning as
 * resolveSiteUrl in site.ts, which this deliberately mirrors.
 */
export function onCatalogueFailure(isProduction: boolean, allowEmpty: boolean): "throw" | "empty" {
  if (!isProduction) return "empty";
  return allowEmpty ? "empty" : "throw";
}

/* An unset variable and an empty one both mean "not allowed". */
export function allowEmptyCatalogue(configured: string | undefined): boolean {
  const value = configured?.trim().toLowerCase();
  return value === "1" || value === "true";
}

const DEV_ERP_FALLBACK = "http://localhost:3001";

/*
 * The ERP public API origin.
 *
 * Two variables because a Netlify function never saw the runtime one: two builds
 * in a row fell through to the localhost default and failed with ECONNREFUSED on
 * ::1 and 127.0.0.1, which reads like a network fault rather than missing config.
 * NEXT_PUBLIC_ERP_API_URL is inlined into the bundle at build time — server code
 * included — so the deployed function holds it as a literal and needs no runtime
 * environment at all.
 *
 * ERP_API_URL still wins, so moving the value back to a private runtime variable
 * later means deleting the public one and nothing else.
 *
 * Pure so the failure modes can be tested, like resolveSiteUrl in site.ts.
 */
export function resolveErpUrl(
  runtime: string | undefined,
  baked: string | undefined,
  isProduction: boolean
): string {
  const value = runtime?.trim() || baked?.trim();

  if (!value) {
    if (isProduction) {
      throw new Error(
        "ERP_API_URL is not set. A deployed storefront cannot reach the ERP without it, and " +
          "falling back to localhost would make the site's own container answer. Set " +
          "NEXT_PUBLIC_ERP_API_URL at build time, or ERP_API_URL in the host's runtime environment."
      );
    }
    return DEV_ERP_FALLBACK;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`ERP_API_URL is not a valid URL: ${value}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`ERP_API_URL must be http or https, got ${parsed.protocol}`);
  }

  /* No trailing slash — every caller appends a path that starts with one. */
  return parsed.origin;
}

export function erpUrl(path: string): string {
  /* Both reads must stay literal: Next only inlines a written-out
     process.env.NEXT_PUBLIC_* expression, not one behind a variable. */
  const base = resolveErpUrl(
    process.env.ERP_API_URL,
    process.env.NEXT_PUBLIC_ERP_API_URL,
    process.env.NODE_ENV === "production"
  );
  return `${base}/api/public/v1${path}`;
}

type Page<T> = { data: T[]; page: number; totalPages: number };

/* Throws if the ERP does not answer. The callers below decide what that means. */
async function fetchCatalogue(): Promise<Product[]> {
  const rows: ErpProduct[] = [];
  // pageSize is capped at 100 server-side; walk the pages.
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(erpUrl(`/products?page=${page}&pageSize=100&sort=createdAt`), {
      next: { tags: [CATALOGUE_TAG], revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`products page ${page} returned ${res.status}`);
    const body = (await res.json()) as Page<ErpProduct>;
    rows.push(...body.data);
    if (page >= body.totalPages) break;
  }
  return rows.map(toProduct);
}

export type CatalogueState = {
  products: Product[];
  /* True only when the ERP failed to answer — NOT when it answered with nothing.
     Conflating the two is what let an outage ship as a believable empty shop. */
  unavailable: boolean;
};

/* For rendering. Never throws, so an ERP outage still leaves the legal pages,
   order tracking and the rest of the site up. */
export async function getCatalogueState(): Promise<CatalogueState> {
  try {
    return { products: await fetchCatalogue(), unavailable: false };
  } catch (error) {
    console.error("[catalogue] ERP unreachable, rendering an empty catalogue:", error);
    return { products: [], unavailable: true };
  }
}

export async function getCatalogue(): Promise<Product[]> {
  return (await getCatalogueState()).products;
}

/*
 * For anything a build BAKES: the sitemap and generateStaticParams.
 *
 * An empty result there is not recoverable at runtime — the Next docs are
 * explicit that generateStaticParams does not run again during revalidation —
 * so a single unreachable moment would publish a shop with no products and a
 * sitemap with no product URLs, and it would stay that way. Failing the build
 * leaves the previous deploy serving instead.
 */
export async function getCatalogueOrThrow(): Promise<Product[]> {
  try {
    return await fetchCatalogue();
  } catch (error) {
    console.error("[catalogue] ERP unreachable on a build-critical path:", error);
    const mode = onCatalogueFailure(
      process.env.NODE_ENV === "production",
      allowEmptyCatalogue(process.env.ALLOW_EMPTY_CATALOGUE)
    );
    if (mode === "throw") throw new CatalogueUnavailableError(error);
    return [];
  }
}

export async function getCatalogueProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(erpUrl(`/products/${encodeURIComponent(slug)}`), {
      next: { tags: [CATALOGUE_TAG], revalidate: REVALIDATE_SECONDS },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`product ${slug} returned ${res.status}`);
    return toProduct((await res.json()) as ErpProduct);
  } catch (error) {
    console.error(`[catalogue] could not load ${slug}:`, error);
    return null;
  }
}
