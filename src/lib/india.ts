/*
 * India's 28 states and 8 union territories, for the State dropdowns.
 *
 * A copy: the source of truth is the ERP's packages/validation/src/india.ts,
 * which checkout and the address book are validated against (it stores the
 * canonical name so the invoice's GST place of supply always resolves). The
 * names here must match it exactly; src/lib/india.test.ts pins the count and a
 * few spellings that are easy to get wrong.
 *
 * The site delivers within India only, so there is no country list.
 */
export type IndianState = { abbr: string; name: string };

export const INDIAN_STATES: readonly IndianState[] = [
  { abbr: "AN", name: "Andaman and Nicobar Islands" },
  { abbr: "AP", name: "Andhra Pradesh" },
  { abbr: "AR", name: "Arunachal Pradesh" },
  { abbr: "AS", name: "Assam" },
  { abbr: "BR", name: "Bihar" },
  { abbr: "CH", name: "Chandigarh" },
  { abbr: "CG", name: "Chhattisgarh" },
  { abbr: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { abbr: "DL", name: "Delhi" },
  { abbr: "GA", name: "Goa" },
  { abbr: "GJ", name: "Gujarat" },
  { abbr: "HR", name: "Haryana" },
  { abbr: "HP", name: "Himachal Pradesh" },
  { abbr: "JK", name: "Jammu and Kashmir" },
  { abbr: "JH", name: "Jharkhand" },
  { abbr: "KA", name: "Karnataka" },
  { abbr: "KL", name: "Kerala" },
  { abbr: "LA", name: "Ladakh" },
  { abbr: "LD", name: "Lakshadweep" },
  { abbr: "MP", name: "Madhya Pradesh" },
  { abbr: "MH", name: "Maharashtra" },
  { abbr: "MN", name: "Manipur" },
  { abbr: "ML", name: "Meghalaya" },
  { abbr: "MZ", name: "Mizoram" },
  { abbr: "NL", name: "Nagaland" },
  { abbr: "OD", name: "Odisha" },
  { abbr: "PY", name: "Puducherry" },
  { abbr: "PB", name: "Punjab" },
  { abbr: "RJ", name: "Rajasthan" },
  { abbr: "SK", name: "Sikkim" },
  { abbr: "TN", name: "Tamil Nadu" },
  { abbr: "TS", name: "Telangana" },
  { abbr: "TR", name: "Tripura" },
  { abbr: "UP", name: "Uttar Pradesh" },
  { abbr: "UK", name: "Uttarakhand" },
  { abbr: "WB", name: "West Bengal" },
];

const normalise = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
const CODE_ALIASES: Record<string, string> = { UT: "UK", OR: "OD", CT: "CG", DD: "DN", TG: "TS" };
const NAME_ALIASES: Record<string, string> = {
  orissa: "OD",
  pondicherry: "PY",
  uttaranchal: "UK",
  chattisgarh: "CG",
  dadraandnagarhaveli: "DN",
  damananddiu: "DN",
  andamanandnicobar: "AN",
  jammukashmir: "JK",
  newdelhi: "DL",
};
const BY_ABBR = new Map(INDIAN_STATES.map((s) => [s.abbr, s]));
const BY_NAME = new Map(INDIAN_STATES.map((s) => [normalise(s.name), s]));

/*
 * The listed state a saved or typed value means — "MH", "maharashtra",
 * "Orissa" — so an address saved before the dropdown opens with the right
 * option chosen. Unknown → null, and the dropdown asks the shopper to choose.
 */
export function matchState(value: string | null | undefined): IndianState | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  const byCode = BY_ABBR.get(CODE_ALIASES[upper] ?? upper);
  if (byCode) return byCode;
  const key = normalise(trimmed);
  const alias = NAME_ALIASES[key];
  return BY_NAME.get(key) ?? (alias ? BY_ABBR.get(alias) ?? null : null);
}
