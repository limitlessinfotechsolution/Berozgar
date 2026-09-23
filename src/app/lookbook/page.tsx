import Link from "next/link";
import { looks } from "@/lib/data";
import { Plate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";

export const metadata = {
  title: "LOOKBOOK — BEROZGAR",
  description: "Berozgar lookbook and campaigns.",
};

export default function LookbookPage() {
  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "48px 0 90px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / LOOKBOOK
        </div>

        <header style={{ padding: "16px 0 36px" }} data-rev="true">
          <p className="eyebrow mut">DROP 001 — EDITORIAL</p>
          <h1 className="h1" style={{ marginTop: "10px" }}>LOOKBOOK</h1>
        </header>

        <div className="lookgrid">
          {looks.map((look, i) => (
            <Link key={look.slug} className={`looktile ${look.size}`} href={`/lookbook/${look.slug}`} data-rev="true">
              <Plate slug={look.slug} word={look.name.replace("LOOK ", "L")} label={look.name} variant={i} />
              <span className="pl-tag" style={{ zIndex: 2 }}>{look.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
