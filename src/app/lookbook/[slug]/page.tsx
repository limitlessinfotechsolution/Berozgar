import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalogue } from "@/lib/catalogue";
import { getProduct } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { getLook, looks } from "@/lib/data";
import { Plate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";
import { LookScrollButton } from "@/components/look-scroll-button";

export async function generateStaticParams() {
  return looks.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const look = getLook(slug);
  return { title: look ? `${look.name} — BEROZGAR` : "LOOKBOOK — BEROZGAR" };
}

export default async function LookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const look = getLook(slug);

  if (!look) notFound();

  /* Looks reference products by slug; ones no longer in the ERP catalogue drop out. */
  const products = await getCatalogue();
  const items = look.itemSlugs
    .map((slug) => getProduct(products, slug))
    .filter((p) => p !== undefined);

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "40px 0 90px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / <Link href="/lookbook">LOOKBOOK</Link> / {look.name}
        </div>

        <div className="lookdet-hero" style={{ marginTop: "20px" }} data-rev="true">
          <Plate slug={look.slug} word={look.name.replace("LOOK ", "L")} label={look.name} variant={2} />
        </div>

        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px", flexWrap: "wrap", marginTop: "24px" }}
          data-rev="true"
        >
          <div>
            <p className="eyebrow mut">DROP 001</p>
            <h1 className="h1" style={{ marginTop: "8px" }}>{look.name}</h1>
          </div>
          {items.length > 0 && <LookScrollButton />}
        </div>

        {items.length > 0 && (
          <>
            <p className="cap mut" style={{ margin: "14px 0 0" }}>
              IN THIS LOOK — {items.map((p) => p.name.split("—")[0].trim()).join(" · ")}
            </p>

            <div className="grid4" id="look-items" style={{ marginTop: "40px" }}>
              {items.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
