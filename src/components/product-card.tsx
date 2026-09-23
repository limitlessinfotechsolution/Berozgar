"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import { ProductPlate } from "@/components/product-plate";
import { openQuickAdd, showToast } from "@/lib/ui-events";

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, inWishlist } = useCart();
  const saved = inWishlist(product.id);

  // Exactly one badge — .badge is absolutely positioned, so a second would
  // sit directly on top of the first.
  const badge =
    product.soldout ? { className: "badge sold", text: "SOLD OUT" }
    : product.compareAt ? { className: "badge sale", text: "SALE" }
    : product.stock ? { className: "badge low", text: `ONLY ${product.stock} LEFT` }
    : product.badges[0] ? { className: "badge", text: product.badges[0] }
    : null;

  const toggleSaved = () => showToast(toggleWishlist(product.id) ? "ADDED TO WISHLIST" : "REMOVED FROM WISHLIST");

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickAdd(product.id);
  };

  return (
    <article className={`pcard ${product.soldout ? "soldout" : ""}`} data-id={product.id}>
      <Link href={`/shop/${product.slug}`} className="pcard-media" aria-label={product.name}>
        <ProductPlate product={product} variant={0} />
        <ProductPlate product={product} variant={1} className="alt" />

        {badge && <span className={badge.className}>{badge.text}</span>}

        <span
          className={`wish ${saved ? "on" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="Wishlist"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSaved(); }
          }}
        >
          <svg viewBox="0 0 24 24"><path d="M12 21C7 16.5 3 13.2 3 9.1 3 6.3 5.2 4 8 4c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.3 5 5.1 0 4.1-4 7.4-9 11.9z"></path></svg>
        </span>

        {!product.soldout && (
          <>
            <div className="qwrap">
              <button className="qbtn" onClick={quickAdd}>+ QUICK ADD</button>
            </div>
            <button className="qfab" aria-label="Quick add" onClick={quickAdd}>+</button>
          </>
        )}
      </Link>

      <div className="pcard-info">
        <Link className="nm" href={`/shop/${product.slug}`}>{product.name}</Link>
        {product.compareAt ? (
          <span className="price">
            <span className="sale-c">₹{product.price.toLocaleString("en-IN")}</span>
            <s>₹{product.compareAt.toLocaleString("en-IN")}</s>
          </span>
        ) : (
          <span className="price">₹{product.price.toLocaleString("en-IN")}</span>
        )}
        <span className="cl">{product.colors.join(" · ")}</span>
      </div>
    </article>
  );
}
