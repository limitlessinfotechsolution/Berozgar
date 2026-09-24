/*
 * Catalogue types and pure helpers.
 *
 * The data itself lives in the ERP and is read through src/lib/catalogue.ts
 * (server) and <CatalogueProvider> (client). Nothing here fetches.
 */
/* One size × colour of a product — the unit the ERP stocks and orders. */
export type Variant = {
  id: string;
  size: string;
  colour: string;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  word: string;
  /* Display only (whole rupees, pre-GST). Totals always come from the ERP quote. */
  price: number;
  compareAt: number | null;
  /* Category slug, e.g. "t-shirts"; categoryName is the label. */
  category: string;
  categoryName: string;
  colors: string[];
  sizes: string[];
  /* `${id}:${size}` for every size with no stock in any colour. */
  oos: string[];
  badges: string[];
  gsm: string;
  fabric: string;
  fit: string;
  /* Drop / collection name ("DROP 001"), or "" when the product isn't in one. */
  collection: string;
  /* ISO timestamp the product was created in the ERP, for NEWEST. */
  createdAt: string;
  description: string;
  /* Units left when low enough to be worth saying ("ONLY 3 LEFT"), else null. */
  stock: number | null;
  soldout: boolean;
  images: string[];
  variants: Variant[];
};

/* Standard apparel order, so XS…XXL read left to right whatever order the ERP returns. */
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL", "OS"];

export function sortSizes(sizes: string[]): string[] {
  const rank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s.toUpperCase());
    return i === -1 ? SIZE_ORDER.length : i;
  };
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function findVariant(product: Product, size: string, colour: string | null): Variant | undefined {
  return product.variants.find(
    (v) => v.size.toUpperCase() === size.toUpperCase() && (colour === null || v.colour.toUpperCase() === colour.toUpperCase())
  );
}

/* A size is unavailable for a colour when that exact variant is missing or has no stock. */
export function sizeAvailable(product: Product, size: string, colour: string | null): boolean {
  if (product.soldout) return false;
  if (colour === null) return !product.oos.includes(`${product.id}:${size}`);
  return (findVariant(product, size, colour)?.stock ?? 0) > 0;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProduct(list: Product[], slug: string) {
  return list.find((p) => p.slug === slug);
}

export function getProductById(list: Product[], id: string) {
  return list.find((p) => p.id === id);
}
