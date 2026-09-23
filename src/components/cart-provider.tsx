"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCatalogue } from "@/components/catalogue-provider";
import type { Product, Variant } from "@/lib/products";
import { useHydrated, readStored, writeStored } from "@/lib/use-hydrated";

/*
 * A cart line is one ERP variant (size × colour). The stored product is only a
 * snapshot for rendering while the catalogue is unavailable; whenever the live
 * catalogue is present each line is re-resolved against it, so a price change in
 * the admin shows up in an existing bag and a delisted variant drops out.
 */
export type CartItem = {
  variantId: string;
  size: string;
  colour: string;
  quantity: number;
  product: Product;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, variant: Variant, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  itemCount: number;
  wishlist: string[];
  toggleWishlist: (id: string) => boolean;
  inWishlist: (id: string) => boolean;
};

/* v2: lines keyed by variantId. Carts saved by the old fixture catalogue are ignored. */
const CART_KEY = "berozgar-cart-v2";
const WISHLIST_KEY = "berozgar-wishlist";

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  const item = value as CartItem;
  return Boolean(item && typeof item.variantId === "string" && item.product && typeof item.quantity === "number");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const { products, byId } = useCatalogue();

  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = readStored<unknown>(CART_KEY, []);
    return Array.isArray(stored) ? stored.filter(isCartItem) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => readStored<string[]>(WISHLIST_KEY, []));

  useEffect(() => { writeStored(CART_KEY, items); }, [items]);
  useEffect(() => { writeStored(WISHLIST_KEY, wishlist); }, [wishlist]);

  /* Stored state only exists in the browser, so expose the empty server value
     until hydration completes. Mutations still target the real state. */
  const live = products.length > 0;
  const resolved = items.flatMap((item) => {
    if (!live) return [item];
    const product = byId(item.product.id);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    return product && variant ? [{ ...item, product }] : [];
  });
  const visibleItems = hydrated ? resolved : [];
  const visibleWishlist = hydrated ? wishlist.filter((id) => !live || byId(id)) : [];

  const inWishlist = (id: string) => visibleWishlist.includes(id);

  /* Returns true when the product ended up saved, so callers can pick a message. */
  function toggleWishlist(id: string) {
    const added = !wishlist.includes(id);
    setWishlist((current) => (added ? [...current, id] : current.filter((x) => x !== id)));
    return added;
  }

  function addItem(product: Product, variant: Variant, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => item.variantId === variant.id);
      if (existing) {
        return current.map((item) => (item === existing ? { ...item, quantity: item.quantity + quantity } : item));
      }
      return [...current, { variantId: variant.id, size: variant.size, colour: variant.colour, quantity, product }];
    });
  }

  function removeItem(variantId: string) {
    setItems((current) => current.filter((item) => item.variantId !== variantId));
  }

  function updateQuantity(variantId: string, quantity: number) {
    setItems((current) => {
      if (quantity <= 0) return current.filter((item) => item.variantId !== variantId);
      return current.map((item) => (item.variantId === variantId ? { ...item, quantity } : item));
    });
  }

  return (
    <CartContext.Provider
      value={{
        items: visibleItems,
        addItem,
        removeItem,
        updateQuantity,
        clear: () => setItems([]),
        itemCount: visibleItems.reduce((sum, item) => sum + item.quantity, 0),
        wishlist: visibleWishlist,
        toggleWishlist,
        inWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
