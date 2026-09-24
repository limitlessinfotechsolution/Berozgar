"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { readStored, useHydrated } from "@/lib/use-hydrated";
import { RevealObserver } from "@/components/reveal-observer";
import { LAST_ORDER_KEY, paymentState, type PaymentState, type TrackedOrder } from "@/lib/tracking";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function getEta() {
  const date = new Date(Date.now() + 432e6);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

const inr = (s: string) => `₹${Number(s).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* Until the ERP answers, the query string says how checkout ended. */
function stateFromQuery(pay: string | null): PaymentState {
  if (pay === "cod") return "PAY ON DELIVERY";
  if (pay === "paid") return "PAID";
  return "PAYMENT PENDING";
}

const COPY: Record<PaymentState, string> = {
  PAID: "Payment received. We'll confirm your order shortly.",
  "PAY ON DELIVERY": "Pay in cash when it arrives. We'll confirm your order shortly.",
  "PAYMENT PENDING": "Your items are held, but the order isn't paid yet. We'll send a payment link to your phone.",
  REFUNDED: "This order's payment has been refunded.",
};

export function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const pay = searchParams.get("pay");
  const hydrated = useHydrated();

  /* Delivery estimate depends on "now", so it is client-only. */
  const eta = hydrated ? getEta() : "";

  /* Checkout saved the phone with the order, so the ERP's own view of it can be
     shown. The phone stays out of the URL, where history and analytics would keep it. */
  const saved = hydrated ? readStored<{ id?: string; phone?: string } | null>(LAST_ORDER_KEY, null) : null;
  const phone = orderId && saved?.id === orderId ? saved.phone : undefined;
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  useEffect(() => {
    if (!orderId || !phone) return;
    let cancelled = false;
    fetch(`/api/track?id=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`)
      .then((res) => (res.ok ? (res.json() as Promise<TrackedOrder>) : null))
      .then((body) => { if (!cancelled && body?.orderNumber) setOrder(body); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [orderId, phone]);

  const payment = order ? paymentState(order) : stateFromQuery(pay);
  const confirming = payment === "PAYMENT PENDING" && pay === "confirming";

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap">
        <div className="success">
          <div data-rev="true">
            <p className="d-md" style={{ color: "var(--ru)" }}>✓</p>
            {/* The ERP creates the order at NEW; the team confirms it, so don't claim more. */}
            <h1 className="h1" style={{ margin: "16px 0" }}>ORDER PLACED</h1>
            <p
              className="d-md"
              style={{ letterSpacing: 0, textTransform: "none", fontWeight: 600, color: "#555", maxWidth: "520px", margin: "0 auto 8px" }}
            >
              THANK YOU FOR BEING<br />
              <b style={{ textTransform: "uppercase" }}>UNEMPLOYED FOR A REASON.</b>
            </p>
            {orderId && <p className="cap" style={{ marginTop: "26px" }}>ORDER #{orderId}</p>}
            <p className="small mut" style={{ marginTop: "6px" }}>EXPECTED DELIVERY — {eta}</p>
            <p className="small mut" style={{ marginTop: "6px", maxWidth: "460px", marginInline: "auto" }}>
              {confirming
                ? "We're confirming your payment with the bank — this can take a minute. You won't be charged twice."
                : COPY[payment]}
            </p>

            {order && (
              <div style={{ maxWidth: "460px", margin: "28px auto 0", textAlign: "left", border: "1px solid var(--gy)", padding: "18px 20px" }}>
                {order.items.map((item, i) => (
                  <div className="sumrow" key={`${item.slug}-${item.size}-${item.colour}-${i}`}>
                    <span className="small">
                      {item.name}<br />
                      <span className="mut">{item.size} / {item.colour} × {item.quantity}</span>
                    </span>
                    <span className="num small">{inr(item.unitPrice)}</span>
                  </div>
                ))}
                <hr className="hr" style={{ margin: "10px 0" }} />
                <div className="sumrow">
                  <span>Subtotal</span>
                  <span className="num">{inr(order.totals.subtotal)}</span>
                </div>
                <div className="sumrow">
                  <span>Shipping</span>
                  <span className="num">{Number(order.totals.shipping) ? inr(order.totals.shipping) : "FREE"}</span>
                </div>
                <div className="sumrow">
                  <span>GST</span>
                  <span className="num">{inr(order.totals.gst)}</span>
                </div>
                <div className="sumrow tot">
                  <span>Total</span>
                  <span className="num">{inr(order.totals.grandTotal)}</span>
                </div>
                <div className="sumrow">
                  <span className="cap">PAYMENT</span>
                  <span className="small">{payment}</span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "34px", flexWrap: "wrap" }}>
              <Link href={orderId ? `/track-order?id=${orderId}` : "/track-order"} className="btn">TRACK ORDER</Link>
              <Link href="/shop" className="btn btn-o">CONTINUE SHOPPING</Link>
            </div>
            <Link
              href={orderId ? `/help/contact?order=${encodeURIComponent(orderId)}` : "/help/contact"}
              className="tlink small"
              style={{ marginTop: "22px", display: "inline-block" }}
            >
              NEED HELP WITH THIS ORDER? →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
