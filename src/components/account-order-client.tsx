"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderActions } from "@/components/order-actions";
import { OrderView } from "@/components/order-view";
import { fetchOrder, type Lookup } from "@/components/track-order-client";
import { useHydrated } from "@/lib/use-hydrated";

/*
 * One real order in the account area (the layout guarantees a signed-in shopper).
 * The session proves the account's own orders — an empty phone means exactly that;
 * for any other order the shopper is asked for the phone used at checkout.
 */
export function AccountOrderClient({ orderNumber }: { orderNumber: string }) {
  const hydrated = useHydrated();
  const [phone, setPhone] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<Lookup>({ state: "idle" });
  const activePhone = phone ?? "";

  /* After a claim or withdrawal: reload in place, keeping the order on screen meanwhile. */
  async function refresh() {
    const next = await fetchOrder(orderNumber, activePhone);
    if (next.state === "found") setResult(next);
  }

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void fetchOrder(orderNumber, activePhone).then((next) => { if (!cancelled) setResult(next); });
    return () => { cancelled = true; };
  }, [hydrated, orderNumber, activePhone]);

  const order = result.state === "found" ? result.order : null;
  const askPhone = hydrated && result.state === "missing";

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
        <p className="small" style={{ marginTop: "12px" }}>
          {activePhone ? "That phone doesn’t match this order." : "This order isn’t on your account. Enter the phone used at checkout to open it."}
        </p>
      )}
      {result.state === "error" && (
        <p className="small" style={{ marginTop: "12px" }}>Orders are unavailable right now. Try again in a moment.</p>
      )}
      {(result.state === "loading" || result.state === "idle") && (
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
