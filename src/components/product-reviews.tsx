"use client";

import { useEffect, useState } from "react";

type ReviewPage = {
  average: string | null;
  count: number;
  breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
  page: number;
  totalPages: number;
  data: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    reply: string | null;
    author: string;
    createdAt: string;
  }[];
};

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

/*
 * Approved reviews from the ERP — every one from a delivered order. Renders nothing
 * until there is at least one: no empty shell, no made-up ratings.
 */
export function ProductReviews({ slug }: { slug: string }) {
  const [data, setData] = useState<ReviewPage | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let live = true;
    fetch(`/api/products/${encodeURIComponent(slug)}/reviews?page=${page}`)
      .then((res) => (res.ok ? (res.json() as Promise<ReviewPage>) : null))
      .then((body) => {
        if (!live || !body) return;
        setData((current) => (page === 1 || !current ? body : { ...body, data: [...current.data, ...body.data] }));
      })
      .catch(() => undefined);
    return () => { live = false; };
  }, [slug, page]);

  if (!data || data.count === 0) return null;

  return (
    <section className="sec">
      <div className="wrap">
        <div className="sec-t"><h2 className="h2">REVIEWS</h2></div>
        <div className="rev-sum">
          <div>
            <p className="d-md" style={{ lineHeight: 1 }}>{data.average}</p>
            <p className="small">{stars(Math.round(Number(data.average)))}</p>
            <p className="small mut">{data.count} VERIFIED {data.count === 1 ? "BUYER" : "BUYERS"}</p>
          </div>
          <div style={{ flex: 1, minWidth: "220px" }}>
            {(["5", "4", "3", "2", "1"] as const).map((k) => (
              <div className="bar-row" key={k}>
                <span>{k} STAR</span>
                <span className="bar"><i style={{ width: `${data.count ? (data.breakdown[k] / data.count) * 100 : 0}%` }} /></span>
                <span className="mut">{data.breakdown[k]}</span>
              </div>
            ))}
          </div>
        </div>

        {data.data.map((r) => (
          <article className="rev-card" key={r.id}>
            <div className="rev-top">
              <b className="small">{stars(r.rating)}</b>
              <span className="small mut">
                {r.author} · VERIFIED BUYER · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            {r.title && <h3 className="cap" style={{ marginBottom: "6px" }}>{r.title}</h3>}
            {r.comment && <p className="small" style={{ lineHeight: 1.7 }}>{r.comment}</p>}
            {r.reply && (
              <p className="small mut" style={{ marginTop: "10px", paddingLeft: "12px", borderLeft: "2px solid var(--gy)" }}>
                <b>BEROZGAR:</b> {r.reply}
              </p>
            )}
          </article>
        ))}

        {data.page < data.totalPages && (
          <button className="btn btn-o" style={{ marginTop: "12px" }} onClick={() => setPage((p) => p + 1)}>
            MORE REVIEWS
          </button>
        )}
      </div>
    </section>
  );
}
