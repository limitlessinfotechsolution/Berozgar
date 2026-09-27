"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { inr } from "@/components/order-view";
import { useSession, type User } from "@/components/session-provider";
import { accountApi } from "@/lib/account-client";
import { formatDay, formatMonth } from "@/lib/dates";
import { orderStatusLabel } from "@/lib/tracking";
import { showToast } from "@/lib/ui-events";

/*
 * What the account can actually answer: the latest order, where things get
 * delivered, and what's left to set up. Rewards, referrals and a notification
 * feed stay out — the ERP has no model behind them.
 */

type OrderRow = { orderNumber: string; status: string; createdAt: string; grandTotal: string; names: string[]; units: number };
type AddressRow = {
  id: string;
  label: string | null;
  recipientName: string | null;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

/* One card's data: loading, failed (with a retry), or loaded. */
type Load<T> = { state: "loading" } | { state: "error"; message: string } | { state: "ok"; data: T };

function useAccountData<T>(path: string, pick: (body: { data: unknown[] }) => T): [Load<T>, () => void] {
  const [load, setLoad] = useState<Load<T>>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void accountApi<{ data: unknown[] }>(path).then((result) => {
      if (cancelled) return;
      setLoad(result.ok ? { state: "ok", data: pick(result.data) } : { state: "error", message: result.error });
    });
    return () => {
      cancelled = true;
    };
    // `pick` is a module-level function at every call site; `attempt` re-runs the load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, attempt]);
  const retry = useCallback(() => {
    setLoad({ state: "loading" });
    setAttempt((n) => n + 1);
  }, []);
  return [load, retry];
}

const firstOrder = (body: { data: unknown[] }) => (body.data[0] as OrderRow | undefined) ?? null;
const defaultAddress = (body: { data: unknown[] }) => {
  const rows = body.data as AddressRow[];
  return rows.find((a) => a.isDefault) ?? rows[0] ?? null;
};

function CardBody<T>({ load, retry, children }: { load: Load<T>; retry: () => void; children: (data: T) => React.ReactNode }) {
  if (load.state === "loading") {
    return (
      <div aria-hidden="true" style={{ display: "grid", gap: "10px", marginTop: "4px" }}>
        <div className="skel-line" />
        <div className="skel-line short" />
      </div>
    );
  }
  if (load.state === "error") {
    return (
      <>
        <p className="small mut">{load.message}</p>
        <div className="ov-act">
          <button type="button" className="tlink" onClick={retry}>
            Try again
          </button>
        </div>
      </>
    );
  }
  return <>{children(load.data)}</>;
}

/* Only the steps that apply; the block is gone once there are none. */
function SetupNudges({ user }: { user: User }) {
  async function resend() {
    const result = await accountApi("/api/auth/email/verify/resend", { method: "POST" });
    showToast(result.ok ? "VERIFICATION LINK SENT" : result.error.toUpperCase());
  }

  const steps: { key: string; text: string; action: React.ReactNode }[] = [];
  if (!user.email) {
    steps.push({ key: "email", text: "Add an email for receipts and password resets.", action: <Link href="/account/profile" className="tlink">Add email</Link> });
  } else if (!user.emailVerified) {
    steps.push({
      key: "verify-email",
      text: `Confirm ${user.email} with the link we sent.`,
      action: (
        <button type="button" className="tlink" onClick={() => void resend()}>
          Resend link
        </button>
      ),
    });
  }
  if (user.phone && !user.phoneVerified) {
    steps.push({ key: "phone", text: "Verify your mobile to sign in with a code and see guest orders.", action: <Link href="/account/security" className="tlink">Verify</Link> });
  }
  if (!user.hasPassword) {
    steps.push({ key: "password", text: "Set a password to sign in with your email too.", action: <Link href="/account/security" className="tlink">Set password</Link> });
  }
  if (steps.length === 0) return null;

  return (
    <section aria-labelledby="ov-setup-h" style={{ marginTop: "28px" }}>
      <h2 className="cap" id="ov-setup-h">Finish setting up</h2>
      <ul className="nudges" style={{ marginTop: "10px" }}>
        {steps.map((step) => (
          <li key={step.key}>
            <span className="small">{step.text}</span>
            {step.action}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* Shown after signing back in while a deletion request waits for staff. */
function DeletionBanner({ requestedAt }: { requestedAt: string }) {
  const { refresh } = useSession();
  const [busy, setBusy] = useState(false);

  async function keep() {
    setBusy(true);
    const result = await accountApi("/api/account/deletion", { method: "DELETE" });
    setBusy(false);
    if (!result.ok) return showToast(result.error.toUpperCase());
    await refresh();
    showToast("YOUR ACCOUNT STAYS");
  }

  return (
    <div className="co-fail inline" role="status" style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px 20px", flexWrap: "wrap" }}>
      <span className="small">
        <b>You asked us to delete this account on {formatDay(requestedAt)}.</b> We&apos;ll do it within 30 days unless you keep it.
      </span>
      <button type="button" className="btn btn-o" disabled={busy} onClick={() => void keep()}>
        {busy ? "KEEPING…" : "KEEP MY ACCOUNT"}
      </button>
    </div>
  );
}

export function AccountOverview() {
  const { wishlist } = useCart();
  const { user } = useSession();
  const [order, retryOrder] = useAccountData("/api/account/orders", firstOrder);
  const [address, retryAddress] = useAccountData("/api/account/addresses", defaultAddress);
  const firstName = user?.name.trim().split(/\s+/)[0];

  return (
    <>
      <h1 className="h1">WELCOME BACK{firstName ? `, ${firstName}` : ""}</h1>
      {user?.createdAt && <p className="small mut acc-sub">Member since {formatMonth(user.createdAt)}</p>}

      {user?.deletionRequestedAt && <DeletionBanner requestedAt={user.deletionRequestedAt} />}
      {user && !user.deletionRequestedAt && <SetupNudges user={user} />}

      <div className="ov-grid">
        <section className="ov-card" aria-labelledby="ov-order-h">
          <h2 className="cap" id="ov-order-h">Latest order</h2>
          <CardBody load={order} retry={retryOrder}>
            {(o) =>
              o ? (
                <>
                  <p className="small">
                    <b>#{o.orderNumber}</b> · {formatDay(o.createdAt)}
                  </p>
                  <p className="small"><b>{orderStatusLabel(o.status)}</b> · {inr(o.grandTotal)}</p>
                  <p className="small mut">{o.names.join(", ")}{o.units > o.names.length ? " and more" : ""}</p>
                  <div className="ov-act">
                    <Link href={`/account/orders/${encodeURIComponent(o.orderNumber)}`} className="tlink">View order</Link>
                    <Link href="/account/orders" className="tlink">All orders</Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="small mut">No orders yet.</p>
                  <div className="ov-act"><Link href="/shop" className="tlink">Start shopping</Link></div>
                </>
              )
            }
          </CardBody>
        </section>

        <section className="ov-card" aria-labelledby="ov-addr-h">
          <h2 className="cap" id="ov-addr-h">Delivery address</h2>
          <CardBody load={address} retry={retryAddress}>
            {(a) =>
              a ? (
                <>
                  <p className="small"><b>{a.label || a.recipientName || "Address"}</b>{a.isDefault && <span className="pill">Default</span>}</p>
                  <p className="small mut" style={{ lineHeight: 1.7 }}>
                    {a.line1}<br />
                    {a.city}, {a.state} {a.pincode}
                  </p>
                  <div className="ov-act"><Link href="/account/addresses" className="tlink">Manage addresses</Link></div>
                </>
              ) : (
                <>
                  <p className="small mut">Addresses you use at checkout are saved here.</p>
                  <div className="ov-act"><Link href="/account/addresses" className="tlink">Add an address</Link></div>
                </>
              )
            }
          </CardBody>
        </section>

        <section className="ov-card" aria-labelledby="ov-wish-h">
          <h2 className="cap" id="ov-wish-h">Wishlist</h2>
          <p className="small">
            {wishlist.length === 0 ? "Nothing saved yet." : `${wishlist.length} saved ${wishlist.length === 1 ? "piece" : "pieces"}.`}
          </p>
          <div className="ov-act"><Link href={wishlist.length ? "/account/wishlist" : "/shop"} className="tlink">{wishlist.length ? "Open wishlist" : "Browse the shop"}</Link></div>
        </section>

        <section className="ov-card" aria-labelledby="ov-track-h">
          <h2 className="cap" id="ov-track-h">Track a parcel</h2>
          <p className="small mut">Follow any order with its number and phone, including ones placed as a guest.</p>
          <div className="ov-act"><Link href="/track-order" className="tlink">Track order</Link></div>
        </section>
      </div>
    </>
  );
}
