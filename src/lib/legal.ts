import { erpUrl } from "@/lib/catalogue";
import type { LegalSection } from "@/components/legal-doc";
import FALLBACK from "@/content/legal-fallback.json";

/*
 * Policy pages come from the ERP (apps/api → /api/public/v1/legal), where staff
 * write and publish them. The text arrives with the business details already
 * filled in, so this file renders it and decides nothing.
 *
 * Cached under the "legal" tag; publishing in the admin expires it at once. The
 * 5-minute window is the safety net if that call does not arrive.
 *
 * If the ERP is unreachable we fall back to the copy committed in
 * src/content/legal-fallback.json. A shop may go a few minutes with a stale
 * privacy policy; it must never answer "terms and conditions" with a 500.
 */

export const LEGAL_TAG = "legal";
const REVALIDATE_SECONDS = 300;

export type LegalStatus = "DRAFT" | "PUBLISHED";

export interface LegalDocument {
  slug: string;
  title: string;
  version: string;
  summary: string;
  status: LegalStatus;
  effectiveAt: string;
  publishedAt: string | null;
  sections: LegalSection[];
}

export type LegalIndexEntry = Omit<LegalDocument, "sections" | "status">;

const fallback = FALLBACK as { documents: LegalDocument[] };

function fallbackDocument(slug: string): LegalDocument | null {
  return fallback.documents.find((document) => document.slug === slug) ?? null;
}

export async function getLegalDocument(slug: string): Promise<LegalDocument | null> {
  try {
    const res = await fetch(erpUrl(`/legal/${slug}`), {
      next: { tags: [LEGAL_TAG], revalidate: REVALIDATE_SECONDS },
    });
    // A 404 means "not published yet", which is a real answer: show the draft we ship.
    if (res.status === 404) return fallbackDocument(slug);
    if (!res.ok) throw new Error(`legal/${slug} returned ${res.status}`);
    return (await res.json()) as LegalDocument;
  } catch (error) {
    console.error(`[legal] ERP unreachable for "${slug}", using the committed copy:`, error);
    return fallbackDocument(slug);
  }
}

/** The published policies, for navigation and the footer. */
export async function getLegalIndex(): Promise<LegalIndexEntry[]> {
  try {
    const res = await fetch(erpUrl("/legal"), {
      next: { tags: [LEGAL_TAG], revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`legal index returned ${res.status}`);
    const body = (await res.json()) as { data: LegalIndexEntry[] };
    return body.data;
  } catch (error) {
    console.error("[legal] ERP unreachable, using the committed index:", error);
    return fallback.documents.map(({ sections: _sections, status: _status, ...entry }) => entry);
  }
}
