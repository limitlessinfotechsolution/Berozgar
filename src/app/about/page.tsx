import Link from "next/link";
import { HeroPlate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";

export const metadata = {
  title: "ABOUT — BEROZGAR",
  description: "Who is Berozgar? Premium Indian streetwear, built with the street.",
};

const SECTIONS: [string, string][] = [
  ["OUR PHILOSOPHY", "Creativity over conformity. Heavyweight fabrics, honest construction, and statements that don't ask for permission."],
  ["OUR CULTURE", "Built with the street, not for it. From Mumbai local trains to Delhi basements — the culture designs with us."],
  ["OUR FUTURE", "Drops, collabs, and a community of people who chose their own path. The system doesn't define us."],
];

export default function AboutPage() {
  return (
    <div className="page-fade">
      <RevealObserver />

      <section className="sec-bk" style={{ minHeight: "60vh", display: "flex", alignItems: "center" }}>
        <div className="wrap" data-rev="true">
          <p className="eyebrow" style={{ opacity: 0.6 }}>ABOUT</p>
          <h1 className="d-lg" style={{ marginTop: "16px" }}>WHO IS<br />BEROZGAR?</h1>
        </div>
      </section>

      <section className="sec">
        <div className="wrap" style={{ maxWidth: "820px" }}>
          <div data-rev="true">
            <p className="eyebrow mut">OUR STORY</p>
            <p className="d-md" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 600, marginTop: "16px", lineHeight: 1.35 }}>
              &quot;Berozgar&quot; means unemployed. It&apos;s the label the world hands you when you don&apos;t follow the script. We took the word, printed it in 900-weight type, and made it a flag.
            </p>
          </div>

          <div style={{ margin: "56px 0" }} data-rev="true">
            <div style={{ aspectRatio: "16 / 8" }}>
              <HeroPlate word="EST. 2025" num="BRZ" className="pt-d" />
            </div>
          </div>

          {SECTIONS.map(([title, copy]) => (
            <div key={title} style={{ margin: "44px 0" }} data-rev="true">
              <h2 className="h2">{title}</h2>
              <p className="body mut" style={{ maxWidth: "620px", marginTop: "12px" }}>{copy}</p>
            </div>
          ))}

          <div style={{ textAlign: "center", marginTop: "56px" }} data-rev="true">
            <Link href="/manifesto" className="btn">READ THE MANIFESTO</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
