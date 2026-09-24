"use client";

import { ShopFilterPanel } from "@/components/shop-filter-panel";
import { SORTS, type Facets, type Query } from "@/lib/shop-filters";

/* Mobile-only filter/sort sheet. Shares #qsheet's styling via the .qsheet class
   so it doesn't duplicate that id. Filters apply as they're tapped, so the count
   on the footer button is always the real result; sorting closes the sheet. */
export function ShopFilterSheet({
  kind,
  query,
  facets,
  resultCount,
  onChange,
  onClose,
}: {
  kind: "filter" | "sort" | null;
  query: Query;
  facets: Facets;
  resultCount: number;
  onChange: (next: Query) => void;
  onClose: () => void;
}) {
  const open = kind !== null;

  return (
    <>
      <div className={`scrim ${open ? "open" : ""}`.trim()} onClick={onClose}></div>

      <aside className={`ovl qsheet ${open ? "open" : ""}`.trim()} role="dialog" aria-label={kind === "sort" ? "Sort" : "Filter"}>
        {kind === "filter" && (
          <>
            <div className="ovl-head">
              <b>FILTER</b>
              <button className="xbtn" aria-label="Close" onClick={onClose}>✕</button>
            </div>
            <div style={{ padding: "8px 22px 0" }}>
              <ShopFilterPanel facets={facets} query={query} onChange={onChange} touch />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px", padding: "12px 22px 26px" }}>
              <button
                className="btn btn-o"
                onClick={() => onChange({ cat: query.cat || "", sort: query.sort || "" })}
              >
                CLEAR
              </button>
              <button className="btn" onClick={onClose}>
                SHOW {resultCount} RESULT{resultCount === 1 ? "" : "S"}
              </button>
            </div>
          </>
        )}

        {kind === "sort" && (
          <>
            <div className="ovl-head">
              <b>SORT</b>
              <button className="xbtn" aria-label="Close" onClick={onClose}>✕</button>
            </div>
            <div style={{ padding: "8px 22px 30px" }}>
              <div className="fgrp">
                {SORTS.map(([value, label]) => {
                  const active = (query.sort || "featured") === value;
                  return (
                    <button
                      key={value}
                      className="sz"
                      aria-pressed={active}
                      style={{
                        width: "100%",
                        justifyContent: "flex-start",
                        display: "flex",
                        alignItems: "center",
                        minHeight: "48px",
                        marginBottom: "8px",
                        background: active ? "var(--bk)" : "var(--wt)",
                        color: active ? "var(--wt)" : "var(--bk)",
                        borderColor: active ? "var(--bk)" : "#ccc",
                      }}
                      onClick={() => { onChange({ ...query, sort: value, page: "" }); onClose(); }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
