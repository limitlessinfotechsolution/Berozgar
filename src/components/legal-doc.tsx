import Link from "next/link";
import { RevealObserver } from "@/components/reveal-observer";

export type LegalSection = {
  heading: string;
  /* Paragraphs; a nested array renders as a bulleted list. */
  body: (string | string[])[];
};

/*
 * Shared shell for the policy pages. The text comes from the ERP, where staff
 * write and publish it (src/lib/legal.ts). A document that has not been published
 * still renders, with the pending-review notice, so an unreviewed draft can never
 * read as cleared copy.
 */
export function LegalDoc({
  title,
  updated,
  intro,
  sections,
  status = "DRAFT",
}: {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
  status?: "DRAFT" | "PUBLISHED";
}) {
  return (
    <>
      <RevealObserver />

      <header style={{ marginBottom: "28px" }}>
        <h1 className="h1">{title}</h1>
        <p className="cap mut" style={{ marginTop: "10px" }}>LAST UPDATED — {updated}</p>
      </header>

      {status !== "PUBLISHED" && (
        <div className="legal-notice" role="note">
          <b className="cap">DRAFT — PENDING LEGAL REVIEW</b>
          <p className="small" style={{ marginTop: "6px" }}>
            This document has been written but not yet reviewed and published. It is not legal advice.
            The published version appears here once it is signed off in the admin panel.
          </p>
        </div>
      )}

      {intro && <p className="body" style={{ margin: "24px 0" }}>{intro}</p>}

      {sections.map((section, i) => (
        <section key={section.heading} className="legal-sec" data-rev="true">
          <h2 className="h3">{i + 1}. {section.heading}</h2>
          {section.body.map((block, j) =>
            Array.isArray(block) ? (
              <ul key={j} className="legal-list">
                {block.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <p key={j} className="body">{block}</p>
            )
          )}
        </section>
      ))}

      <p className="small mut" style={{ marginTop: "40px" }}>
        Questions about this policy? <Link href="/help/contact" className="tlink">CONTACT US</Link>
      </p>
    </>
  );
}
