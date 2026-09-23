"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
import { RevealObserver } from "@/components/reveal-observer";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function getEta() {
  const date = new Date(Date.now() + 432e6);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const cod = searchParams.get("pay") === "cod";

  /* Delivery estimate depends on "now", so it is client-only. */
  const eta = useHydrated() ? getEta() : "";

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
              {cod
                ? "Pay in cash when it arrives. We'll confirm your order shortly."
                : "We'll confirm your order and send a payment link to your phone. Nothing has been charged yet."}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "34px", flexWrap: "wrap" }}>
              <Link href={orderId ? `/track-order?id=${orderId}` : "/track-order"} className="btn">TRACK ORDER</Link>
              <Link href="/shop" className="btn btn-o">CONTINUE SHOPPING</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
