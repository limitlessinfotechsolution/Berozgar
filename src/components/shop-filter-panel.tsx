"use client";

import type { Facets, Query } from "@/lib/shop-filters";

/*
 * The shop's filters, rendered once for the desktop sidebar and once inside the
 * mobile sheet, so the two can't drift apart. A group only appears when the
 * catalogue has more than one value to choose between.
 */
export function ShopFilterPanel({
  facets,
  query,
  onChange,
  touch = false,
}: {
  facets: Facets;
  query: Query;
  onChange: (next: Query) => void;
  /* Mobile: sizes as large tap targets rather than checkboxes. */
  touch?: boolean;
}) {
  /* Choosing the selected value again clears it; any change goes back to page 1. */
  const toggle = (key: string, value: string) =>
    onChange({ ...query, page: "", [key]: (query[key] || "").toUpperCase() === value.toUpperCase() ? "" : value });

  const group = (title: string, key: string, values: [string, string][]) =>
    values.length > 1 && (
      <div className="fgrp" key={key}>
        <h4>{title}</h4>
        {values.map(([value, label]) => (
          <label className="ck" key={value}>
            <input
              type="checkbox"
              checked={(query[key] || "").toUpperCase() === value.toUpperCase()}
              onChange={() => toggle(key, value)}
            /> {label}
          </label>
        ))}
      </div>
    );

  const pairs = (values: string[]): [string, string][] => values.map((v) => [v, v]);

  return (
    <>
      {facets.sizes.length > 1 && (
        <div className="fgrp">
          <h4>SIZE</h4>
          {touch ? (
            <div className="szrow">
              {facets.sizes.map((size) => (
                <button
                  key={size}
                  className={`sz ${query.size === size ? "on" : ""}`.trim()}
                  aria-pressed={query.size === size}
                  onClick={() => toggle("size", size)}
                >
                  {size}
                </button>
              ))}
            </div>
          ) : (
            facets.sizes.map((size) => (
              <label className="ck" key={size}>
                <input type="checkbox" checked={query.size === size} onChange={() => toggle("size", size)} /> {size}
              </label>
            ))
          )}
        </div>
      )}
      {group("COLOR", "color", pairs(facets.colors))}
      {/* One cap is enough to be useful, so this group shows from a single option. */}
      {facets.priceCaps.length > 0 && (
        <div className="fgrp">
          <h4>PRICE</h4>
          {facets.priceCaps.map(([value, label]) => (
            <label className="ck" key={value}>
              <input type="checkbox" checked={query.max === value} onChange={() => toggle("max", value)} /> {label}
            </label>
          ))}
        </div>
      )}
      {group("COLLECTION", "collection", pairs(facets.collections))}
      {group("FIT", "fit", pairs(facets.fits))}
      <div className="fgrp">
        <h4>AVAILABILITY</h4>
        <label className="ck">
          <input type="checkbox" checked={query.avail === "instock"} onChange={() => toggle("avail", "instock")} /> IN STOCK ONLY
        </label>
      </div>
    </>
  );
}
