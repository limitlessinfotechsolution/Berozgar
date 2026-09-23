import Link from "next/link";
import { Plate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";

export const metadata = {
  title: "COLLABORATIONS — BEROZGAR",
  description: "Berozgar collaborations with artists, designers and creators.",
};

const PITCH: [string, string][] = [
  ["ARTISTS", "Graphics, prints and one-off pieces. You make the work, we build it into the drop."],
  ["DESIGNERS", "Silhouettes and construction. Co-designed capsules, credited on the label."],
  ["PHOTOGRAPHERS", "Campaign and lookbook work. Shot on the street, not in a studio."],
  ["MUSICIANS", "Drop soundtracks, launch nights and merch built with you, not for you."],
];

export default function CollaborationsPage() {
  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "48px 0 90px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / COLLABORATIONS
        </div>

        <header style={{ padding: "18px 0 36px" }} data-rev="true">
          <p className="eyebrow mut">COLLABORATIONS</p>
          <h1 className="h1" style={{ marginTop: "10px" }}>BUILD IT WITH US.</h1>
          <p className="body mut" style={{ marginTop: "14px", maxWidth: "620px" }}>
            Berozgar was built by people who weren&apos;t waiting for permission. If that&apos;s you,
            we&apos;d rather make something together than talk about reach.
          </p>
        </header>

        <div style={{ aspectRatio: "21 / 9", marginBottom: "48px" }} data-rev="true">
          <Plate slug="collaborations" word="COLLAB" label="Berozgar collaborations" variant={2} />
        </div>

        <div className="grid2" data-rev="true">
          {PITCH.map(([title, copy]) => (
            <div className="addr-card" key={title}>
              <h2 className="cap" style={{ marginBottom: "8px" }}>{title}</h2>
              <p className="small mut">{copy}</p>
            </div>
          ))}
        </div>

        <section className="legal-sec" data-rev="true" style={{ marginTop: "48px" }}>
          <h2 className="h3">HOW IT WORKS</h2>
          <ul className="legal-list">
            <li>Send us the work — a portfolio link is plenty, no deck needed</li>
            <li>We talk about what the piece actually is</li>
            <li>We sample it, credit you, and split the run</li>
          </ul>
        </section>

        <div style={{ textAlign: "center", marginTop: "48px" }} data-rev="true">
          <p className="d-lg" style={{ marginBottom: "24px" }}>PITCH US.</p>
          <Link href="/help/contact" className="btn">GET IN TOUCH</Link>
        </div>
      </div>
    </div>
  );
}
