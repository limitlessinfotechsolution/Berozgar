/*
 * How a shopper reaches a person. One place, so the contact page, order pages
 * and footer can't disagree. A null field is shown as "not available yet"
 * rather than a placeholder that looks like a real address.
 *
 * The grievance officer is mandatory under India's Consumer Protection
 * (E-Commerce) Rules, 2020 — fill it in before launch.
 */
export const SUPPORT: {
  email: string | null;
  phone: string | null;
  /* Digits only with country code, e.g. "919876543210", for a wa.me link. */
  whatsapp: string | null;
  hours: string;
  responseWindow: string;
  grievance: { name: string; designation: string; email: string } | null;
} = {
  email: null,
  phone: null,
  whatsapp: null,
  hours: "MON–SAT, 10:00–18:00 IST",
  responseWindow: "WITHIN 24 HOURS ON WORKING DAYS",
  grievance: null,
};

/* A mailto: link with the subject and body filled in, or null without a mailbox. */
export function supportMailto(subject: string, body: string): string | null {
  if (!SUPPORT.email) return null;
  return `mailto:${SUPPORT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function supportWhatsapp(text: string): string | null {
  if (!SUPPORT.whatsapp) return null;
  return `https://wa.me/${SUPPORT.whatsapp}?text=${encodeURIComponent(text)}`;
}
