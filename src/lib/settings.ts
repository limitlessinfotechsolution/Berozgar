import { erpUrl } from "@/lib/catalogue";
import { DEFAULT_SHIPPING, toShippingRule, type ErpSettings, type ShippingRule } from "@/lib/shipping";

/*
 * Storefront settings from the ERP (GET /api/public/v1/settings). Server only —
 * client components get them from <StoreSettingsProvider>, seeded by the root layout.
 *
 * Cached under "settings": saving Settings → Shipping in the admin posts to
 * /api/revalidate. The 300s window is the fallback if that hook is missed.
 */
export const SETTINGS_TAG = "settings";

export async function getShippingRule(): Promise<ShippingRule> {
  try {
    const res = await fetch(erpUrl("/settings"), { next: { tags: [SETTINGS_TAG], revalidate: 300 } });
    if (!res.ok) return DEFAULT_SHIPPING;
    return toShippingRule((await res.json()) as ErpSettings);
  } catch {
    return DEFAULT_SHIPPING;
  }
}
