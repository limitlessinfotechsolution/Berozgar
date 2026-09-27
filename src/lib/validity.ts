/*
 * The browser's own "Please match the requested format" doesn't say how to fix
 * anything. Spread explain("…") on an input to replace it with a message that
 * does; typing clears it so the field can become valid again.
 */
export function explain(message: string) {
  return {
    onInvalid: (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => e.currentTarget.setCustomValidity(message),
    onInput: (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => e.currentTarget.setCustomValidity(""),
  };
}

/* A 6-digit pincode, first digit 1-8 — the ERP refuses 9 (Army Post Office), and so do couriers. */
export const PINCODE_PATTERN = "[1-8][0-9]{5}";
export const PINCODE_MESSAGE = "Enter a 6-digit pincode. We can't deliver to Army Post Office (9…) pincodes.";
