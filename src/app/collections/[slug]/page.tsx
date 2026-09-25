import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { getCatalogue, getCatalogueOrThrow, getUpcomingDrops } from "@/lib/catalogue";
import { categoriesOf } from "@/lib/catalogue-map";
import { HeroPlate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";
import { DropCountdown } from "@/components/drop-countdown";
import { NewsletterForm } from "@/components/newsletter-form";
import { slugify, type Product } from "@/lib/products";

const DROP = "drop-001";

export const dynamicParams = true;

/* Collection names from the ERP ("DROP 002") as slugs ("drop-002"). */
function collectionsOf(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.collection).filter(Boolean))];
}

export async function generateStaticParams() {
  const products = await getCatalogueOrThrow();
  const slugs = new Set([DROP, ...categoriesOf(products).map((c) => c.slug), ...collectionsOf(products).map(slugify)]);
  return [...slugs].map((slug) => ({ slug }));
}

/*
 * What a /collections/<slug> URL means, in order: a scheduled drop that hasn't
 * launched (countdown), an ERP collection, an ERP category, or the original
 * DROP 001 page, which lists everything while no product is tagged with it.
 */
async function resolve(slug: string) {
  const [products, upcoming] = await Promise.all([getCatalogue(), getUpcomingDrops()]);
  const drop = upcoming.find((d) => slugify(d.collection) === slug);
  if (drop) return { kind: "upcoming" as const, drop };

  const inCollection = products.filter((p) => p.collection && slugify(p.collection) === slug);
  if (inCollection.length > 0) {
    return { kind: "list" as const, title: inCollection[0].collection, listed: inCollection, isDrop: true };
  }
  const category = categoriesOf(products).find((c) => c.slug === slug);
  if (category) {
    return { kind: "list" as const, title: category.name, listed: products.filter((p) => p.category === slug), isDrop: false };
  }
  if (slug === DROP) return { kind: "list" as const, title: "DROP 001", listed: products, isDrop: true };
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === DROP) return { title: "DROP 001 — BEROZGAR", description: "Drop 001 — The First Statement." };
  const found = await resolve(slug);
  if (found?.kind === "upcoming") {
    return { title: `${found.drop.collection} — COMING SOON — BEROZGAR`, description: found.drop.headline || undefined };
  }
  return { title: `${found?.title ?? "COLLECTION"} — BEROZGAR` };
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await resolve(slug);
  if (!found) notFound();

  if (found.kind === "upcoming") {
    const { drop } = found;
    return (
      <div className="page-fade">
        <section className="hero" style={{ minHeight: "calc(100svh - var(--ann) - var(--hdr))" }}>
          <div className="hero-bg">
            <HeroPlate word={drop.collection} num={drop.collection.replace(/\D/g, "").slice(-3) || "000"} className="pt-a" />
          </div>
          <div className="hero-veil"></div>
          <div className="wrap hero-in">
            <p className="eyebrow" style={{ opacity: 0.7 }}>COMING SOON</p>
            <h1 className="d-lg" style={{ marginTop: "16px" }}>{drop.collection}</h1>
            {drop.headline && <p className="h3" style={{ marginTop: "14px", opacity: 0.85 }}>{drop.headline}</p>}
            <DropCountdown launchAt={drop.launchAt} />
            <p style={{ marginTop: "28px", opacity: 0.7, maxWidth: "440px" }}>
              Get an email the moment it goes live. Limited quantities — when it&apos;s gone, it&apos;s gone.
            </p>
            <NewsletterForm source={`drop:${drop.collection}`} cta="NOTIFY ME" />
          </div>
        </section>
      </div>
    );
  }

  const { title, listed, isDrop } = found;
  const legacyDrop = slug === DROP && title === "DROP 001";

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
            {legacyDrop ? <>DROP 001<br />THE FIRST STATEMENT.</> : title}
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
              {legacyDrop
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
