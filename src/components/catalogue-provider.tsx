"use client";

import { createContext, useContext, useMemo } from "react";
import { categoriesOf, type Category } from "@/lib/catalogue-map";
import type { Product } from "@/lib/products";

/*
 * The ERP catalogue for client components. The root layout reads it once on the
 * server (cached under the "catalogue" tag) and hands it down here, so the quick
 * sheet, search overlay, cart and wishlist all see the same list the page does.
 */

type CatalogueValue = {
  products: Product[];
  categories: Category[];
  byId: (id: string) => Product | undefined;
  /* The ERP did not answer. Distinct from "answered with nothing", so the UI can
     say "we can't reach the catalogue" instead of "there is nothing in stock". */
  unavailable: boolean;
};

const CatalogueContext = createContext<CatalogueValue | null>(null);

export function CatalogueProvider({
  products,
  unavailable = false,
  children,
}: {
  products: Product[];
  unavailable?: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo<CatalogueValue>(() => {
    const index = new Map(products.map((p) => [p.id, p]));
    return { products, categories: categoriesOf(products), byId: (id) => index.get(id), unavailable };
  }, [products, unavailable]);

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue() {
  const context = useContext(CatalogueContext);
  if (!context) throw new Error("useCatalogue must be used inside CatalogueProvider");
  return context;
}
