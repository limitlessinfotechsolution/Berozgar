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
 * If the ERP is unreachable the site renders an empty catalogue rather than
 * failing the page or the build; the error is logged.
 */

export const CATALOGUE_TAG = "catalogue";
const REVALIDATE_SECONDS = 60;

export function erpUrl(path: string): string {
  const base = (process.env.ERP_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
  return `${base}/api/public/v1${path}`;
}

type Page<T> = { data: T[]; page: number; totalPages: number };

export async function getCatalogue(): Promise<Product[]> {
  const rows: ErpProduct[] = [];
  try {
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
  } catch (error) {
    console.error("[catalogue] ERP unreachable, rendering an empty catalogue:", error);
    return [];
  }
  return rows.map(toProduct);
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
