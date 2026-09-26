"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SHIPPING, type ShippingRule } from "@/lib/shipping";

/*
 * ERP storefront settings for client components — the root layout reads them
 * once on the server (src/lib/settings.ts) and hands them down here.
 */
const ShippingContext = createContext<ShippingRule>(DEFAULT_SHIPPING);

export function StoreSettingsProvider({ shipping, children }: { shipping: ShippingRule; children: React.ReactNode }) {
  return <ShippingContext.Provider value={shipping}>{children}</ShippingContext.Provider>;
}

export function useShippingRule(): ShippingRule {
  return useContext(ShippingContext);
}
