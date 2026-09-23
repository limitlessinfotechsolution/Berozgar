"use client";

type Query = Record<string, string>;

/* Kept in step with applyFilters() in shop-client.tsx — only sorts the ERP can answer. */
const SORTS: [string, string][] = [
  ["featured", "FEATURED"],
  ["price-asc", "PRICE: LOW → HIGH"],
  ["price-desc", "PRICE: HIGH → LOW"],
];

/* Mobile-only filter/sort sheet. Shares #qsheet's styling via the .qsheet class
   so it doesn't duplicate that id. */
export function ShopFilterSheet({
  kind,
  query,
  sizes,
  onApply,
  onClose,
}: {
  kind: "filter" | "sort" | null;
  query: Query;
  /* The sizes the catalogue actually stocks. */
  sizes: string[];
  onApply: (next: Query) => void;
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
            <div style={{ padding: "8px 22px 30px" }}>
              <div className="fgrp">
                <h4>SIZE</h4>
                <div className="szrow">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      className={`sz ${query.size === size ? "on" : ""}`.trim()}
                      onClick={() => onApply({ ...query, size: query.size === size ? "" : size })}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="fgrp">
                <h4>AVAILABILITY</h4>
                <label className="ck">
                  <input
                    type="checkbox"
                    checked={query.avail === "instock"}
                    onChange={(e) => onApply({ ...query, avail: e.target.checked ? "instock" : "" })}
                  /> IN STOCK ONLY
                </label>
              </div>
              <div className="fgrp">
                <h4>PRICE</h4>
                <label className="ck">
                  <input
                    type="checkbox"
                    checked={query.max === "1500"}
                    onChange={(e) => onApply({ ...query, max: e.target.checked ? "1500" : "" })}
                  /> UNDER ₹1,500
                </label>
              </div>
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
                      onClick={() => onApply({ ...query, sort: value })}
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
