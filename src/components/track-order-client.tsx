"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import { RevealObserver } from "@/components/reveal-observer";
import { readStored, useHydrated } from "@/lib/use-hydrated";
import {
  LAST_ORDER_KEY,
  TRACK_STEPS,
  formatStamp,
  statusDetail,
  stepTimes,
  trackStep,
  type TrackedOrder,
} from "@/lib/tracking";

type Lookup =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found"; order: TrackedOrder }
  | { state: "missing" }
  | { state: "error" };

async function fetchOrder(id: string, phone: string): Promise<Lookup> {
  try {
    const res = await fetch(`/api/track?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`);
    if (res.status === 404) return { state: "missing" };
    if (!res.ok) return { state: "error" };
    return { state: "found", order: (await res.json()) as TrackedOrder };
  } catch {
    return { state: "error" };
  }
}

const inr = (s: string) => `₹${Number(s).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const { user } = useSession();

  const initialId = (searchParams.get("id") ?? "").toUpperCase();
  const [orderId, setOrderId] = useState(initialId);
  /* null = untouched: fall back to the phone saved with the order just placed, then the session. */
  const [phoneEdit, setPhoneEdit] = useState<string | null>(null);
  const saved = hydrated ? readStored<{ id?: string; phone?: string } | null>(LAST_ORDER_KEY, null) : null;
  const phone = phoneEdit ?? (saved?.id === orderId ? saved.phone : undefined) ?? user?.phone ?? "";
  const [result, setResult] = useState<Lookup>({ state: "idle" });

  /* Arriving from the success page with the order and its phone known: look it up straight away. */
  const autoPhone = saved?.id === initialId ? saved?.phone : undefined;
  useEffect(() => {
    if (!initialId || !autoPhone) return;
    let cancelled = false;
    void fetchOrder(initialId, autoPhone).then((next) => { if (!cancelled) setResult(next); });
    return () => { cancelled = true; };
  }, [initialId, autoPhone]);

  /* Idle with an automatic lookup pending reads as loading. */
  const lookup: Lookup = result.state === "idle" && initialId && autoPhone ? { state: "loading" } : result;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult({ state: "loading" });
    setResult(await fetchOrder(orderId.trim().toUpperCase(), phone.trim()));
  }

  const order = lookup.state === "found" ? lookup.order : null;
  const step = order ? trackStep(order.status) : -1;
  const times = order ? stepTimes(order) : [];
  const terminal = order && (order.status === "CANCELLED" || order.status === "RETURNED");

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "48px 0 90px", maxWidth: "760px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / TRACK ORDER
        </div>

        <h1 className="h1" style={{ marginTop: "16px" }} data-rev="true">TRACK ORDER</h1>
        {order && <p className="cap mut" style={{ marginTop: "8px" }}>ORDER #{order.orderNumber}</p>}

        <form className="coupon" style={{ maxWidth: "520px", marginTop: "24px" }} onSubmit={submit}>
          <input
            type="text"
            name="oid"
            placeholder="ORDER NUMBER"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            aria-label="Order number"
            required
          />
          <input
            type="tel"
            name="ph"
            placeholder="PHONE USED AT CHECKOUT"
            value={phone}
            onChange={(e) => setPhoneEdit(e.target.value)}
            aria-label="Phone used at checkout"
            required
            style={{ borderLeft: "1px solid var(--bk)" }}
          />
          <button type="submit" disabled={lookup.state === "loading"}>
            {lookup.state === "loading" ? "…" : "TRACK"}
          </button>
        </form>

        {lookup.state === "missing" && (
          <p className="small" style={{ marginTop: "20px" }}>
            We couldn&apos;t find an order with that number and phone. Check both and try again.
          </p>
        )}
        {lookup.state === "error" && (
          <p className="small" style={{ marginTop: "20px" }}>Tracking is unavailable right now. Try again in a moment.</p>
        )}

        {order && terminal && (
          <div className="co-fail inline" role="status">
            <b className="cap">{order.status === "CANCELLED" ? "ORDER CANCELLED" : "ORDER RETURNED"}</b>
            <p className="small" style={{ marginTop: "6px" }}>
              {order.status === "CANCELLED"
                ? "This order was cancelled. If you paid for it, the refund goes back to the original method."
                : "This order was returned. Your refund is being processed."}
            </p>
          </div>
        )}

        {order && !terminal && (
          <div className="tl" data-rev="true">
            {TRACK_STEPS.map((label, i) => (
              <div key={label} className={`tl-i ${i < step ? "done" : ""} ${i === step ? "cur" : ""}`.replace(/\s+/g, " ").trim()}>
                <b>
                  {i <= step ? (i < step ? "✓ " : "● ") : "○ "}
                  {label}
                  {i === step && statusDetail(order.status) ? ` — ${statusDetail(order.status)}` : ""}
                </b>
                <small>{formatStamp(times[i] ?? null)}</small>
              </div>
            ))}
          </div>
        )}

        {order && (
          <div style={{ marginTop: "28px" }}>
            {order.items.map((item, i) => (
              <div className="sumrow" key={`${item.slug}-${item.size}-${item.colour}-${i}`}>
                <span className="small">
                  <Link href={`/shop/${item.slug}`}>{item.name}</Link> — {item.size} / {item.colour} × {item.quantity}
                </span>
                <span className="num small">{inr(item.unitPrice)}</span>
              </div>
            ))}
            <div className="sumrow tot">
              <span>Total (incl. GST)</span>
              <span className="num">{inr(order.totals.grandTotal)}</span>
            </div>
          </div>
        )}

        <Link href="/account/orders" className="tlink" style={{ marginTop: "28px", display: "inline-block" }}>VIEW ALL ORDERS →</Link>
      </div>
    </div>
  );
}
