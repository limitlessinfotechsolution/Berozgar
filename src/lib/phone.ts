/*
 * Indian mobile numbers. The ERP accepts only these and stores them as
 * +91XXXXXXXXXX (packages/validation/src/primitives.ts), so the storefront's
 * phone fields take the 10 national digits and show +91 beside them.
 */

export const COUNTRY_CODE = "+91";

/* A valid 10-digit Indian mobile, as the field's pattern checks it. */
export const MOBILE_PATTERN = "[6-9][0-9]{9}";

/*
 * What a shopper types or pastes, reduced to at most 10 national digits:
 * "+91 98200 11223", "091-9820011223", "0 98200 11223" and "919820011223" all
 * become "9820011223". The prefix is only dropped when the number is too long
 * to be national without it, so a 10-digit number that starts with 91 is kept.
 */
export function toNationalMobile(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  return digits.slice(0, 10);
}

export function isIndianMobile(national: string): boolean {
  return new RegExp(`^${MOBILE_PATTERN}$`).test(national);
}
