"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { SUPPORT, supportMailto, supportWhatsapp } from "@/lib/support";

const SUBJECTS = ["ORDER", "PAYMENT", "SHIPPING", "RETURN / EXCHANGE", "PRODUCT", "SOMETHING ELSE"];

export function ContactClient() {
  const searchParams = useSearchParams();
  /* Arriving from an order page, the order number is already known. */
  const fromOrder = (searchParams.get("order") ?? "").toUpperCase();

  const [name, setName] = useState("");
  const [order, setOrder] = useState(fromOrder);
  const [subject, setSubject] = useState("ORDER");
  const [message, setMessage] = useState("");

  const heading = `${subject}${order ? ` — #${order}` : ""}`;
  const body = `${message}\n\n— ${name}${order ? `\nOrder: #${order}` : ""}`;
  const mailto = supportMailto(heading, body);
  const whatsapp = supportWhatsapp(`${heading}\n${message}`);

  /* There is no server-side mailbox: the message is handed to the shopper's own
     mail app, so it can't be silently dropped on the way. */
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mailto) window.location.href = mailto;
  }

  return (
    <>
      <header style={{ marginBottom: "28px" }}>
        <p className="eyebrow mut">SUPPORT</p>
        <h1 className="h1" style={{ marginTop: "10px" }}>CONTACT US</h1>
      </header>

      <div className="grid2" style={{ alignItems: "start" }}>
        <div data-rev="true">
          {mailto || whatsapp ? (
            <form onSubmit={submit}>
              <div className="frow">
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-name">NAME</label>
                  <input className="inp" id="ct-name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-order">ORDER NUMBER (OPTIONAL)</label>
                  <input className="inp" id="ct-order" value={order} onChange={(e) => setOrder(e.target.value.toUpperCase())} />
                </div>
              </div>

              <div className="fgrp">
                <label className="fl" htmlFor="ct-subject">SUBJECT</label>
                <select className="inp" id="ct-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="fgrp">
                <label className="fl" htmlFor="ct-msg">MESSAGE</label>
                <textarea
                  className="inp"
                  id="ct-msg"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ minHeight: "140px", padding: "14px 16px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {mailto && <button className="btn btn-full" type="submit">SEND BY EMAIL</button>}
                {whatsapp && (
                  <a className="btn btn-o btn-full" href={whatsapp} target="_blank" rel="noopener noreferrer">
                    SEND ON WHATSAPP
                  </a>
                )}
              </div>
              <p className="small mut" style={{ marginTop: "12px" }}>
                Opens your own email or WhatsApp with the message filled in. We reply {SUPPORT.responseWindow.toLowerCase()}.
              </p>
            </form>
          ) : (
            <div className="empty" style={{ padding: "40px 0" }}>
              <h2 className="h3">SUPPORT OPENS SOON.</h2>
              <p className="small mut">
                Our support inbox isn&apos;t live yet.
                {fromOrder ? ` Keep your order number — #${fromOrder} — handy.` : ""}
              </p>
            </div>
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
