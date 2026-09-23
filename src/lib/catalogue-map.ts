import { slugify, sortSizes, type Product } from "@/lib/products";

/*
 * ERP → storefront mapping. Pure, so it can be unit tested and shared by the
 * server data layer without pulling in fetch.
 *
 * The ERP catalogue has no sale price, badges, apparel specs, reviews or drops
 * (docs/INTEGRATION.md §2). Those map to honest empties, and the UI hides what
 * is empty rather than inventing it.
 */

/* Wire shape of GET /api/public/v1/products — money is a decimal string. */
export type ErpProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  basePrice: string;
  category: { id: string; name: string } | null;
  images: { id: string; url: string }[];
  variants: { id: string; size: string; colour: string; stock: number }[];
};

export type ErpCategory = { id: string; name: string; productCount: number };

/* "ONLY N LEFT" is shown at or below this many units across all variants. */
export const LOW_STOCK_AT = 10;

/*
 * Rupees for display. The ERP's decimal string is parsed once here; totals are
 * never summed from these — checkout asks the ERP for a quote.
 */
export function displayPrice(decimal: string): number {
  const value = Number.parseFloat(decimal);
  return Number.isFinite(value) ? Math.round(value) : 0;
}

export function toProduct(p: ErpProduct): Product {
  const variants = p.variants.map((v) => ({ ...v, size: v.size.toUpperCase(), colour: v.colour.toUpperCase() }));
  const sizes = sortSizes([...new Set(variants.map((v) => v.size))]);
  const colors = [...new Set(variants.map((v) => v.colour))];
  const total = variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  const oos = sizes
    .filter((size) => variants.filter((v) => v.size === size).every((v) => v.stock <= 0))
    .map((size) => `${p.id}:${size}`);
  const name = p.name.toUpperCase();
  const categoryName = (p.category?.name ?? "Uncategorised").toUpperCase();

  return {
    id: p.id,
    slug: p.slug,
    name,
    word: (name.split(/\s+/)[0] ?? "BRZ").slice(0, 10),
    price: displayPrice(p.basePrice),
    compareAt: null,
    category: slugify(categoryName),
    categoryName,
    colors,
    sizes,
    oos,
    badges: [],
    gsm: "",
    fabric: "",
    fit: "",
    drop: 0,
    description: p.description ?? "",
    stock: total > 0 && total <= LOW_STOCK_AT ? total : null,
    soldout: variants.length === 0 || total === 0,
    images: p.images.map((i) => i.url),
    variants,
  };
}

export type Category = { slug: string; name: string; count: number };

/* Categories present in the catalogue, in first-seen order. */
export function categoriesOf(list: Product[]): Category[] {
  const seen = new Map<string, Category>();
  for (const p of list) {
    const current = seen.get(p.category);
    if (current) current.count++;
    else seen.set(p.category, { slug: p.category, name: p.categoryName, count: 1 });
  }
  return [...seen.values()];
}
