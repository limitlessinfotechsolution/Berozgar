"use client";

import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/product-card";
import { HeroPlate, Plate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";
import { useCatalogue } from "@/components/catalogue-provider";
import { openQuickAdd } from "@/lib/ui-events";
import { articles, looks } from "@/lib/data";

/* Where the three "shop the look" hotspots sit on the plate. */
const HOTSPOTS = [
  { left: "38%", top: "26%" },
  { left: "62%", top: "66%" },
  { left: "50%", top: "10%" },
];

export default function Home() {
  /* Products come from the ERP; the homepage features the newest, then the rest. */
  const { products } = useCatalogue();
  const featured = products.slice(0, 4);
  const more = products.slice(4, 10).length ? products.slice(4, 10) : products.slice(0, 6);
  const inStock = products.filter((p) => !p.soldout);

  /* Lookbook and journal come from src/lib/data.ts, the same source /lookbook and
     /journal read, so an edit there changes every surface that shows them. */
  const homeArticles = articles.filter((a) => !a.featured).slice(0, 3);

  const carousel = useRef<HTMLDivElement>(null);
  const scrollCarousel = (direction: 1 | -1) => {
    const track = carousel.current;
    if (!track) return;
    /* One card plus its gap, so a click advances by a whole product. */
    const step = track.firstElementChild?.clientWidth ?? track.clientWidth / 2;
    track.scrollBy({ left: direction * (step + 18), behavior: "smooth" });
  };

  return (
    <>
      <RevealObserver />
        <div className="page-fade">
          
          {/* 1. HERO SECTION */}
          <section className="hero">
            <div className="hero-bg">
              <HeroPlate word="REASON" num="001" className="pt-c" />
            </div>
            <div className="hero-veil"></div>
            <div className="wrap hero-in">
              <p className="eyebrow" style={{ opacity: 0.7 }}>DROP 001 — LIVE NOW</p>
              <h1 className="d-xl" style={{ marginTop: "18px" }}>
                <span><i>UNEMPLOYED</i></span>
                <span><i>FOR A REASON.</i></span>
              </h1>
              <div className="hero-cta">
                <Link href="/collections/drop-001" className="btn btn-w">SHOP THE DROP</Link>
                <Link href="/manifesto" className="tlink tlink-w">READ THE MANIFESTO →</Link>
              </div>
            </div>
            <span className="hero-side only-d">EST. MUMBAI — UNEMPLOYED FOR A REASON</span>
            <div className="scroll-ind">SCROLL<i></i></div>
          </section>

          {/* 2. MARQUEE SECTION */}
          <div className="marq" aria-hidden="true">
            <div className="marq-in">
              <span>
                <span>UNEMPLOYED FOR A REASON</span><span>•</span>
                <span>DROP 001 — THE FIRST STATEMENT</span><span>•</span>
                <b>LIMITED QUANTITIES</b><span>•</span>
              </span>
              <span>
                <span>UNEMPLOYED FOR A REASON</span><span>•</span>
                <span>DROP 001 — THE FIRST STATEMENT</span><span>•</span>
                <b>LIMITED QUANTITIES</b><span>•</span>
              </span>
            </div>
          </div>

          {/* 3. DROP 001 GRID SECTION */}
          <section className="sec">
            <div className="wrap">
              <div className="sec-t" data-rev="true">
                <div>
                  <p className="eyebrow mut">NEW DROP</p>
                  <h2 className="h1" style={{ marginTop: "8px" }}>DROP 001<br />THE FIRST STATEMENT.</h2>
                </div>
                <Link href="/collections/drop-001" className="tlink">VIEW COLLECTION →</Link>
              </div>
              <div className="grid4 drop-grid">
                {featured.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            </div>
          </section>

          {/* 4. EDITORIAL / CAMPAIGN SECTION */}
          <section className="editorial">
            <div className="plate t3 pt-d"></div>
            <div className="editorial-veil"></div>
            <div className="wrap editorial-in" data-rev="true">
              <p className="eyebrow" style={{ opacity: 0.6 }}>THE NEW BEROZGAR CAMPAIGN</p>
              <h2 className="d-lg" style={{ margin: "12px 0 24px" }}>WEAR YOUR<br />REASON.</h2>
              <Link href="/manifesto" className="tlink tlink-w">EXPLORE →</Link>
            </div>
          </section>

          {/* 5. BEST SELLERS CAROUSEL SECTION */}
          <section className="sec">
            <div className="wrap">
              <div className="sec-t" data-rev="true">
                <h2 className="h2">MORE TO SHOP</h2>
                <Link href="/shop" className="tlink">SHOP ALL →</Link>
              </div>
              <div className="car-wrap">
                <button
                  className="car-nav car-prev only-d"
                  aria-label="Previous"
                  onClick={() => scrollCarousel(-1)}
                >
                  ←
                </button>
                <div className="car" id="best-car" ref={carousel}>
                  {more.map(product => <ProductCard key={product.id} product={product} />)}
                </div>
                <button
                  className="car-nav car-next only-d"
                  aria-label="Next"
                  onClick={() => scrollCarousel(1)}
                >
                  →
                </button>
              </div>
            </div>
          </section>

          {/* 6. MANIFESTO BAND */}
          <section className="sec sec-bk manif-home">
            <div className="wrap">
              <div data-rev="true">
                <p className="eyebrow" style={{ opacity: 0.55, marginBottom: "24px" }}>BRAND MANIFESTO</p>
              </div>
              <p className="manif-line">THE WORLD ASKED US TO GET A JOB.</p>
              <p className="manif-line" style={{ marginTop: "8px" }}>WE BUILT <em>A BRAND</em> INSTEAD.</p>
              <div data-rev="true" style={{ marginTop: "40px" }}>
                <Link href="/manifesto" className="tlink tlink-w">READ THE MANIFESTO →</Link>
              </div>
            </div>
          </section>

          {/* 7. LOOKBOOK GRID */}
          <section className="sec">
            <div className="wrap">
              <div className="sec-t" data-rev="true">
                <h2 className="h2">LOOKBOOK</h2>
                <Link href="/lookbook" className="tlink">VIEW LOOKBOOK →</Link>
              </div>
              <div className="lookgrid">
                {looks.map((look, i) => (
                  <Link className={`looktile ${look.size}`} href={`/lookbook/${look.slug}`} key={look.slug}>
                    <Plate
                      slug={look.slug}
                      word={look.name.replace("LOOK ", "L")}
                      label={look.name}
                      variant={i}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* 8. SHOP THE LOOK HOTSPOTS */}
          <section className="sec sec-of">
            <div className="wrap">
              <div className="sec-t" data-rev="true">
                <div>
                  <p className="eyebrow mut">SHOP THE LOOK</p>
                  <h2 className="h2" style={{ marginTop: "8px" }}>BUILD THE FIT.</h2>
                </div>
              </div>
              <div className="hotwrap" data-rev="true">
                <div style={{ aspectRatio: "16 / 10" }}>
                  <div className="plate t3 pt-a" role="img" aria-label="Shop the look">
                    <span className="pl-num">29</span>
                    <span className="pl-word">THE FIT</span>
                    <span className="pl-tag">UNEMPLOYED</span>
                    <span className="pl-vert">BEROZGAR</span>
                  </div>
                </div>
                {inStock.slice(0, HOTSPOTS.length).map((product, i) => (
                  <button
                    key={product.id}
                    className="hot"
                    style={HOTSPOTS[i]}
                    aria-label={`Quick add ${product.name}`}
                    onClick={() => openQuickAdd(product.id)}
                  ></button>
                ))}
              </div>
              <p className="small mut" style={{ marginTop: "12px" }}>Click a hotspot → quick add.</p>
            </div>
          </section>

          {/*
            No #BEROZGAR UGC grid. It listed eight invented customers by Instagram
            handle (@tejas.wears, @ananya.fits, …) — people who don't exist, credited
            for photos that were never submitted. There is no UGC submission model in
            the ERP and no moderation flow; the section returns when real posts do.
          */}

          {/* 9. JOURNAL SECTION */}
          <section className="sec">
            <div className="wrap">
              <div className="sec-t" data-rev="true">
                <h2 className="h2">JOURNAL</h2>
                <Link href="/journal" className="tlink">ALL STORIES →</Link>
              </div>
              <div className="grid-ed" data-rev="true">
                {homeArticles.map((article) => (
                  <Link className="jcard" href={`/journal/${article.slug}`} key={article.slug}>
                    <Plate slug={article.slug} word={article.category} label={article.title} />
                    <span className="cap mut">{article.category} — {article.readTime}</span>
                    <span className="h3">{article.title}</span>
                    <span className="tlink">READ →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* 10. NEWSLETTER BAND */}
          <section className="sec sec-bk nl-band">
            <div className="plate t3 pt-b"></div>
            <div className="wrap nl-in" data-rev="true">
              <p className="eyebrow" style={{ opacity: 0.6 }}>NEWSLETTER</p>
              <h2 className="d-lg" style={{ marginTop: "14px" }}>JOIN THE<br />UNEMPLOYED.</h2>
              <p style={{ marginTop: "14px", opacity: 0.7 }}>Drops. Stories. No bullshit.</p>
              <form className="nl-form" onSubmit={(e) => e.preventDefault()}>
                <input type="email" required placeholder="EMAIL ADDRESS" aria-label="Email" />
                <button type="submit">JOIN</button>
              </form>
            </div>
          </section>
        </div>

    </>
  );
}
