/*
 * Turning the ERP's working-day delivery window into dates a shopper reads.
 * Couriers don't deliver on Sundays, so those are skipped. Pure; tested.
 */

/* Saved by the product page's pincode check, reused by checkout. */
export const PINCODE_KEY = "berozgar-pincode";

export type PincodeInfo = {
  pincode: string;
  city: string | null;
  state: string | null;
  deliveryDays: [number, number] | null;
  cod: { available: boolean; reason: string | null; fee: string };
};

export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) left--;
  }
  return d;
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const fmt = (d: Date) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

/* "THU 26 SEP – SAT 28 SEP", or one date when the window is a single day. */
export function deliveryRange(window: [number, number], now: Date = new Date()): string {
  const [min, max] = window;
  const a = fmt(addWorkingDays(now, min));
  const b = fmt(addWorkingDays(now, max));
  return a === b ? a : `${a} – ${b}`;
}
