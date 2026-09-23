import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { getCatalogue, getCatalogueOrThrow } from "@/lib/catalogue";
import { categoriesOf } from "@/lib/catalogue-map";
import { HeroPlate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";

const DROP = "drop-001";

export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getCatalogueOrThrow();
  return [{ slug: DROP }, ...categoriesOf(products).map((c) => ({ slug: c.slug }))];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === DROP) return { title: "DROP 001 — BEROZGAR", description: "Drop 001 — The First Statement." };
  const category = categoriesOf(await getCatalogue()).find((c) => c.slug === slug);
  return { title: `${category?.name ?? "COLLECTION"} — BEROZGAR` };
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getCatalogue();

  const isDrop = slug === DROP;
  const category = isDrop ? null : categoriesOf(products).find((c) => c.slug === slug);
  if (!isDrop && !category) notFound();

  const listed = isDrop ? products : products.filter((p) => p.category === slug);
  const title = isDrop ? "DROP 001" : category!.name;

  return (
    <div className="page-fade">
      <RevealObserver />

      <section className="hero" style={{ minHeight: "70vh" }}>
        <div className="hero-bg">
          <HeroPlate word={title} num="001" className="pt-a" />
        </div>
        <div className="hero-veil"></div>
        <div className="wrap hero-in">
          <p className="eyebrow" style={{ opacity: 0.7 }}>{isDrop ? "LIMITED COLLECTION" : "COLLECTION"}</p>
          <h1 className="d-lg" style={{ marginTop: "16px" }}>
            {isDrop ? <>DROP 001<br />THE FIRST STATEMENT.</> : title}
          </h1>
          {isDrop && (
            <div style={{ marginTop: "22px", display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "var(--ru)", display: "inline-block" }}></span>
              <span className="cap">LIVE NOW</span>
              <span className="cap mut" style={{ marginLeft: "12px" }}>WHILE STOCK LASTS</span>
            </div>
          )}
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div style={{ maxWidth: "640px" }} data-rev="true">
            <p className="eyebrow mut" style={{ marginBottom: "12px" }}>ABOUT THIS COLLECTION</p>
            <p className="body">
              {isDrop
                ? `The system doesn't define you. Drop 001 is our first argument against that system. ${listed.length} piece${listed.length === 1 ? "" : "s"}. Limited quantities. When it's gone, it's gone.`
                : `${listed.length} piece${listed.length === 1 ? "" : "s"} in ${title}.`}
            </p>
          </div>

          {listed.length > 0 ? (
            <div className="grid4 drop-grid" style={{ marginTop: "48px" }}>
              {listed.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="empty">
              <h2 className="h3">NOTHING HERE RIGHT NOW.</h2>
              <p>Check back shortly.</p>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "56px" }} data-rev="true">
            <Link href="/shop" className="btn btn-o">SHOP EVERYTHING</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
