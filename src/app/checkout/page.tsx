"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useSession } from "@/components/session-provider";
import { RevealObserver } from "@/components/reveal-observer";
import { showToast } from "@/lib/ui-events";
import { writeStored } from "@/lib/use-hydrated";
import { LAST_ORDER_KEY } from "@/lib/tracking";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
/* ERP money is a decimal string; format it without summing floats. */
const inrDecimal = (s: string) => `₹${Number(s).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const STEPS = ["01 INFORMATION", "02 DELIVERY", "03 PAYMENT", "04 REVIEW"];

const PAYMENTS: [string, string, string][] = [
  ["upi", "UPI", "GPay / PhonePe / Paytm"],
  ["card", "CARDS", "Credit & debit cards"],
  ["netbanking", "NET BANKING", "All major Indian banks"],
  ["wallet", "WALLETS", "Paytm, Amazon Pay, Mobikwik"],
  ["cod", "CASH ON DELIVERY", "Pay when it arrives"],
];

type Delivery = {
  first: string;
  last: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

type Quote = {
  totals: { productCost: string; shipping: string; subtotal: string; gst: string; grandTotal: string } | null;
  lines: { variantId: string; reason: string; available?: number }[];
  gstRate: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { user } = useSession();

  const [step, setStep] = useState(1);
  /* null means "not edited yet", so the field tracks the session until typed in. */
  const [emailEdit, setEmailEdit] = useState<string | null>(null);
  const email = emailEdit ?? user?.email ?? "";
  const [deliveryEdits, setDeliveryEdits] = useState<Partial<Delivery>>({});
  const [express, setExpress] = useState(false);
  const [payment, setPayment] = useState("upi");
  const [placing, setPlacing] = useState(false);
  // Which policy versions this page showed, and whether the customer accepted
  // them. Sent with the order so acceptance can be proved later.
  const [policies, setPolicies] = useState<{ slug: string; version: string }[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  /* The last quote received, tagged with the bag + shipping it priced. */
  const [quoteResult, setQuoteResult] = useState<{ key: string; value: Quote | "error" } | null>(null);

  const nameParts = (user?.name ?? "").split(" ");
  const delivery: Delivery = {
    first: nameParts[0] ?? "",
    last: nameParts.slice(1).join(" "),
    phone: user?.phone ?? "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    ...deliveryEdits,
  };
  const field = (key: keyof Delivery) => ({
    value: delivery[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDeliveryEdits((d) => ({ ...d, [key]: e.target.value })),
  });

  const lineItems = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  const quoteKey = JSON.stringify({ items: lineItems, express });

  /* The ERP's price for the bag, fetched for the review step. */
  useEffect(() => {
    if (step !== 4 || JSON.parse(quoteKey).items.length === 0) return;
    let cancelled = false;
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: quoteKey,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as Quote;
      })
      .then((q) => { if (!cancelled) setQuoteResult({ key: quoteKey, value: q }); })
      .catch(() => { if (!cancelled) setQuoteResult({ key: quoteKey, value: "error" }); });
    return () => { cancelled = true; };
  }, [step, quoteKey]);

  /* Policy versions recorded against the order. Must stay above the empty-bag
     return below: the bag hydrates empty, so an effect after it would change
     the hook count between renders. */
  useEffect(() => {
    let live = true;
    fetch("/api/legal")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data?: { slug: string; version: string }[] }) => {
        if (live) setPolicies(body.data ?? []);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  /* A quote for a different bag (or none yet) means one is on its way. */
  const quote: Quote | "loading" | "error" | null =
    step !== 4 ? null : quoteResult?.key === quoteKey ? quoteResult.value : "loading";

  if (items.length === 0) {
    return (
      <div className="page-fade">
        <div className="wrap">
          <div className="empty">
            <p className="d-md" style={{ opacity: 0.15 }}>00</p>
            <h2 className="h1">YOUR BAG IS EMPTY.</h2>
            <p>NOTHING HERE YET.</p>
            <Link href="/shop" className="btn">START SHOPPING</Link>
          </div>
        </div>
      </div>
    );
  }

  /* Pre-GST estimate for the sidebar until the ERP quote arrives. */
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const shipping = (subtotal >= 999 ? 0 : 99) + (express ? 199 : 0);
  const priced = typeof quote === "object" && quote?.totals ? quote : null;
  const blocked = typeof quote === "object" && quote !== null && quote.lines.length > 0;

  /*
   * Goes through /api/checkout, a server-side proxy to the ERP.
   *
   * There is deliberately no fallback order id. If the request fails we must not
   * tell someone their order was placed when it never reached the server; the
   * bag stays intact and they get to retry.
   */
  async function placeOrder() {
    if (placing) return;
    setPlacing(true);
    setFailure(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: `${delivery.first} ${delivery.last}`.trim(),
            phone: delivery.phone,
            email: email || null,
          },
          address: {
            line1: delivery.line1,
            line2: delivery.line2 || null,
            city: delivery.city,
            state: delivery.state,
            pincode: delivery.pincode,
          },
          items: lineItems,
          payment,
          express,
          acceptedPolicies: policies.filter((policy) => policy.slug === "terms" || policy.slug === "privacy"),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data?.orderId) {
        throw new Error(data?.error || `Order service returned ${response.status}`);
      }

      writeStored(LAST_ORDER_KEY, { id: data.orderId, phone: delivery.phone });
      clear();
      showToast(`ORDER PLACED — #${data.orderId}`);
      router.push(`/checkout/success?id=${encodeURIComponent(data.orderId)}&pay=${payment === "cod" ? "cod" : "online"}`);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "The order could not be placed");
      showToast("ORDER FAILED");
      setPlacing(false);
    }
  }

  const problemFor = (variantId: string) =>
    typeof quote === "object" && quote !== null ? quote.lines.find((l) => l.variantId === variantId) : undefined;

  return (
    <div className="page-fade">
      <RevealObserver />

      <div className="co-head">
        <div className="wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 0" }}>
            <Link href="/" className="logo" style={{ fontSize: "15px" }}>BEROZGAR</Link>
            <span className="cap mut">🔒 SECURE CHECKOUT</span>
          </div>
          <div className="co-steps">
            {STEPS.map((label, i) => {
              const n = i + 1;
              return (
                <button
                  key={label}
                  className={`${n === step ? "on" : ""} ${n < step ? "done" : ""}`.replace(/\s+/g, " ").trim()}
                  onClick={() => { if (n < step) setStep(n); }}
                  style={{ cursor: n < step ? "pointer" : "default" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="wrap co-lay">
        <div className="co-panel">
          {step === 1 && (
            <>
              <h2 className="h2">CONTACT</h2>
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                <div className="fgrp">
                  <label className="fl" htmlFor="co-email">EMAIL</label>
                  <input className="inp" id="co-email" type="email" required value={email} onChange={(e) => setEmailEdit(e.target.value)} />
                </div>
                <p className="small mut" style={{ margin: "0 0 22px" }}>Order updates will be sent here.</p>
                <button className="btn btn-full" type="submit">CONTINUE TO DELIVERY →</button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="h2">DELIVERY ADDRESS</h2>
              <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
                <div className="frow">
                  <div className="fgrp">
                    <label className="fl" htmlFor="co-first">FIRST NAME</label>
                    <input className="inp" id="co-first" required autoComplete="given-name" {...field("first")} />
                  </div>
                  <div className="fgrp">
                    <label className="fl" htmlFor="co-last">LAST NAME</label>
                    <input className="inp" id="co-last" autoComplete="family-name" {...field("last")} />
                  </div>
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="co-phone">PHONE</label>
                  <input
                    className="inp"
                    id="co-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="10-digit mobile"
                    pattern="(\+?91|0)?[\s-]?[6-9][0-9\s-]{9,12}"
                    {...field("phone")}
                  />
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="co-line1">ADDRESS</label>
                  <input className="inp" id="co-line1" required autoComplete="address-line1" {...field("line1")} />
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="co-line2">APARTMENT, LANDMARK (OPTIONAL)</label>
                  <input className="inp" id="co-line2" autoComplete="address-line2" {...field("line2")} />
                </div>
                <div className="frow">
                  <div className="fgrp">
                    <label className="fl" htmlFor="co-city">CITY</label>
                    <input className="inp" id="co-city" required autoComplete="address-level2" {...field("city")} />
                  </div>
                  <div className="fgrp">
                    <label className="fl" htmlFor="co-state">STATE</label>
                    <input className="inp" id="co-state" required autoComplete="address-level1" {...field("state")} />
                  </div>
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="co-pin">PIN</label>
                  <input className="inp" id="co-pin" required inputMode="numeric" pattern="[1-8][0-9]{5}" autoComplete="postal-code" {...field("pincode")} />
                </div>

                <h3 className="cap" style={{ margin: "26px 0 12px" }}>SHIPPING METHOD</h3>
                <div className={`del-opt ${!express ? "on" : ""}`.trim()} role="button" tabIndex={0} onClick={() => setExpress(false)}>
                  <div>
                    <b className="small" style={{ letterSpacing: "0.1em" }}>STANDARD</b>
                    <small className="small mut" style={{ display: "block" }}>3–5 WORKING DAYS</small>
                  </div>
                  <b className="price">{subtotal >= 999 ? "FREE" : inr(99)}</b>
                </div>
                <div className={`del-opt ${express ? "on" : ""}`.trim()} role="button" tabIndex={0} onClick={() => setExpress(true)}>
                  <div>
                    <b className="small" style={{ letterSpacing: "0.1em" }}>EXPRESS</b>
                    <small className="small mut" style={{ display: "block" }}>1–2 WORKING DAYS</small>
                  </div>
                  <b className="price">+{inr(199)}</b>
                </div>

                <div style={{ display: "grid", gap: "10px", marginTop: "22px" }}>
                  <button className="btn btn-full" type="submit">CONTINUE TO PAYMENT →</button>
                  <button type="button" className="btn btn-o btn-full" onClick={() => setStep(1)}>← BACK</button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="h2">PAYMENT</h2>
              {PAYMENTS.map(([value, label, hint]) => (
                <div
                  key={value}
                  className={`pay-opt ${payment === value ? "on" : ""}`.trim()}
                  role="button"
                  tabIndex={0}
                  onClick={() => setPayment(value)}
                >
                  <b>{label}</b>
                  <small>{hint}</small>
                </div>
              ))}
              {payment !== "cod" && (
                <p className="small mut" style={{ marginTop: "14px" }}>
                  Online payment isn&apos;t live yet — your order will be placed now and we&apos;ll send a payment
                  link to your phone. Nothing is charged at this step.
                </p>
              )}
              <div style={{ display: "grid", gap: "10px", marginTop: "22px" }}>
                <button className="btn btn-full" onClick={() => setStep(4)}>CONTINUE TO REVIEW →</button>
                <button className="btn btn-o btn-full" onClick={() => setStep(2)}>← BACK</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="h2">REVIEW &amp; PLACE ORDER</h2>
              <div style={{ border: "1px solid var(--gy)", padding: "20px", marginBottom: "18px" }}>
                <div className="sumrow">
                  <span>CONTACT</span>
                  <span className="small">{[email, delivery.phone].filter(Boolean).join(" · ")}</span>
                </div>
                <div className="sumrow">
                  <span>SHIP TO</span>
                  <span className="small" style={{ textAlign: "right" }}>
                    {`${delivery.first} ${delivery.last}`.trim()}<br />
                    {[delivery.line1, delivery.line2, `${delivery.city} ${delivery.pincode}`, delivery.state].filter(Boolean).join(", ")}
                  </span>
                </div>
                <div className="sumrow">
                  <span>METHOD</span>
                  <span className="small">{express ? "EXPRESS" : "STANDARD"} · {payment.toUpperCase()}</span>
                </div>
              </div>
              {items.map((item) => {
                const problem = problemFor(item.variantId);
                return (
                  <div className="sumrow" key={item.variantId}>
                    <span className="small">
                      {item.product.name} — {item.size} / {item.colour} × {item.quantity}
                      {problem && (
                        <b style={{ color: "var(--ru)", display: "block" }}>
                          {problem.reason === "insufficient_stock" ? `ONLY ${problem.available ?? 0} LEFT` : "NO LONGER AVAILABLE"}
                        </b>
                      )}
                    </span>
                    <span className="num small">{inr(item.product.price * item.quantity)}</span>
                  </div>
                );
              })}

              {quote === "error" && (
                <div className="co-fail inline" role="alert">
                  <b className="cap">COULDN&apos;T PRICE YOUR ORDER</b>
                  <p className="small" style={{ marginTop: "6px" }}>The order service didn&apos;t respond. Try again in a moment.</p>
                </div>
              )}
              {blocked && (
                <div className="co-fail inline" role="alert">
                  <b className="cap">UPDATE YOUR BAG</b>
                  <p className="small" style={{ marginTop: "6px" }}>
                    Some items changed since you added them. <Link href="/cart" className="tlink">Edit your bag</Link> to continue.
                  </p>
                </div>
              )}
              {failure && (
                <div className="co-fail inline" role="alert">
                  <b className="cap">ORDER NOT PLACED</b>
                  <p className="small" style={{ marginTop: "6px" }}>
                    Your order was not placed and you have not been charged. Your bag is untouched —
                    try again, or go back and check your details.
                  </p>
                  <p className="small mut" style={{ marginTop: "6px" }}>{failure}</p>
                </div>
              )}

              <label className="small" style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "20px" }}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  aria-describedby="terms-note"
                />
                <span id="terms-note">
                  I agree to the <Link href="/legal/terms" className="tlink">TERMS &amp; CONDITIONS</Link> and{" "}
                  <Link href="/legal/privacy" className="tlink">PRIVACY POLICY</Link>, and I understand that
                  printed items are made to my design and can only be returned if they arrive damaged,
                  defective or wrong — see the{" "}
                  <Link href="/legal/refund" className="tlink">RETURN &amp; REFUND POLICY</Link>.
                </span>
              </label>

              <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
                <button
                  className="btn btn-full"
                  onClick={placeOrder}
                  disabled={placing || !priced || blocked || !acceptedTerms}
                >
                  {placing ? "PLACING ORDER…"
                    : quote === "loading" ? "CALCULATING TOTAL…"
                    : !priced ? "PLACE ORDER"
                    : `${failure ? "RETRY" : "PLACE ORDER"} — ${inrDecimal(priced.totals!.grandTotal)}`}
                </button>
                <button className="btn btn-o btn-full" onClick={() => setStep(failure ? 2 : 3)}>
                  {failure ? "← CHECK DELIVERY DETAILS" : "← BACK"}
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="co-sum">
          <h3 className="cap" style={{ marginBottom: "14px" }}>ORDER SUMMARY</h3>
          {items.map((item) => (
            <div className="sumrow" key={item.variantId}>
              <span className="small">
                {item.product.name}<br />
                <span className="mut">{item.size} / {item.colour} × {item.quantity}</span>
              </span>
              <span className="num small">{inr(item.product.price * item.quantity)}</span>
            </div>
          ))}
          <hr className="hr" style={{ margin: "10px 0" }} />
          {priced ? (
            <>
              <div className="sumrow">
                <span>Subtotal</span>
                <span className="num">{inrDecimal(priced.totals!.productCost)}</span>
              </div>
              <div className="sumrow">
                <span>Shipping</span>
                <span className="num">{Number(priced.totals!.shipping) ? inrDecimal(priced.totals!.shipping) : "FREE"}</span>
              </div>
              <div className="sumrow">
                <span>GST ({Number(priced.gstRate)}%)</span>
                <span className="num">{inrDecimal(priced.totals!.gst)}</span>
              </div>
              <div className="sumrow tot">
                <span>Total</span>
                <span className="num">{inrDecimal(priced.totals!.grandTotal)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="sumrow">
                <span>Subtotal</span>
                <span className="num">{inr(subtotal)}</span>
              </div>
              <div className="sumrow">
                <span>Shipping</span>
                <span className="num">{shipping ? inr(shipping) : "FREE"}</span>
              </div>
              <div className="sumrow">
                <span>GST</span>
                <span className="num mut">AT REVIEW</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
