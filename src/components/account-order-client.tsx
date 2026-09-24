"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import { OrderActions } from "@/components/order-actions";
import { OrderView } from "@/components/order-view";
import { fetchOrder, type Lookup } from "@/components/track-order-client";
import { useHydrated } from "@/lib/use-hydrated";
import { recentOrders } from "@/lib/tracking";

/*
 * One real order in the account area. The phone that proves it comes from the
 * orders remembered on this device, then the signed-in profile; failing both,
 * the shopper is asked for it once.
 */
export function AccountOrderClient({ orderNumber }: { orderNumber: string }) {
  const hydrated = useHydrated();
  const { user } = useSession();
  const remembered = hydrated ? recentOrders().find((o) => o.id === orderNumber)?.phone : undefined;
  const knownPhone = remembered ?? user?.phone ?? "";

  const [phone, setPhone] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<Lookup>({ state: "idle" });
  const activePhone = phone ?? knownPhone;

  /* After a claim or withdrawal: reload in place, keeping the order on screen meanwhile. */
  async function refresh() {
    const next = await fetchOrder(orderNumber, activePhone);
    if (next.state === "found") setResult(next);
  }

  useEffect(() => {
    if (!hydrated || !activePhone) return;
    let cancelled = false;
    void fetchOrder(orderNumber, activePhone).then((next) => { if (!cancelled) setResult(next); });
    return () => { cancelled = true; };
  }, [hydrated, orderNumber, activePhone]);

  const order = result.state === "found" ? result.order : null;
  const askPhone = hydrated && (!activePhone || result.state === "missing");

  return (
    <>
      <Link href="/account/orders" className="tlink" style={{ border: 0 }}>← ALL ORDERS</Link>
      <h1 className="h2" style={{ margin: "20px 0 4px" }}>ORDER #{orderNumber}</h1>

      {askPhone && (
        <form
          className="coupon"
          style={{ maxWidth: "420px", marginTop: "16px" }}
          onSubmit={(e) => {
            e.preventDefault();
            setResult({ state: "loading" });
            setPhone(typed.trim());
          }}
        >
          <input
            type="tel"
            placeholder="PHONE USED AT CHECKOUT"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            aria-label="Phone used at checkout"
            required
          />
          <button type="submit">OPEN</button>
        </form>
      )}
      {result.state === "missing" && (
        <p className="small" style={{ marginTop: "12px" }}>That phone doesn&apos;t match this order.</p>
      )}
      {result.state === "error" && (
        <p className="small" style={{ marginTop: "12px" }}>Orders are unavailable right now. Try again in a moment.</p>
      )}
      {(result.state === "loading" || (result.state === "idle" && (!hydrated || !!activePhone))) && (
        <p className="small mut" style={{ marginTop: "16px" }}>LOADING…</p>
      )}

      {order && (
        <>
          <OrderView order={order} />
          <OrderActions order={order} phone={activePhone} onChanged={refresh} />
          <Link
            href={`/help/contact?order=${encodeURIComponent(order.orderNumber)}`}
            className="tlink small"
            style={{ marginTop: "14px", display: "inline-block" }}
          >
            NEED HELP WITH THIS ORDER? →
          </Link>
        </>
      )}
    </>
  );
}
