import Link from "next/link";
import { RevealObserver } from "@/components/reveal-observer";

export const metadata = {
  title: "MANIFESTO — BEROZGAR",
  description: "The Berozgar brand manifesto.",
};

const CHAPTERS: [string, string][] = [
  ["THEY SAID", "GET A JOB."],
  ["WE ASKED:", "WHY?"],
  ["THEN WE", "BUILT BEROZGAR."],
];

const VALUES: [string, string][] = [
  ["REJECT CONVENTIONAL EXPECTATIONS", "The script was never ours to follow."],
  ["BUILD YOUR OWN PATH", "No map. No permission slip."],
  ["CREATIVITY OVER CONFORMITY", "Make the thing. Then make it louder."],
  ["STREET CULTURE", "The street is the studio."],
  ["INDEPENDENCE", "Own the outcome, whatever it is."],
  ["AMBITION", "Unemployed is a starting line."],
];

export default function ManifestoPage() {
  return (
    <div className="page-fade">
      <RevealObserver />

      {CHAPTERS.map(([eyebrow, line], i) => (
        <section key={eyebrow} className={`mani-sec ${i % 2 ? "sec-of" : "sec-bk"}`}>
          <div className="wrap">
            <p className="eyebrow mut" data-rev="true" style={{ opacity: i % 2 ? 1 : 0.6 }}>
              0{i + 1} — {eyebrow}
            </p>
            <p className="big manif-line" style={{ color: i % 2 ? "var(--bk)" : undefined }}>
              {i === 2 ? <>BUILT <em>BEROZGAR</em>.</> : line}
            </p>
          </div>
        </section>
      ))}

      <section className="sec">
        <div className="wrap">
          <div className="sec-t">
            <h2 className="h2">WHAT WE STAND FOR</h2>
          </div>
          <div className="vals" data-rev="true">
            {VALUES.map(([title, copy]) => (
              <div key={title}>
                <b>{title}</b>
                <span style={{ marginTop: "8px", display: "block" }}>{copy}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "64px" }} data-rev="true">
            <p className="d-lg" style={{ marginBottom: "28px" }}>WEAR YOUR REASON.</p>
            <Link href="/collections/drop-001" className="btn">SHOP THE DROP</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
