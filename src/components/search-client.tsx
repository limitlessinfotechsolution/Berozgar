"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { RevealObserver } from "@/components/reveal-observer";
import { useCatalogue } from "@/components/catalogue-provider";
import { searchProducts, resultCategories, trendingTerms } from "@/lib/search";

type Sort = "relevance" | "price-asc" | "price-desc";

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim();

  const [draft, setDraft] = useState(query);
  const [sort, setSort] = useState<Sort>("relevance");

  const { products } = useCatalogue();
  const matches = searchProducts(products, query);
  const categories = resultCategories(matches);
  const trending = trendingTerms(products);

  const results = [...matches];
  if (sort === "price-asc") results.sort((a, b) => a.priceMinor - b.priceMinor);
  if (sort === "price-desc") results.sort((a, b) => b.priceMinor - a.priceMinor);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(draft.trim() ? `/search?q=${encodeURIComponent(draft.trim())}` : "/search");
  }

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "40px 0 90px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / SEARCH
        </div>

        <header style={{ padding: "18px 0 8px" }} data-rev="true">
          <h1 className="h1">SEARCH</h1>
          {query && (
            <p className="small mut" style={{ marginTop: "6px" }}>
              {results.length} RESULT{results.length !== 1 ? "S" : ""} FOR &quot;{query.toUpperCase()}&quot;
            </p>
          )}
        </header>

        <form className="coupon" style={{ maxWidth: "540px", margin: "18px 0 24px" }} onSubmit={submit}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="oversized black tee"
            aria-label="Search products"
          />
          <button type="submit">SEARCH</button>
        </form>

        {!query ? (
          <div data-rev="true">
            <h2 className="cap mut" style={{ marginBottom: "12px" }}>TRENDING</h2>
            <div className="s-trend">
              {trending.map((term) => (
                <Link key={term} className="chip" href={`/search?q=${encodeURIComponent(term)}`}>
                  {term.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="empty" data-rev="true">
            <h2 className="h3">NO RESULTS FOR &quot;{query.toUpperCase()}&quot;</h2>
            {trending.length > 0 && <p className="small mut">Try: {trending.join(" · ")}</p>}
            <Link href="/shop" className="btn" style={{ marginTop: "20px" }}>BROWSE THE SHOP</Link>
          </div>
        ) : (
          <>
            <div className="shop-top">
              <div className="s-trend">
                {categories.map(([slug, label]) => (
                  <Link key={slug} className="chip" href={`/shop?cat=${slug}`}>
                    {label}
                  </Link>
                ))}
              </div>
              <label className="sortsel only-d">
                <span className="cap mut">SORT</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  <option value="relevance">RELEVANCE</option>
                  <option value="price-asc">PRICE: LOW → HIGH</option>
                  <option value="price-desc">PRICE: HIGH → LOW</option>
                </select>
              </label>
            </div>

            <div className="grid4" style={{ marginTop: "24px" }}>
              {results.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
