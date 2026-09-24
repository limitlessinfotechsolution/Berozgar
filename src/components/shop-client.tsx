"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { RevealObserver } from "@/components/reveal-observer";
import { ShopFilterPanel } from "@/components/shop-filter-panel";
import { ShopFilterSheet } from "@/components/shop-filter-sheet";
import { categoriesOf } from "@/lib/catalogue-map";
import type { Product } from "@/lib/products";
import {
  DROPS,
  PAGE_SIZE,
  SALE,
  SORTS,
  activeFilterCount,
  applyFilters,
  buildShopHref,
  facetsOf,
  visibleCount,
  type Query,
} from "@/lib/shop-filters";

export function ShopClient({
  initialProducts,
  unavailable = false,
}: {
  initialProducts: Product[];
  unavailable?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query: Query = Object.fromEntries(searchParams.entries());

  const results = applyFilters(initialProducts, query);
  const shown = visibleCount(results.length, query.page);
  const more = shown < results.length;

  /* Every tab and filter option comes from what the ERP catalogue actually holds. */
  const facets = facetsOf(initialProducts);
  const tabs: [string, string][] = [
    ["all", "ALL"],
    ...categoriesOf(initialProducts).map((c): [string, string] => [c.slug, c.name]),
    ...(facets.collections.length ? [[DROPS, "DROPS"] as [string, string]] : []),
    ...(facets.hasSale ? [[SALE, "SALE"] as [string, string]] : []),
  ];
  const activeTab = query.cat || "all";
  const filterCount = activeFilterCount(query);

  const [sheet, setSheet] = useState<"filter" | "sort" | null>(null);
  /* Filters replace rather than push: ten taps in the sheet shouldn't be ten Back presses. */
  const go = (next: Query) => router.replace(buildShopHref(next), { scroll: false });
  const loadMore = () => go({ ...query, page: String(Math.floor(shown / PAGE_SIZE) + 1) });

  /* Infinite scroll: reaching the sentinel loads the next page. The button below
     stays as the fallback, and for keyboard users. */
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; });
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMoreRef.current();
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, shown]);

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap">
        <div className="crumb">
          <Link href="/">HOME</Link> / SHOP
        </div>

        <header style={{ padding: "18px 0 8px" }} data-rev="true">
          <h1 className="h1">SHOP</h1>
          <p className="small mut" style={{ marginTop: "6px" }}>
            {results.length} PRODUCT{results.length !== 1 ? "S" : ""}
          </p>
        </header>

        <nav className="cats" style={{ padding: "14px 0" }} aria-label="Shop sections">
          {tabs.map(([slug, label]) => (
            <Link
              key={slug}
              className={`chip ${activeTab === slug ? "on" : ""}`.trim()}
              aria-current={activeTab === slug ? "page" : undefined}
              href={slug === "all" ? "/shop" : `/shop?cat=${slug}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="m-filterbar">
          <button className="chip" onClick={() => setSheet("filter")}>
            FILTER {filterCount ? `(${filterCount})` : "+"}
          </button>
          <button className="chip" onClick={() => setSheet("sort")}>
            SORT: {(SORTS.find(([v]) => v === (query.sort || "featured")) ?? SORTS[0])[1].split(":")[0]}
          </button>
        </div>

        <div className="shop-lay" style={{ paddingBottom: "80px" }}>
          <aside className="shop-side" aria-label="Filters">
            <ShopFilterPanel facets={facets} query={query} onChange={go} />
            {filterCount > 0 && (
              <button className="tlink" style={{ border: 0 }} onClick={() => go({ cat: query.cat || "", sort: query.sort || "" })}>
                CLEAR ALL ✕
              </button>
            )}
          </aside>

          <div>
            <div className="shop-top">
              <span className="cap mut only-d">FILTER: {filterCount || "NONE"}</span>
              <label className="sortsel only-d">
                <span className="cap mut">SORT BY</span>
                <select
                  value={query.sort || "featured"}
                  onChange={(e) => go({ ...query, sort: e.target.value, page: "" })}
                >
                  {SORTS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div id="shop-grid" className="grid3">
              {results.length ? (
                results.slice(0, shown).map((product) => <ProductCard key={product.id} product={product} />)
              ) : unavailable ? (
                /* The ERP did not answer. Say so — an outage dressed up as an
                   empty shop is how a broken deploy goes unnoticed. */
                <div className="empty" style={{ gridColumn: "1 / -1" }}>
                  <h2 className="h3">CATALOGUE UNAVAILABLE.</h2>
                  <p>We can&apos;t reach our catalogue right now. Please try again in a moment.</p>
                  <button className="btn btn-o" onClick={() => router.refresh()}>RETRY</button>
                </div>
              ) : initialProducts.length === 0 ? (
                <div className="empty" style={{ gridColumn: "1 / -1" }}>
                  <h2 className="h3">NOTHING IN STOCK RIGHT NOW.</h2>
                  <p>The catalogue is being updated — check back shortly.</p>
                </div>
              ) : (
                <div className="empty" style={{ gridColumn: "1 / -1" }}>
                  <h2 className="h3">NO RESULTS.</h2>
                  <p>Try removing a filter.</p>
                  <button className="btn btn-o" onClick={() => go({})}>CLEAR FILTERS</button>
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div style={{ textAlign: "center", marginTop: "36px" }}>
                <p className="small mut">SHOWING {shown} OF {results.length}</p>
                {more && (
                  <>
                    <div ref={sentinel} aria-hidden="true" />
                    <button className="btn btn-o" style={{ marginTop: "14px" }} onClick={loadMore}>
                      LOAD MORE
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ShopFilterSheet
        kind={sheet}
        query={query}
        facets={facets}
        resultCount={results.length}
        onChange={go}
        onClose={() => setSheet(null)}
      />
    </div>
  );
}
