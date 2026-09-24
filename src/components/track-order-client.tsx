"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import { RevealObserver } from "@/components/reveal-observer";
import { OrderActions } from "@/components/order-actions";
import { OrderView } from "@/components/order-view";
import { readStored, useHydrated } from "@/lib/use-hydrated";
import { LAST_ORDER_KEY, rememberOrder, type TrackedOrder } from "@/lib/tracking";

export type Lookup =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found"; order: TrackedOrder }
  | { state: "missing" }
  | { state: "error" };

export async function fetchOrder(id: string, phone: string): Promise<Lookup> {
  try {
    const res = await fetch(`/api/track?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
    if (res.status === 404) return { state: "missing" };
    if (!res.ok) return { state: "error" };
    const order = (await res.json()) as TrackedOrder;
    // Proven by number + phone: remember it for /account/orders on this device.
    rememberOrder(order.orderNumber, phone);
    return { state: "found", order };
  } catch {
    return { state: "error" };
  }
}

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
  /* The phone the shown order was found with — what the invoice and claim calls prove ownership with. */
  const [foundWith, setFoundWith] = useState("");

  /* Arriving from the success page with the order and its phone known: look it up straight away. */
  const autoPhone = saved?.id === initialId ? saved?.phone : undefined;
  useEffect(() => {
    if (!initialId || !autoPhone) return;
    let cancelled = false;
    void fetchOrder(initialId, autoPhone).then((next) => {
      if (cancelled) return;
      setFoundWith(autoPhone);
      setResult(next);
    });
    return () => { cancelled = true; };
  }, [initialId, autoPhone]);

  /* Idle with an automatic lookup pending reads as loading. */
  const lookup: Lookup = result.state === "idle" && initialId && autoPhone ? { state: "loading" } : result;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult({ state: "loading" });
    const typed = phone.trim();
    setFoundWith(typed);
    setResult(await fetchOrder(orderId.trim().toUpperCase(), typed));
  }

  const order = lookup.state === "found" ? lookup.order : null;

  /* After a claim or withdrawal: reload so the order shows the new state. */
  async function refresh() {
    if (!order) return;
    const next = await fetchOrder(order.orderNumber, foundWith);
    if (next.state === "found") setResult(next);
  }

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

        {order && (
          <>
            <OrderView order={order} />
            <OrderActions order={order} phone={foundWith} onChanged={refresh} />
            <Link
              href={`/help/contact?order=${encodeURIComponent(order.orderNumber)}`}
              className="tlink small"
              style={{ marginTop: "14px", display: "inline-block" }}
            >
              NEED HELP WITH THIS ORDER? →
            </Link>
          </>
        )}

        <Link href="/account/orders" className="tlink" style={{ marginTop: "28px", display: "inline-block" }}>VIEW ALL ORDERS →</Link>
      </div>
    </div>
  );
}
