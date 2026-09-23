import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { getCatalogue } from "@/lib/catalogue";
import { getProduct } from "@/lib/products";
import { getArticle, articles } from "@/lib/data";
import { Plate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) return { title: "JOURNAL — BEROZGAR" };

  return {
    title: `${article.title} — BEROZGAR`,
    description: article.body[0].slice(0, 160),
  };
}

export default async function JournalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) notFound();

  /* Editorial references products by slug; ones no longer in the ERP catalogue drop out. */
  const products = await getCatalogue();
  const related = article.relatedSlugs
    .map((slug) => getProduct(products, slug))
    .filter((p) => p !== undefined);

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ maxWidth: "820px", padding: "48px 0 90px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / <Link href="/journal">JOURNAL</Link> / {article.category}
        </div>

        <header style={{ padding: "20px 0 28px" }} data-rev="true">
          <span className="cap mut">{article.category} — {article.date} — {article.readTime}</span>
          <h1 className="h1" style={{ marginTop: "14px" }}>{article.title}</h1>
        </header>

        <div style={{ aspectRatio: "16 / 8", marginBottom: "36px" }} data-rev="true">
          <Plate slug={article.slug} word={article.category} label={article.title} variant={1} />
        </div>

        <div data-rev="true">
          {article.body.slice(0, 1).map((para, i) => (
            <p className="body" key={i} style={{ fontSize: "19px", lineHeight: 1.8, marginBottom: "24px" }}>{para}</p>
          ))}
          <blockquote
            style={{
              borderLeft: "3px solid var(--ru)",
              padding: "6px 0 6px 22px",
              margin: "32px 0",
              fontWeight: 800,
              fontSize: "22px",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            THE SYSTEM DOESN&apos;T DEFINE YOU.
          </blockquote>
          {article.body.slice(1).map((para, i) => (
            <p className="body" key={i} style={{ marginBottom: "24px" }}>{para}</p>
          ))}
        </div>

        {related.length > 0 && (
          <>
            <div className="sec-t" style={{ marginTop: "56px" }}>
              <h3 className="cap">SHOP THE STORY</h3>
            </div>
            <div className="grid2" style={{ marginBottom: "56px" }}>
              {related.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}

        <Link href="/journal" className="tlink">← BACK TO JOURNAL</Link>
      </div>
    </div>
  );
}
