"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FormError } from "@/components/form-error";
import { accountApi } from "@/lib/account-client";
import { showToast } from "@/lib/ui-events";

type Item = {
  orderNumber: string;
  orderedAt: string;
  productId: string;
  productName: string;
  slug: string;
  review: { rating: number; status: "PENDING" | "APPROVED" | "REJECTED" } | null;
};

const STATUS: Record<string, string> = {
  PENDING: "AWAITING APPROVAL",
  APPROVED: "PUBLISHED",
  REJECTED: "NOT PUBLISHED",
};

function ReviewForm({ item, onDone }: { item: Item; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) return setError("Pick a star rating.");
    setBusy(true);
    setError(null);
    const result = await accountApi("/api/account/reviews", {
      method: "POST",
      body: { orderNumber: item.orderNumber, productId: item.productId, rating, title: title.trim() || null, comment: comment.trim() || null },
    });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    showToast("THANKS — YOUR REVIEW IS WITH US");
    onDone();
  }

  return (
    <form onSubmit={submit} style={{ marginTop: "14px" }}>
      <FormError message={error} />
      <div role="radiogroup" aria-label="Rating" style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            style={{ fontSize: "24px", background: "none", border: 0, cursor: "pointer", padding: 0, lineHeight: 1 }}
          >
            {n <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <div className="fgrp">
        <label className="fl" htmlFor={`rv-t-${item.productId}`}>HEADLINE (OPTIONAL)</label>
        <input className="inp" id={`rv-t-${item.productId}`} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="fgrp">
        <label className="fl" htmlFor={`rv-c-${item.productId}`}>YOUR REVIEW (OPTIONAL)</label>
        <textarea
          className="inp"
          id={`rv-c-${item.productId}`}
          rows={4}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ minHeight: "100px", padding: "14px 16px", resize: "vertical" }}
        />
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "SENDING…" : "SUBMIT REVIEW"}</button>
    </form>
  );
}

/* Items from delivered orders, each reviewable once. Reviews go live after a quick check. */
export default function AccountReviewsPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await accountApi<{ data: Item[] }>("/api/account/reviews");
    if (result.ok) setItems(result.data.data);
    else setError(result.error);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the list loads after mount
    void load();
  }, [load]);

  return (
    <>
      <h1 className="h2">REVIEWS</h1>
      <p className="small mut" style={{ marginTop: "8px" }}>
        Tell others how it fits and wears. Reviews appear on the product page after a quick check.
      </p>
      <FormError message={error} />
      {!items && !error && <p className="small mut" style={{ marginTop: "16px" }}>LOADING…</p>}
      {items?.length === 0 && (
        <p className="small mut" style={{ marginTop: "16px" }}>
          Once an order is delivered, you can review its items here.
        </p>
      )}
      {items?.map((item) => {
        const key = `${item.orderNumber}:${item.productId}`;
        return (
          <div className="addr-card" key={key} style={{ marginTop: "16px", display: "block" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <Link href={`/shop/${item.slug}`} className="cap">{item.productName}</Link>
                <p className="small mut">ORDER #{item.orderNumber}</p>
              </div>
              {item.review ? (
                <span className="small">
                  {"★".repeat(item.review.rating)} · {STATUS[item.review.status]}
                </span>
              ) : open === key ? null : (
                <button className="btn btn-o" onClick={() => setOpen(key)}>WRITE A REVIEW</button>
              )}
            </div>
            {!item.review && open === key && (
              <ReviewForm item={item} onDone={() => { setOpen(null); void load(); }} />
            )}
          </div>
        );
      })}
    </>
  );
}
