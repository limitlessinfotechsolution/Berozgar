"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { RevealObserver } from "@/components/reveal-observer";
import { sizeAvailable, sortSizes, type Product } from "@/lib/products";
import { categoriesOf } from "@/lib/catalogue-map";
import { ShopFilterSheet } from "@/components/shop-filter-sheet";

const PRICE_CAPS: [string, string][] = [
  ["999", "UNDER ₹999"],
  ["1500", "UNDER ₹1,500"],
  ["2500", "UNDER ₹2,500"],
];

type Query = Record<string, string>;

function applyFilters(all: Product[], q: Query) {
  let list = [...all];

  if (q.cat && q.cat !== "all") {
    list = list.filter((p) => p.category === q.cat);
  }
  if (q.size) {
    list = list.filter((p) => p.sizes.includes(q.size) && sizeAvailable(p, q.size, null));
  }
  if (q.color) {
    list = list.filter((p) => p.colors.includes(q.color.toUpperCase()));
  }
  if (q.avail === "instock") list = list.filter((p) => !p.soldout);
  if (q.max) list = list.filter((p) => p.price <= Number(q.max));

  /* Only sorts the ERP can actually answer. NEWEST needs `createdAt` on the public
     product serialiser; BEST SELLING needs order volume. Neither is exposed today,
     and both sorted on fields the mapper always leaves empty, so they did nothing. */
  const sort = q.sort || "featured";
  if (sort === "price-asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    list.sort((a, b) => b.price - a.price);
  }
  return list;
}

function buildHref(q: Query) {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => { if (v) params.set(k, v); });
  const s = params.toString();
  return s ? `/shop?${s}` : "/shop";
}

export function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query: Query = Object.fromEntries(searchParams.entries());

  const results = applyFilters(initialProducts, query);

  /* Every filter option comes from what the ERP catalogue actually holds. */
  const categoryChips: [string, string][] = [
    ["all", "ALL"],
    ...categoriesOf(initialProducts).map((c): [string, string] => [c.slug, c.name]),
  ];
  const sizes = sortSizes([...new Set(initialProducts.flatMap((p) => p.sizes))]);
  const colors = [...new Set(initialProducts.flatMap((p) => p.colors))];
  const activeCat = query.cat || "all";
  const activeFilters = Object.keys(query).filter((k) => k !== "sort").length;

  const [sheet, setSheet] = useState<"filter" | "sort" | null>(null);
  const go = (next: Query) => router.push(buildHref(next));

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

        <div className="cats" style={{ padding: "14px 0" }}>
          {categoryChips.map(([slug, label]) => (
            <Link
              key={slug}
              className={`chip ${activeCat === slug ? "on" : ""}`.trim()}
              href={slug === "all" ? "/shop" : `/shop?cat=${slug}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="m-filterbar">
          <button className="chip" onClick={() => setSheet("filter")}>FILTER +</button>
          <button className="chip" onClick={() => setSheet("sort")}>SORT</button>
        </div>

        <div className="shop-lay" style={{ paddingBottom: "80px" }}>
          <aside className="shop-side">
            <div className="fgrp">
              <h4>SIZE</h4>
              {sizes.map((size) => (
                <label className="ck" key={size}>
                  <input
                    type="checkbox"
                    checked={query.size === size}
                    onChange={(e) => go({ ...query, size: e.target.checked ? size : "" })}
                  /> {size}
                </label>
              ))}
            </div>

            <div className="fgrp">
              <h4>COLOR</h4>
              {colors.map((color) => (
                <label className="ck" key={color}>
                  <input
                    type="checkbox"
                    checked={(query.color || "").toUpperCase() === color}
                    onChange={(e) => go({ ...query, color: e.target.checked ? color : "" })}
                  /> {color}
                </label>
              ))}
            </div>

            <div className="fgrp">
              <h4>PRICE</h4>
              {PRICE_CAPS.map(([value, label]) => (
                <label className="ck" key={value}>
                  <input
                    type="checkbox"
                    checked={query.max === value}
                    onChange={(e) => go({ ...query, max: e.target.checked ? value : "" })}
                  /> {label}
                </label>
              ))}
            </div>

            <div className="fgrp">
              <h4>AVAILABILITY</h4>
              <label className="ck">
                <input
                  type="checkbox"
                  checked={query.avail === "instock"}
                  onChange={(e) => go({ ...query, avail: e.target.checked ? "instock" : "" })}
                /> IN STOCK
              </label>
            </div>

            <button className="tlink" style={{ border: 0 }} onClick={() => router.push("/shop")}>
              CLEAR ALL ✕
            </button>
          </aside>

          <div>
            <div className="shop-top">
              <span className="cap mut only-d">FILTER: {activeFilters || "NONE"}</span>
              <label className="sortsel only-d">
                <span className="cap mut">SORT</span>
                <select
                  value={query.sort || "featured"}
                  onChange={(e) => go({ ...query, sort: e.target.value })}
                >
                  <option value="featured">FEATURED</option>
                  <option value="price-asc">PRICE: LOW → HIGH</option>
                  <option value="price-desc">PRICE: HIGH → LOW</option>
                </select>
              </label>
            </div>

            <div id="shop-grid" className="grid3">
              {results.length ? (
                results.map((product) => <ProductCard key={product.id} product={product} />)
              ) : initialProducts.length === 0 ? (
                <div className="empty" style={{ gridColumn: "1 / -1" }}>
                  <h2 className="h3">NOTHING IN STOCK RIGHT NOW.</h2>
                  <p>The catalogue is being updated — check back shortly.</p>
                </div>
              ) : (
                <div className="empty" style={{ gridColumn: "1 / -1" }}>
                  <h2 className="h3">NO RESULTS.</h2>
                  <p>Try removing a filter.</p>
                  <button className="btn btn-o" onClick={() => router.push("/shop")}>CLEAR FILTERS</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShopFilterSheet
        kind={sheet}
        query={query}
        sizes={sizes}
        onApply={(next) => { go(next); setSheet(null); }}
        onClose={() => setSheet(null)}
      />
    </div>
  );
}
