"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { ProductPlate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";
import { showToast } from "@/lib/ui-events";
import { RecentlyViewed } from "@/components/recently-viewed";
import { useShippingRule } from "@/components/store-settings-provider";
import { formatINR as inr } from "@/lib/money";
import { standardShippingMinor } from "@/lib/shipping";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const rule = useShippingRule();

  if (items.length === 0) {
    return (
      <div className="page-fade">
        <div className="wrap">
          <div className="empty">
            <p className="d-md" style={{ opacity: 0.15 }}>00</p>
            <h2 className="h1">YOUR BAG IS EMPTY.</h2>
            <p>NOTHING HERE YET.</p>
            <Link href="/shop" className="btn">START SHOPPING</Link>
          </div>
        </div>
        <RecentlyViewed />
      </div>
    );
  }

  /* Paise, and the ERP's own rule (Settings → Shipping), so this matches the quote. */
  const subtotal = items.reduce((sum, item) => sum + item.product.priceMinor * item.quantity, 0);
  const shipping = standardShippingMinor(subtotal, rule);
  const unlocked = shipping === 0;
  const remaining = Math.max(0, rule.freeFromMinor - subtotal);
  const progress = rule.freeFromMinor > 0 ? Math.min(100, Math.round((subtotal / rule.freeFromMinor) * 100)) : 100;

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "40px 0 80px" }}>
        <h1 className="h1" data-rev="true">YOUR BAG</h1>

        <div className="cart-lay" style={{ marginTop: "8px" }}>
          <div>
            {items.map((item) => (
              <div className="ci" key={item.variantId}>
                <Link className="th" href={`/shop/${item.product.slug}`}>
                  <ProductPlate product={item.product} variant={0} />
                </Link>
                <div>
                  <Link className="nm" href={`/shop/${item.product.slug}`}>{item.product.name}</Link>
                  <div className="mt">{item.size} · {item.colour}</div>
                  <div className="qty">
                    <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>−</button>
                    <b>{item.quantity}</b>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>+</button>
                  </div>
                  <button
                    className="rm"
                    onClick={() => { removeItem(item.variantId); showToast("ITEM REMOVED"); }}
                  >
                    REMOVE
                  </button>
                </div>
                <b className="price">{inr(item.product.priceMinor * item.quantity)}</b>
              </div>
            ))}

            <div className="ship-prog">
              <span className="cap" style={unlocked ? { color: "var(--ru)" } : undefined}>
                {unlocked ? "FREE SHIPPING UNLOCKED" : `${inr(remaining)} MORE TO UNLOCK FREE SHIPPING`}
              </span>
              <div className="bar"><i style={{ width: `${progress}%` }}></i></div>
            </div>

            {/* Coupons are applied at checkout, against the ERP quote — not here. */}
          </div>

          <div className="co-sum">
            <h3 className="cap" style={{ marginBottom: "14px" }}>SUMMARY</h3>
            <div className="sumrow">
              <span>Subtotal</span>
              <span className="num">{inr(subtotal)}</span>
            </div>
            <div className="sumrow">
              <span>Shipping</span>
              <span className="num">{shipping === 0 ? "FREE" : inr(shipping)}</span>
            </div>
            <div className="sumrow tot">
              <span>Total</span>
              <span className="num">{inr(subtotal + shipping)}</span>
            </div>
            <p className="small mut" style={{ marginTop: "6px" }}>Prices exclude GST — it&apos;s added at checkout.</p>
            <Link href="/checkout" className="btn btn-full" style={{ marginTop: "18px" }}>CHECKOUT</Link>
            <Link href="/shop" className="btn btn-o btn-full" style={{ marginTop: "12px" }}>CONTINUE SHOPPING</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
