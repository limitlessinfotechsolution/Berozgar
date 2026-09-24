"use client";

import Link from "next/link";
import { useState } from "react";
import { ReturnRequestModal } from "@/components/return-request-modal";
import { inr } from "@/components/order-view";
import { RESOLUTION_COPY, RETURN_STATUS_LABEL, claimBlockedMessage } from "@/lib/returns";
import { formatStamp, type ReturnResolution, type TrackedOrder } from "@/lib/tracking";
import { showToast } from "@/lib/ui-events";

const day = (iso: string) => formatStamp(iso).split(",")[0] ?? iso;
/* Whole paise from the ERP's 2dp money strings, so a difference is exact. */
const paise = (amount: string | null) => (amount ? Math.round(Number(amount) * 100) : 0);

/*
 * What a shopper can do with a real order: download the GST invoice, raise a
 * return (refund) or exchange (free remake) claim, and follow or withdraw claims
 * already raised. Everything is checked again by the ERP; the state shown here
 * comes from the same order lookup.
 */
export function OrderActions({
  order,
  phone,
  onChanged,
}: {
  order: TrackedOrder;
  phone: string;
  onChanged: () => void;
}) {
  const [claiming, setClaiming] = useState<ReturnResolution | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const blocked = claimBlockedMessage(order.returns, day);
  const delivered = order.status === "DELIVERED";

  async function downloadInvoice() {
    if (!order.invoice) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.orderNumber)}/invoice?phone=${encodeURIComponent(phone)}`);
      if (!res.ok) {
        showToast(res.status === 404 ? "INVOICE NOT FOUND" : "INVOICE UNAVAILABLE — TRY AGAIN");
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      showToast("INVOICE UNAVAILABLE — TRY AGAIN");
    } finally {
      setDownloading(false);
    }
  }

  async function withdraw(returnNumber: string) {
    setWithdrawing(returnNumber);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.orderNumber)}/returns/${encodeURIComponent(returnNumber)}/cancel`,
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) },
      );
      if (res.ok) {
        showToast(`CLAIM WITHDRAWN — ${returnNumber}`);
        onChanged();
      } else {
        showToast(res.status === 409 ? "ALREADY BEING HANDLED — CONTACT US" : "COULDN'T WITHDRAW — TRY AGAIN");
      }
    } finally {
      setWithdrawing(null);
    }
  }

  return (
    <div style={{ marginTop: "28px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button className="btn btn-o" onClick={downloadInvoice} disabled={!order.invoice || downloading} aria-disabled={!order.invoice}>
          {downloading ? "PREPARING…" : "DOWNLOAD INVOICE"}
        </button>
        {delivered && (
          <>
            <button className="btn btn-o" onClick={() => setClaiming("REFUND")} disabled={!order.returns.eligible}>
              REQUEST RETURN
            </button>
            <button className="btn btn-o" onClick={() => setClaiming("REPLACEMENT")} disabled={!order.returns.eligible}>
              REQUEST EXCHANGE
            </button>
          </>
        )}
      </div>

      {!order.invoice && (
        <p className="small mut" style={{ marginTop: "10px" }}>
          {order.status === "CANCELLED" ? "Cancelled orders aren't invoiced." : "Your GST invoice is issued when the order is delivered."}
        </p>
      )}
      {delivered && (
        <p className="small mut" style={{ marginTop: "10px" }}>
          {blocked ??
            (order.returns.deadline
              ? `Damaged, defective or wrong item? Raise a claim by ${day(order.returns.deadline)}.`
              : "Damaged, defective or wrong item? Raise a claim with photos.")}{" "}
          <Link href="/legal/refund" className="tlink">RETURNS POLICY →</Link>
        </p>
      )}

      {order.returns.requests.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h3 className="cap" style={{ marginBottom: "8px" }}>YOUR CLAIMS</h3>
          {order.returns.requests.map((r) => (
            <div key={r.returnNumber} style={{ border: "1px solid var(--gy)", padding: "14px 16px", marginBottom: "10px" }}>
              <div className="sumrow" style={{ alignItems: "center" }}>
                <span className="small num">
                  <b>{r.returnNumber}</b> · {RESOLUTION_COPY[r.resolution].title}
                </span>
                <span className={`stchip ${r.status === "RESOLVED" ? "st-del" : r.status === "REJECTED" ? "st-pro" : "st-ship"}`}>
                  {RETURN_STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="small mut" style={{ marginTop: "6px" }}>
                Raised {day(r.createdAt)}
                {r.status === "APPROVED" && r.pickupRequired ? " · We'll arrange a pickup at our cost." : ""}
                {r.status === "RESOLVED" && r.refundAmount && Number(r.refundAmount) > 0
                  ? ` · ${inr(r.refundAmount)} refunded to your original payment method.`
                  : ""}
                {r.status === "RESOLVED" && r.creditAmount && paise(r.creditAmount) > paise(r.refundAmount)
                  ? ` · ${inr(((paise(r.creditAmount) - paise(r.refundAmount)) / 100).toFixed(2))} taken off what you owe on this order.`
                  : ""}
                {r.replacementOrderNumber ? ` · Replacement order #${r.replacementOrderNumber}.` : ""}
              </p>
              {r.status === "REJECTED" && r.rejectionReason && (
                <p className="small" style={{ marginTop: "6px" }}>{r.rejectionReason}</p>
              )}
              {r.status === "REQUESTED" && (
                <button
                  className="tlink small"
                  style={{ marginTop: "8px" }}
                  onClick={() => withdraw(r.returnNumber)}
                  disabled={withdrawing === r.returnNumber}
                >
                  {withdrawing === r.returnNumber ? "WITHDRAWING…" : "WITHDRAW CLAIM"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {claiming && (
        <ReturnRequestModal
          order={order}
          phone={phone}
          initialResolution={claiming}
          onClose={() => setClaiming(null)}
          onSubmitted={(returnNumber) => {
            setClaiming(null);
            showToast(`CLAIM RECEIVED — ${returnNumber}`);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
