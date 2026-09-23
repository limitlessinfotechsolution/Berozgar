import Link from "next/link";
import { SizeFinder, SizeChartTable, HowToMeasure } from "@/components/size-finder";

export const metadata = {
  title: "SIZE GUIDE — BEROZGAR",
  description: "Measurements, fit notes and a size finder for Berozgar pieces.",
};

export default function SizeGuidePage() {
  return (
    <>
      <header style={{ marginBottom: "28px" }}>
        <p className="eyebrow mut">PRODUCTS</p>
        <h1 className="h1" style={{ marginTop: "10px" }}>SIZE GUIDE</h1>
        <p className="body mut" style={{ marginTop: "12px", maxWidth: "560px" }}>
          Our cuts are oversized by design — boxy through the body with a drop shoulder. If
          you&apos;re between sizes and want it closer to the body, size down.
        </p>
      </header>

      <section className="legal-sec" data-rev="true">
        <h2 className="h3">MEASUREMENTS</h2>
        <SizeChartTable />
      </section>

      <section className="legal-sec" data-rev="true">
        <h2 className="h3">HOW TO MEASURE</h2>
        <HowToMeasure />
      </section>

      <section className="legal-sec">
        <h2 className="h3">FIND YOUR SIZE</h2>
        <SizeFinder />
      </section>

      <p className="small mut" style={{ marginTop: "32px" }}>
        Still unsure?{" "}
        <Link href="/help/contact" className="tlink" style={{ border: 0 }}>ASK US</Link> — we&apos;ll
        tell you what we&apos;d wear.
      </p>
    </>
  );
}
