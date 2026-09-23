"use client";

import Link from "next/link";
import { useState } from "react";
import type { Article } from "@/lib/data";
import { journalCategories } from "@/lib/data";
import { Plate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";
import { showToast } from "@/lib/ui-events";

export function JournalClient({ articles }: { articles: Article[] }) {
  const [category, setCategory] = useState("ALL");
  const featured = articles.find((a) => a.featured) || articles[0];
  const rest = articles.filter((a) => !a.featured);

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "48px 0 90px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / JOURNAL
        </div>

        <header style={{ padding: "16px 0 32px" }} data-rev="true">
          <p className="eyebrow mut">MAGAZINE</p>
          <h1 className="h1" style={{ marginTop: "10px" }}>BEROZGAR JOURNAL</h1>
        </header>

        <div className="cats" style={{ marginBottom: "32px" }}>
          {journalCategories.map((cat) => (
            <button
              key={cat}
              className={`chip ${category === cat ? "on" : ""}`.trim()}
              onClick={() => { setCategory(cat); showToast(`FILTER: ${cat}`); }}
            >
              {cat}
            </button>
          ))}
        </div>

        <Link href={`/journal/${featured.slug}`} className="jfeat" data-rev="true" style={{ display: "block", position: "relative" }}>
          <div style={{ aspectRatio: "16 / 8" }}>
            <Plate slug={featured.slug} word={featured.category} label={featured.title} variant={3} />
          </div>
          <div style={{ padding: "22px 0 0" }}>
            <span className="cap mut">{featured.category} — {featured.date} — {featured.readTime}</span>
            <h2 className="d-md" style={{ margin: "10px 0" }}>{featured.title}</h2>
            <span className="tlink">READ →</span>
          </div>
        </Link>

        <div className="sec-t" style={{ marginTop: "56px" }}>
          <h2 className="h2">LATEST</h2>
        </div>

        <div className="grid-ed" data-rev="true">
          {rest.map((article) => (
            <Link key={article.slug} className="jcard" href={`/journal/${article.slug}`}>
              <Plate slug={article.slug} word={article.category} label={article.title} variant={0} />
              <span className="cap mut">{article.category} — {article.date} — {article.readTime}</span>
              <span className="h3">{article.title}</span>
              <span className="tlink">READ →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
