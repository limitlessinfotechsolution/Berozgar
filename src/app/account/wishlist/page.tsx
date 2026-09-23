"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { ProductCard } from "@/components/product-card";
import { useCatalogue } from "@/components/catalogue-provider";
import { showToast } from "@/lib/ui-events";

export default function WishlistPage() {
  const { wishlist } = useCart();
  const { byId } = useCatalogue();
  const saved = wishlist.map(byId).filter((p) => p !== undefined);

  const share = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    showToast("WISHLIST LINK COPIED");
  };

  return (
    <>
      <h1 className="h2">
        WISHLIST <span className="mut" style={{ fontSize: "0.7em" }}>— {saved.length} ITEMS</span>
      </h1>

      {saved.length ? (
        <>
          <div className="grid4" style={{ marginTop: "24px" }}>
            {saved.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button className="btn btn-o" onClick={share}>SHARE WISHLIST</button>
          </div>
        </>
      ) : (
        <div className="empty">
          <h2 className="h3">WISHLIST EMPTY.</h2>
          <p>SAVE PIECES YOU&apos;RE NOT READY TO QUIT.</p>
          <Link href="/shop" className="btn">BROWSE DROP 001</Link>
        </div>
      )}
    </>
  );
}
