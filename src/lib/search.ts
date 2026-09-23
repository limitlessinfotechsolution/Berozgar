import type { Product } from "@/lib/products";

/*
 * One matcher for the header overlay and the /search page, so the two can never
 * disagree about what a query returns. Matches name + category + colours +
 * description, case-insensitively, over the ERP catalogue the caller passes in.
 */
export function searchProducts(products: Product[], rawQuery: string): Product[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];
  return products.filter((p) =>
    `${p.name} ${p.categoryName} ${p.colors.join(" ")} ${p.description}`.toLowerCase().includes(query)
  );
}

/* The overlay shows the first four products when nothing is typed yet. */
export function idleSuggestions(products: Product[]): Product[] {
  return products.slice(0, 4);
}

/* [slug, label] for each category present in the results. */
export function resultCategories(results: Product[]): [string, string][] {
  const seen = new Map<string, string>();
  for (const p of results) seen.set(p.category, p.categoryName);
  return [...seen.entries()];
}

/* Suggested searches: the catalogue's own colours and categories, not fixed copy. */
export function trendingTerms(products: Product[]): string[] {
  const terms = [...new Set([...products.map((p) => p.categoryName), ...products.flatMap((p) => p.colors)])];
  return terms.slice(0, 4).map((t) => t.toLowerCase());
}
