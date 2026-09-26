/*
 * Money on the storefront is integer paise.
 *
 * The ERP sends amounts as 2dp decimal strings ("1499.50") precisely so they
 * never pass through a float (ERP apps/api/lib/http.ts serialiseDecimal). These
 * parse the string by its digits, so "1499.50" is 149950 exactly; parseFloat
 * and Math.round would get there most of the time, which is not the same thing.
 */

const DECIMAL = /^(-)?(\d+)(?:\.(\d{1,2}))?$/;

/* Paise from an ERP decimal string, or null if it isn't one. */
export function toMinor(decimal: string | null | undefined): number | null {
  const match = decimal == null ? null : DECIMAL.exec(decimal.trim());
  if (!match) return null;
  const [, sign, rupees, fraction = ""] = match;
  const minor = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  return sign ? -minor : minor;
}

/* "₹1,499" for whole rupees, "₹1,499.50" otherwise. */
export function formatINR(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(minor));
  const rupees = Math.floor(abs / 100).toLocaleString("en-IN");
  const paise = abs % 100;
  return `${sign}₹${rupees}${paise ? `.${String(paise).padStart(2, "0")}` : ""}`;
}

/* An ERP decimal string straight to display; anything unparseable shows as ₹0. */
export function formatDecimalINR(decimal: string | null | undefined): string {
  return formatINR(toMinor(decimal) ?? 0);
}
