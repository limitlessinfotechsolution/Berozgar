"use client";

import Link from "next/link";
import {
  TRACK_STEPS,
  formatStamp,
  paymentState,
  statusDetail,
  stepTimes,
  trackStep,
  type TrackedOrder,
} from "@/lib/tracking";

export const inr = (s: string) => `₹${Number(s).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/*
 * A real ERP order as the shopper sees it: the six-step timeline, the courier
 * block, the lines and the payment. Shared by /track-order and /account/orders/:id.
 */
export function OrderView({ order }: { order: TrackedOrder }) {
  const step = trackStep(order.status, order.shipment?.status);
  const times = stepTimes(order);
  const terminal = order.status === "CANCELLED" || order.status === "RETURNED";

  return (
    <>
      {terminal && (
        <div className="co-fail inline" role="status">
          <b className="cap">{order.status === "CANCELLED" ? "ORDER CANCELLED" : "ORDER RETURNED"}</b>
          <p className="small" style={{ marginTop: "6px" }}>
            {order.status === "CANCELLED"
              ? "This order was cancelled. If you paid for it, the refund goes back to the original method."
              : "This order was returned. Your refund is being processed."}
          </p>
        </div>
      )}

      {!terminal && (
        <div className="tl" data-rev="true">
          {TRACK_STEPS.map((label, i) => (
            <div key={label} className={`tl-i ${i < step ? "done" : ""} ${i === step ? "cur" : ""}`.replace(/\s+/g, " ").trim()}>
              <b>
                {i <= step ? (i < step ? "✓ " : "● ") : "○ "}
                {label}
                {i === step && statusDetail(order.status, order.shipment) ? ` — ${statusDetail(order.status, order.shipment)}` : ""}
              </b>
              <small>{formatStamp(times[i] ?? null)}</small>
            </div>
          ))}
        </div>
      )}

      {order.shipment && !terminal && (
        <div style={{ border: "1px solid var(--gy)", padding: "18px 20px", marginTop: "24px" }}>
          <div className="sumrow">
            <span className="cap">COURIER</span>
            <span className="small">{order.shipment.courier.toUpperCase()}</span>
          </div>
          {order.shipment.trackingId && (
            <div className="sumrow">
              <span className="cap">AWB</span>
              <span className="small num">
                {order.shipment.trackingUrl ? (
                  <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="tlink">
                    {order.shipment.trackingId} ↗
                  </a>
                ) : (
                  order.shipment.trackingId
                )}
              </span>
            </div>
          )}
          {order.shipment.expectedDelivery && order.status !== "DELIVERED" && (
            <div className="sumrow">
              <span className="cap">EXPECTED</span>
              <span className="small">{formatStamp(order.shipment.expectedDelivery).split(",")[0]}</span>
            </div>
          )}
          {order.shipment.events.some((e) => e.location) && (
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: "6px" }}>
              {[...order.shipment.events].reverse().filter((e) => e.location).map((e) => (
                <li key={`${e.occurredAt}-${e.status}`} className="small mut" style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span>{e.status.replace(/_/g, " ")} — {e.location!.toUpperCase()}</span>
                  <span className="num">{formatStamp(e.occurredAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
        <div className="sumrow">
          <span className="cap">PAYMENT</span>
          <span className="small">{paymentState(order)}</span>
        </div>
      </div>
    </>
  );
}
