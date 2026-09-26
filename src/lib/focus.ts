/*
 * Checkout runs in focus mode: no announcement bar, site nav, footer or bottom
 * nav — only its own slim header (logo back to the bag, "Secure checkout").
 * Every link off the page is a way out of a purchase. The confirmation page
 * (/checkout/success) gets the full site back so the shopper can carry on.
 */
export function isFocusRoute(pathname: string | null): boolean {
  return pathname === "/checkout";
}
