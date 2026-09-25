"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { inr } from "@/components/order-view";
import { accountApi } from "@/lib/account-client";
import { formatStamp } from "@/lib/tracking";

type OrderRow = {
  orderNumber: string;
  status: string;
  createdAt: string;
  grandTotal: string;
  units: number;
  names: string[];
  openClaims: number;
};

type Page = { data: OrderRow[]; nextCursor: string | null };

/*
 * The signed-in shopper's orders from the ERP (/api/public/v1/account/orders), newest
 * first — including orders placed as a guest with the account's verified phone.
 */
export function AccountOrdersClient() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void accountApi<Page>("/api/account/orders").then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setOrders(result.data.data);
        setCursor(result.data.nextCursor);
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function more() {
    if (!cursor) return;
    setLoadingMore(true);
    const result = await accountApi<Page>(`/api/account/orders?cursor=${encodeURIComponent(cursor)}`);
    setLoadingMore(false);
    if (!result.ok) return setError(result.error);
    setOrders((current) => [...(current ?? []), ...result.data.data]);
    setCursor(result.data.nextCursor);
  }

  return (
    <>
      <h1 className="h2">MY ORDERS</h1>
      {error && <p className="small" style={{ marginTop: "16px" }}>{error}</p>}
      {!orders && !error && <p className="small mut" style={{ marginTop: "16px" }}>LOADING…</p>}
      {orders?.length === 0 && (
        <p className="small mut" style={{ marginTop: "16px" }}>
          No orders yet. Ordered as a guest? Verify that phone number on your{" "}
          <Link href="/account/profile" className="tlink">PROFILE</Link> and those orders appear here.
        </p>
      )}
      {orders?.map((order) => (
        <Link key={order.orderNumber} className="o-row" href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}>
          <span className="oid">#{order.orderNumber}</span>
          <span className="small mut">
            {formatStamp(order.createdAt).split(",")[0]} · {order.units} {order.units === 1 ? "ITEM" : "ITEMS"} · {order.names.join(", ")}
          </span>
          <span className="small">
            <b>{order.status.replace(/_/g, " ")}</b>
            {order.openClaims > 0 ? " · CLAIM OPEN" : ""} · {inr(order.grandTotal)}
          </span>
          <b className="small">VIEW →</b>
        </Link>
      ))}
      {cursor && (
        <button className="btn btn-o" style={{ marginTop: "20px" }} disabled={loadingMore} onClick={() => void more()}>
          {loadingMore ? "LOADING…" : "LOAD MORE"}
        </button>
      )}
    </>
  );
}
