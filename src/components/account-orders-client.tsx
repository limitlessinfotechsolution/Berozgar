"use client";

import Link from "next/link";
import { useHydrated } from "@/lib/use-hydrated";
import { formatStamp, recentOrders } from "@/lib/tracking";

/*
 * Orders placed or looked up on this device. Customer login isn't wired to the
 * ERP yet (docs/INTEGRATION.md §6), so there is no server-side list of "your"
 * orders; each entry carries the phone that proves it, and the order page reads
 * the real order from the ERP with it.
 */
export function AccountOrdersClient() {
  const hydrated = useHydrated();
  const orders = hydrated ? recentOrders() : [];

  return (
    <>
      <h1 className="h2">MY ORDERS</h1>
      {hydrated && orders.length === 0 && (
        <p className="small mut" style={{ marginTop: "16px" }}>
          No orders on this device yet. Orders you place or track here will be listed.
        </p>
      )}
      {orders.map((order) => (
        <Link key={order.id} className="o-row" href={`/account/orders/${encodeURIComponent(order.id)}`}>
          <span className="oid">#{order.id}</span>
          <span className="small mut">LAST VIEWED {formatStamp(order.seenAt).split(",")[0]}</span>
          <b className="small">VIEW →</b>
        </Link>
      ))}
      <p className="small mut" style={{ marginTop: "20px" }}>
        Ordered on another device?{" "}
        <Link href="/track-order" className="tlink">FIND AN ORDER →</Link>
      </p>
    </>
  );
}
