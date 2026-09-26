"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useSession } from "@/components/session-provider";
import { RevealObserver } from "@/components/reveal-observer";
import { showToast } from "@/lib/ui-events";
import { readStored, useHydrated, writeStored } from "@/lib/use-hydrated";
import { LAST_ORDER_KEY, rememberOrder } from "@/lib/tracking";
import { payWithRazorpay, type RazorpayOrder } from "@/lib/razorpay";
import { deliveryRange, PINCODE_KEY, type PincodeInfo } from "@/lib/delivery";
import { useShippingRule } from "@/components/store-settings-provider";
import { formatDecimalINR as inrDecimal, formatINR as inr, toMinor } from "@/lib/money";
import { standardShippingMinor } from "@/lib/shipping";

/* ERP money is a decimal string; it is compared and subtracted as paise, never floats. */
const minor = (s: string | null | undefined) => toMinor(s) ?? 0;

const STEPS = ["01 INFORMATION", "02 DELIVERY", "03 PAYMENT", "04 REVIEW"];

/* sessionStorage: this tab's checkout attempt (see checkoutSessionId). */
const CHECKOUT_SESSION_KEY = "berozgar-checkout-session";

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
  landmark: string;
};

/* An order the ERP has created and that is waiting for its online payment. */
type PendingPayment = { orderId: string; grandTotal: string; razorpay: RazorpayOrder };

type Quote = {
  totals: {
    productCost: string;
    shipping: string;
    subtotal: string;
    gst: string;
    grandTotal: string;
    /* All discounts (prepaid + coupon) and the COD fee for the chosen method. */
    discount: string;
    couponDiscount?: string;
    codFee: string;
  } | null;
  coupon?: { code: string; description: string; discount: string } | null;
  couponError?: { reason: string; message: string } | null;
  lines: { variantId: string; reason: string; available?: number }[];
  gstRate: string;
  cod: { available: boolean; reason: string | null; fee: string };
  prepaidDiscountPct: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const shippingRule = useShippingRule();
  const { user } = useSession();

  const [step, setStep] = useState(1);
  /* null means "not edited yet", so the field tracks the session until typed in. */
  const [emailEdit, setEmailEdit] = useState<string | null>(null);
  const email = emailEdit ?? user?.email ?? "";
  const [deliveryEdits, setDeliveryEdits] = useState<Partial<Delivery>>({});
  const hydrated = useHydrated();
  /* A pincode already checked on a product page. */
  const savedPincode = hydrated ? readStored<string>(PINCODE_KEY, "") : "";
  /* City, state, delivery window and COD rule for the entered pincode, from the ERP. */
  const [pinInfo, setPinInfo] = useState<PincodeInfo | null>(null);
  const [express, setExpress] = useState(false);
  const [payment, setPayment] = useState("upi");
  const [placing, setPlacing] = useState(false);
  // Which policy versions this page showed, and whether the customer accepted
  // them. Sent with the order so acceptance can be proved later.
  const [policies, setPolicies] = useState<{ slug: string; version: string }[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [paying, setPaying] = useState(false);
  const [payFailure, setPayFailure] = useState<string | null>(null);
  /* The last quote received, tagged with the bag + shipping it priced. */
  const [quoteResult, setQuoteResult] = useState<{ key: string; value: Quote | "error" } | null>(null);
  /* A code the shopper applied; the ERP quote says whether it's valid and what it's worth. */
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);
  /* One id per checkout attempt, kept across reloads in this tab: the ERP's draft
     (abandoned cart) is keyed by it and marked recovered when the order is placed. */
  const [checkoutSessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = window.sessionStorage.getItem(CHECKOUT_SESSION_KEY);
      if (saved) return saved;
      const fresh = crypto.randomUUID().replace(/-/g, "");
      window.sessionStorage.setItem(CHECKOUT_SESSION_KEY, fresh);
      return fresh;
    } catch {
      return crypto.randomUUID().replace(/-/g, "");
    }
  });

  const nameParts = (user?.name ?? "").split(" ");
  const delivery: Delivery = {
    first: nameParts[0] ?? "",
    last: nameParts.slice(1).join(" "),
    phone: user?.phone ?? "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: savedPincode,
    landmark: "",
    ...deliveryEdits,
  };
  const field = (key: keyof Delivery) => ({
    value: delivery[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDeliveryEdits((d) => ({ ...d, [key]: e.target.value })),
  });

  const lineItems = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  const validPin = /^[1-9][0-9]{5}$/.test(delivery.pincode) ? delivery.pincode : undefined;
  const quoteKey = JSON.stringify({
    items: lineItems,
    express,
    payment,
    pincode: validPin,
    ...(couponCode ? { couponCode } : {}),
  });

  /* The checkout in progress, saved to the ERP (debounced) once there is a way to reach
     the shopper — staff see it under Abandoned carts until the order is placed. */
  const draftKey = JSON.stringify({
    sessionId: checkoutSessionId,
    items: lineItems,
    name: `${delivery.first} ${delivery.last}`.trim() || null,
    phone: delivery.phone || null,
    email: email || null,
    marketingConsent,
  });
  useEffect(() => {
    const draft = JSON.parse(draftKey) as { sessionId: string; items: unknown[]; phone: string | null; email: string | null };
    if (step < 2 || !draft.sessionId || draft.items.length === 0 || (!draft.email && !draft.phone)) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/checkout/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: draftKey }).catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [step, draftKey]);

  /* The ERP's price for the bag — from the payment step on, because COD rules,
     the COD fee and the prepaid discount all depend on it. */
  useEffect(() => {
    if (step < 3 || JSON.parse(quoteKey).items.length === 0) return;
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

  useEffect(() => {
    if (!validPin) return;
    let live = true;
    fetch(`/api/pincode/${validPin}`)
      .then((res) => (res.ok ? (res.json() as Promise<PincodeInfo>) : null))
      .then((info) => {
        if (!live || !info) return;
        setPinInfo(info);
        setDeliveryEdits((d) => ({
          ...d,
          ...(d.city === undefined && info.city ? { city: info.city } : {}),
          ...(d.state === undefined && info.state ? { state: info.state } : {}),
        }));
      })
      .catch(() => undefined);
    return () => { live = false; };
  }, [validPin]);

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
    step < 3 ? null : quoteResult?.key === quoteKey ? quoteResult.value : "loading";
  const codRule = typeof quote === "object" && quote !== null ? quote.cod : null;
  const codBlocked = codRule !== null && !codRule.available;
  const prepaidPct = typeof quote === "object" && quote !== null ? quote.prepaidDiscountPct : 0;
  const pinWindow = pinInfo && pinInfo.pincode === validPin ? pinInfo.deliveryDays : null;

  /*
   * The order exists and its stock is held; only the money is outstanding. The
   * bag is already cleared (so a second PLACE ORDER can't duplicate it), which is
   * why this renders ahead of the empty-bag state.
   */
  async function startPayment(p: PendingPayment) {
    if (paying) return;
    setPaying(true);
    setPayFailure(null);
    const success = `/checkout/success?id=${encodeURIComponent(p.orderId)}`;
    try {
      const outcome = await payWithRazorpay(
        p.razorpay,
        { name: `${delivery.first} ${delivery.last}`.trim(), email, contact: delivery.phone },
        p.orderId
      );
      if (outcome.kind === "paid") {
        const verified = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpayOrderId: outcome.result.razorpay_order_id,
            razorpayPaymentId: outcome.result.razorpay_payment_id,
            razorpaySignature: outcome.result.razorpay_signature,
          }),
        }).then((r) => r.ok, () => false);
        // Razorpay has the money either way; if our check didn't answer, its
        // webhook settles the order, so the page says "confirming", not "failed".
        showToast(verified ? "PAYMENT RECEIVED" : "PAYMENT CONFIRMING");
        router.push(`${success}&pay=${verified ? "paid" : "confirming"}`);
        return;
      }
      setPayFailure(outcome.kind === "failed" ? outcome.reason : "Payment window closed before paying.");
    } catch (error) {
      setPayFailure(error instanceof Error ? error.message : "The payment window couldn't open.");
    }
    setPaying(false);
  }

  if (pending) {
    return (
      <div className="page-fade">
        <div className="wrap">
          <div className="success">
            <p className="cap mut">ORDER #{pending.orderId} — RESERVED FOR YOU</p>
            <h1 className="h1" style={{ margin: "16px 0" }}>COMPLETE PAYMENT</h1>
            <p className="small mut" style={{ maxWidth: "460px", margin: "0 auto" }}>
              Your items are held. Pay {inrDecimal(pending.grandTotal)} to confirm the order.
            </p>
            {payFailure && (
              <div className="co-fail inline" role="alert" style={{ maxWidth: "460px", margin: "22px auto 0", textAlign: "left" }}>
                <b className="cap">PAYMENT NOT COMPLETED</b>
                <p className="small" style={{ marginTop: "6px" }}>
                  Nothing was charged. Try again, or use a different method in the payment window.
                </p>
                <p className="small mut" style={{ marginTop: "6px" }}>{payFailure}</p>
              </div>
            )}
            <div style={{ display: "grid", gap: "10px", maxWidth: "360px", margin: "28px auto 0" }}>
              <button className="btn btn-full" onClick={() => startPayment(pending)} disabled={paying}>
                {paying ? "OPENING PAYMENT…" : `${payFailure ? "RETRY PAYMENT" : "PAY NOW"} — ${inrDecimal(pending.grandTotal)}`}
              </button>
              <Link
                href={`/checkout/success?id=${encodeURIComponent(pending.orderId)}&pay=online`}
                className="btn btn-o btn-full"
              >
                PAY LATER
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  /* Pre-GST estimate for the sidebar until the ERP quote arrives — paise, and the
     ERP's own shipping rule (Settings → Shipping), so it can't disagree with the quote. */
  const subtotal = items.reduce((sum, i) => sum + i.product.priceMinor * i.quantity, 0);
  const standardShipping = standardShippingMinor(subtotal, shippingRule);
  const shipping = standardShipping + (express ? shippingRule.expressMinor : 0);
  const priced = typeof quote === "object" && quote?.totals ? quote : null;
  const blocked = typeof quote === "object" && quote !== null && quote.lines.length > 0;
  const appliedCoupon = priced?.coupon ?? null;
  const couponProblem = couponCode && priced && !priced.coupon ? (priced.couponError?.message ?? "That code isn't valid.") : null;
  const couponOff = minor(priced?.totals?.couponDiscount);
  const prepaidOff = Math.max(0, minor(priced?.totals?.discount) - couponOff);

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
            landmark: delivery.landmark || null,
            city: delivery.city,
            state: delivery.state,
            pincode: delivery.pincode,
          },
          items: lineItems,
          payment,
          express,
          acceptedPolicies: policies.filter((policy) => policy.slug === "terms" || policy.slug === "privacy"),
          // Only a code the quote accepted; the ERP checks it again when placing the order.
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
          ...(checkoutSessionId ? { checkoutSessionId } : {}),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data?.orderId) {
        throw new Error(data?.error || `Order service returned ${response.status}`);
      }

      writeStored(LAST_ORDER_KEY, { id: data.orderId, phone: delivery.phone });
      rememberOrder(data.orderId, delivery.phone);
      clear();
      try {
        window.sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
      } catch {
        /* storage blocked */
      }

      if (data.razorpay) {
        const next: PendingPayment = { orderId: data.orderId, grandTotal: data.grandTotal, razorpay: data.razorpay };
        setPending(next);
        setPlacing(false);
        void startPayment(next);
        return;
      }

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
                <p className="small mut" style={{ margin: "0 0 14px" }}>Order updates will be sent here.</p>
                <label className="ck" style={{ marginBottom: "22px" }}>
                  <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} />{" "}
                  EMAIL ME DROPS &amp; OFFERS (AND A REMINDER IF I LEAVE ITEMS IN MY BAG)
                </label>
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
                  <label className="fl" htmlFor="co-line2">FLAT, FLOOR, BUILDING (OPTIONAL)</label>
                  <input className="inp" id="co-line2" autoComplete="address-line2" {...field("line2")} />
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="co-landmark">LANDMARK (OPTIONAL)</label>
                  <input className="inp" id="co-landmark" placeholder="Near…" {...field("landmark")} />
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="co-pin">PINCODE</label>
                  <input
                    className="inp"
                    id="co-pin"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[1-9][0-9]{5}"
                    autoComplete="postal-code"
                    {...field("pincode")}
                  />
                  {pinWindow && (
                    <small className="small mut" style={{ display: "block", marginTop: "6px" }}>
                      STANDARD DELIVERY BY {deliveryRange(pinWindow)}
                    </small>
                  )}
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

                <h3 className="cap" style={{ margin: "26px 0 12px" }}>SHIPPING METHOD</h3>
                <div className={`del-opt ${!express ? "on" : ""}`.trim()} role="button" tabIndex={0} onClick={() => setExpress(false)}>
                  <div>
                    <b className="small" style={{ letterSpacing: "0.1em" }}>STANDARD</b>
                    <small className="small mut" style={{ display: "block" }}>
                      {pinWindow ? `BY ${deliveryRange(pinWindow)}` : "3–5 WORKING DAYS"}
                    </small>
                  </div>
                  <b className="price">{standardShipping === 0 ? "FREE" : inr(standardShipping)}</b>
                </div>
                <div className={`del-opt ${express ? "on" : ""}`.trim()} role="button" tabIndex={0} onClick={() => setExpress(true)}>
                  <div>
                    <b className="small" style={{ letterSpacing: "0.1em" }}>EXPRESS</b>
                    <small className="small mut" style={{ display: "block" }}>1–2 WORKING DAYS</small>
                  </div>
                  <b className="price">+{inr(shippingRule.expressMinor)}</b>
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
              {prepaidPct > 0 && (
                <p className="cap" style={{ marginBottom: "12px" }}>PAY ONLINE &amp; SAVE {prepaidPct}% ON YOUR ORDER</p>
              )}
              {PAYMENTS.map(([value, label, hint]) => {
                const off = value === "cod" && codBlocked;
                return (
                  <div
                    key={value}
                    className={`pay-opt ${payment === value ? "on" : ""}`.trim()}
                    role="button"
                    tabIndex={off ? -1 : 0}
                    aria-disabled={off}
                    style={off ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                    onClick={() => { if (!off) setPayment(value); }}
                  >
                    <b>{label}</b>
                    <small>
                      {off
                        ? codRule?.reason
                        : value === "cod" && codRule && minor(codRule.fee) > 0
                          ? `${hint} · ${inrDecimal(codRule.fee)} COD fee`
                          : hint}
                    </small>
                  </div>
                );
              })}
              {payment !== "cod" && (
                <p className="small mut" style={{ marginTop: "14px" }}>
                  You&apos;ll pay securely through Razorpay after reviewing your order. Nothing is charged at
                  this step.
                </p>
              )}
              <div style={{ display: "grid", gap: "10px", marginTop: "22px" }}>
                <button
                  className="btn btn-full"
                  disabled={payment === "cod" && codBlocked}
                  onClick={() => setStep(4)}
                >
                  {payment === "cod" && codBlocked ? "CHOOSE ANOTHER PAYMENT METHOD" : "CONTINUE TO REVIEW →"}
                </button>
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
                    <span className="num small">{inr(item.product.priceMinor * item.quantity)}</span>
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
              <span className="num small">{inr(item.product.priceMinor * item.quantity)}</span>
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
                <span className="num">{minor(priced.totals!.shipping) ? inrDecimal(priced.totals!.shipping) : "FREE"}</span>
              </div>
              {appliedCoupon && couponOff > 0 && (
                <div className="sumrow">
                  <span>Coupon {appliedCoupon.code}</span>
                  <span className="num">−{inrDecimal(appliedCoupon.discount)}</span>
                </div>
              )}
              {prepaidOff > 0 && (
                <div className="sumrow">
                  <span>Prepaid discount</span>
                  <span className="num">−{inr(prepaidOff)}</span>
                </div>
              )}
              {minor(priced.totals!.codFee) > 0 && (
                <div className="sumrow">
                  <span>COD fee</span>
                  <span className="num">{inrDecimal(priced.totals!.codFee)}</span>
                </div>
              )}
              <div className="sumrow">
                <span>GST ({Number(priced.gstRate)}%)</span>
                <span className="num">{inrDecimal(priced.totals!.gst)}</span>
              </div>
              <div className="sumrow tot">
                <span>Total</span>
                <span className="num">{inrDecimal(priced.totals!.grandTotal)}</span>
              </div>
              <form
                className="coupon"
                style={{ marginTop: "14px" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const code = couponInput.trim().toUpperCase();
                  setCouponCode(code || null);
                }}
              >
                <input
                  aria-label="Coupon code"
                  placeholder="COUPON CODE"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  maxLength={30}
                />
                {appliedCoupon ? (
                  <button type="button" onClick={() => { setCouponCode(null); setCouponInput(""); }}>REMOVE</button>
                ) : (
                  <button type="submit">APPLY</button>
                )}
              </form>
              {appliedCoupon && (
                <p className="small" style={{ marginTop: "6px" }}>{appliedCoupon.code} — {appliedCoupon.description}</p>
              )}
              {couponProblem && (
                <p className="small" role="alert" style={{ marginTop: "6px", color: "var(--ru)" }}>{couponProblem}</p>
              )}
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
