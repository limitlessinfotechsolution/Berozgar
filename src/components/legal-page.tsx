import { notFound } from "next/navigation";
import { LegalDoc } from "@/components/legal-doc";
import { getLegalDocument } from "@/lib/legal";

/*
 * One policy page. The text lives in the ERP, where staff edit and publish it;
 * this only fetches and renders it, so a wording change needs no deploy.
 *
 * A document that has never been published falls back to the copy committed in
 * src/content/legal-fallback.json and renders with the draft banner — which is
 * the honest state: written, not yet signed off.
 */
export async function LegalPage({ slug }: { slug: string }) {
  const document = await getLegalDocument(slug);
  if (!document) notFound();

  return (
    <LegalDoc
      title={document.title.toUpperCase()}
      updated={formatUpdated(document)}
      status={document.status}
      intro={document.summary}
      sections={document.sections}
    />
  );
}

/** Metadata for a policy route, from the same source as the page. */
export async function legalMetadata(slug: string) {
  const document = await getLegalDocument(slug);
  if (!document) return { title: "LEGAL — BEROZGAR" };
  return {
    title: `${document.title.toUpperCase()} — BEROZGAR`,
    description: document.summary,
  };
}

function formatUpdated(document: { status: string; publishedAt: string | null; effectiveAt: string }): string {
  if (document.status !== "PUBLISHED") return "NOT YET PUBLISHED";
  const when = document.publishedAt ?? document.effectiveAt;
  return new Date(when)
    .toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
}
