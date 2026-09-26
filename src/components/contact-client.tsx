"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormError } from "@/components/form-error";
import { useSession } from "@/components/session-provider";
import { accountApi } from "@/lib/account-client";
import { SUPPORT, supportWhatsapp } from "@/lib/support";

/* Label on the form → the ERP ticket's category. */
const SUBJECTS: Array<[label: string, category: string]> = [
  ["ORDER", "order"],
  ["PAYMENT", "payment"],
  ["SHIPPING", "order"],
  ["RETURN / EXCHANGE", "returns"],
  ["PRODUCT", "product"],
  ["MY ACCOUNT", "account"],
  ["SOMETHING ELSE", "other"],
];

/*
 * The contact form opens a support ticket in the ERP (/api/contact → ERP /contact), so a
 * message is never lost in someone's mail app; the shopper gets a reference number and
 * an acknowledgement email. WhatsApp stays as an alternative when a number is set.
 */
export function ContactClient() {
  const searchParams = useSearchParams();
  const { user } = useSession();
  /* Arriving from an order page, the order number is already known. */
  const fromOrder = (searchParams.get("order") ?? "").toUpperCase();

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [order, setOrder] = useState(fromOrder);
  const [subject, setSubject] = useState("ORDER");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);

  /* Untouched fields follow the signed-in shopper. */
  const nameValue = name ?? user?.name ?? "";
  const emailValue = email ?? user?.email ?? "";
  const phoneValue = phone ?? user?.phone ?? "";

  const heading = `${subject}${order ? ` — #${order}` : ""}`;
  const whatsapp = supportWhatsapp(`${heading}\n${message}`);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await accountApi<{ ticketNumber: string | null }>("/api/contact", {
      method: "POST",
      body: {
        name: nameValue.trim(),
        email: emailValue.trim(),
        phone: phoneValue.trim() || null,
        orderNumber: order.trim() || null,
        category: SUBJECTS.find(([label]) => label === subject)?.[1] ?? "other",
        subject: heading,
        message: message.trim(),
        website,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTicket(result.data.ticketNumber ?? "received");
  }

  return (
    <>
      <header style={{ marginBottom: "28px" }}>
        <p className="eyebrow mut">SUPPORT</p>
        <h1 className="h1" style={{ marginTop: "10px" }}>CONTACT US</h1>
      </header>

      <div className="grid2" style={{ alignItems: "start" }}>
        <div data-rev="true">
          {ticket ? (
            <div className="empty" style={{ padding: "40px 0", textAlign: "left" }}>
              <h2 className="h3">MESSAGE RECEIVED.</h2>
              <p className="small mut" style={{ marginTop: "10px" }}>
                {ticket !== "received" ? (
                  <>Your reference is <b>{ticket}</b>. </>
                ) : null}
                We&apos;ll reply to <b>{emailValue}</b> {SUPPORT.responseWindow.toLowerCase()}.
              </p>
              <button
                type="button"
                className="btn btn-o"
                style={{ marginTop: "20px" }}
                onClick={() => { setTicket(null); setMessage(""); }}
              >
                SEND ANOTHER MESSAGE
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <FormError message={error} />
              <div className="frow">
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-name">NAME</label>
                  <input className="inp" id="ct-name" required maxLength={120} autoComplete="name" value={nameValue} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-email">EMAIL</label>
                  <input className="inp" id="ct-email" type="email" required autoComplete="email" value={emailValue} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="frow">
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-phone">PHONE (OPTIONAL)</label>
                  <input className="inp" id="ct-phone" type="tel" autoComplete="tel" value={phoneValue} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-order">ORDER NUMBER (OPTIONAL)</label>
                  <input className="inp" id="ct-order" value={order} onChange={(e) => setOrder(e.target.value.toUpperCase())} />
                </div>
              </div>

              <div className="fgrp">
                <label className="fl" htmlFor="ct-subject">SUBJECT</label>
                <select className="inp" id="ct-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map(([label]) => <option key={label}>{label}</option>)}
                </select>
              </div>

              <div className="fgrp">
                <label className="fl" htmlFor="ct-msg">MESSAGE</label>
                <textarea
                  className="inp"
                  id="ct-msg"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ minHeight: "140px", padding: "14px 16px", resize: "vertical" }}
                />
              </div>

              {/* Honeypot — hidden from people, filled by bots. */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}>
                <label htmlFor="ct-website">WEBSITE</label>
                <input id="ct-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                <button className="btn btn-full" type="submit" disabled={busy}>{busy ? "SENDING…" : "SEND MESSAGE"}</button>
                {whatsapp && (
                  <a className="btn btn-o btn-full" href={whatsapp} target="_blank" rel="noopener noreferrer">
                    OR MESSAGE US ON WHATSAPP
                  </a>
                )}
              </div>
              <p className="small mut" style={{ marginTop: "12px" }}>
                You&apos;ll get a reference number straight away. We reply by email {SUPPORT.responseWindow.toLowerCase()}.
              </p>
            </form>
          )}
        </div>

        <div className="addr-card" data-rev="true">
          <h2 className="cap" style={{ marginBottom: "14px" }}>REACH US DIRECTLY</h2>
          <p className="small" style={{ lineHeight: 2 }}>
            EMAIL — {SUPPORT.email ? <a href={`mailto:${SUPPORT.email}`} className="tlink">{SUPPORT.email}</a> : "NOT AVAILABLE YET"}<br />
            PHONE — {SUPPORT.phone ? <a href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`} className="tlink">{SUPPORT.phone}</a> : "NOT AVAILABLE YET"}<br />
            HOURS — {SUPPORT.hours}<br />
            REPLIES — {SUPPORT.responseWindow}
          </p>

          <h3 className="cap" style={{ margin: "22px 0 10px" }}>GRIEVANCE OFFICER</h3>
          <p className="small mut" style={{ lineHeight: 1.8 }}>
            {/* Required under India's Consumer Protection (E-Commerce) Rules, 2020 */}
            {SUPPORT.grievance ? (
              <>
                {SUPPORT.grievance.name}, {SUPPORT.grievance.designation}<br />
                <a href={`mailto:${SUPPORT.grievance.email}`} className="tlink">{SUPPORT.grievance.email}</a><br />
                Acknowledged within 48 hours, resolved within one month.
              </>
            ) : (
              "Details will be published here before we start selling."
            )}
          </p>
        </div>
      </div>
    </>
  );
}
