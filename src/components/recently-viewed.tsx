"use client";

import { useEffect } from "react";
import { useCatalogue } from "@/components/catalogue-provider";
import { ProductCard } from "@/components/product-card";
import { readStored, useHydrated, writeStored } from "@/lib/use-hydrated";

const KEY = "berozgar-recent";
const MAX = 8;

/* Newest first, no duplicates, capped. Pure so it can be tested. */
export function pushRecent(list: string[], id: string, max = MAX): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, max);
}

/*
 * "Recently viewed" — this browser only, from localStorage; nothing leaves the
 * device. `record` adds the current product (on a product page); `exclude` keeps
 * it out of its own row. Products no longer in the catalogue are skipped.
 */
export function RecentlyViewed({ record, exclude }: { record?: string; exclude?: string }) {
  const { byId } = useCatalogue();
  const hydrated = useHydrated();
  const stored = hydrated ? readStored<string[]>(KEY, []) : [];
  const ids = Array.isArray(stored) ? stored : [];

  /* Remember this product for the next page; this page's row excludes it anyway. */
  useEffect(() => {
    if (!record) return;
    const list = readStored<string[]>(KEY, []);
    writeStored(KEY, pushRecent(Array.isArray(list) ? list : [], record));
  }, [record]);

  const products = ids.filter((id) => id !== exclude).map((id) => byId(id)).filter((p) => p !== undefined).slice(0, 4);
  if (products.length === 0) return null;

  return (
    <section className="sec">
      <div className="wrap">
        <div className="sec-t"><h2 className="h2">RECENTLY VIEWED</h2></div>
        <div className="grid4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
