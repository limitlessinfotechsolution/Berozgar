import { toMinor } from "@/lib/money";

/*
 * The shipping rule as the ERP charges it (Settings → Shipping), in paise.
 *
 * For display only — the free-shipping bar and the help pages. The amount an
 * order is charged always comes from the ERP quote, so a stale rule here can
 * mislabel a bar for a minute but never change what a shopper pays.
 */
export type ShippingRule = { freeFromMinor: number; standardMinor: number; expressMinor: number };

/* The ERP's own defaults, for when it can't be reached. */
export const DEFAULT_SHIPPING: ShippingRule = { freeFromMinor: 99900, standardMinor: 9900, expressMinor: 19900 };

/* Wire shape of GET /api/public/v1/settings. */
export type ErpSettings = { shipping?: { freeFrom?: string; standard?: string; express?: string } };

export function toShippingRule(body: ErpSettings | null | undefined): ShippingRule {
  const s = body?.shipping;
  return {
    freeFromMinor: toMinor(s?.freeFrom) ?? DEFAULT_SHIPPING.freeFromMinor,
    standardMinor: toMinor(s?.standard) ?? DEFAULT_SHIPPING.standardMinor,
    expressMinor: toMinor(s?.express) ?? DEFAULT_SHIPPING.expressMinor,
  };
}

/* Standard shipping for a goods subtotal: free at or above the threshold. */
export function standardShippingMinor(subtotalMinor: number, rule: ShippingRule): number {
  return subtotalMinor >= rule.freeFromMinor ? 0 : rule.standardMinor;
}
