"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findVariant, sizeAvailable } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import { useCatalogue } from "@/components/catalogue-provider";
import { ProductPlate } from "@/components/product-plate";
import { QUICK_ADD, TOAST, showToast } from "@/lib/ui-events";
import { Swatch } from "@/components/swatch";

export function QuickSheet() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const { addItem } = useCart();
  const { byId } = useCatalogue();
  const product = openId ? byId(openId) : undefined;
  const activeColor = color ?? product?.colors.find((c) => product.variants.some((v) => v.colour === c && v.stock > 0)) ?? null;

  useEffect(() => {
    const onQuickAdd = (e: Event) => {
      setOpenId((e as CustomEvent).detail.productId);
      setColor(null);
    };
    const onToast = (e: Event) => setToast((e as CustomEvent).detail.message);
    document.addEventListener(QUICK_ADD, onQuickAdd);
    document.addEventListener(TOAST, onToast);
    return () => {
      document.removeEventListener(QUICK_ADD, onQuickAdd);
      document.removeEventListener(TOAST, onToast);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = product ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const close = () => setOpenId(null);

  return (
    <>
      <div className={`scrim ${product ? "open" : ""}`} onClick={close}></div>

      <aside id="qsheet" className={`ovl ${product ? "open" : ""}`} role="dialog" aria-label="Quick add">
        {product && (
          <>
            <div className="ovl-head">
              <b>QUICK ADD — {product.name}</b>
              <button className="xbtn" aria-label="Close" onClick={close}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "18px", padding: "20px 22px" }}>
              <div style={{ aspectRatio: "3 / 4" }}>
                <ProductPlate product={product} variant={0} />
              </div>
              <div>
                {product.compareAt ? (
                  <span className="price">
                    <span className="sale-c">₹{product.price.toLocaleString("en-IN")}</span>
                    <s>₹{product.compareAt.toLocaleString("en-IN")}</s>
                  </span>
                ) : (
                  <span className="price">₹{product.price.toLocaleString("en-IN")}</span>
                )}

                {product.colors.length > 1 && (
                  <>
                    <p className="cap" style={{ margin: "16px 0 10px" }}>COLOR — {activeColor}</p>
                    <div className="clrow">
                      {product.colors.map((c) => (
                        <button key={c} className={`cl ${activeColor === c ? "on" : ""}`.trim()} onClick={() => setColor(c)} aria-label={c}>
                          <Swatch name={c} />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <p className="cap" style={{ margin: "16px 0 10px" }}>SELECT SIZE</p>
                <div className="szrow" style={{ marginBottom: "18px" }}>
                  {product.sizes.map((size) => {
                    const variant = findVariant(product, size, activeColor);
                    const isOos = !variant || !sizeAvailable(product, size, activeColor);
                    return (
                      <button
                        key={size}
                        className={`sz ${isOos ? "oos" : ""}`}
                        disabled={isOos}
                        onClick={() => {
                          if (!variant) return;
                          addItem(product, variant);
                          showToast(`${product.name} ADDED TO BAG`);
                          close();
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <Link className="tlink" href={`/shop/${product.slug}`} onClick={close}>
                  VIEW FULL DETAILS →
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>

      <div id="toast" role="status" className={toast ? "show" : ""}>{toast}</div>
    </>
  );
}
