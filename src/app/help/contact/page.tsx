"use client";

import { useState } from "react";
import { showToast } from "@/lib/ui-events";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  /* No transport is wired yet. Rather than imply the message was delivered,
     this records intent locally and says so. Point it at a real endpoint or
     form service when one exists. */
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
    showToast("MESSAGE SAVED");
  }

  return (
    <>
      <header style={{ marginBottom: "28px" }}>
        <p className="eyebrow mut">SUPPORT</p>
        <h1 className="h1" style={{ marginTop: "10px" }}>CONTACT US</h1>
      </header>

      <div className="grid2" style={{ alignItems: "start" }}>
        <div data-rev="true">
          {sent ? (
            <div className="empty" style={{ padding: "40px 0" }}>
              <h2 className="h3">THANKS — WE&apos;VE GOT IT.</h2>
              <p className="small mut">
                Sending isn&apos;t connected yet, so nothing left your browser. Use the email below
                and we&apos;ll pick it up there.
              </p>
              <button className="btn btn-o" style={{ marginTop: "20px" }} onClick={() => setSent(false)}>
                WRITE ANOTHER
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="frow">
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-name">NAME</label>
                  <input className="inp" id="ct-name" required />
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-email">EMAIL</label>
                  <input className="inp" id="ct-email" type="email" required />
                </div>
              </div>

              <div className="frow">
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-order">ORDER ID (OPTIONAL)</label>
                  <input className="inp" id="ct-order" placeholder="BRZ10294" />
                </div>
                <div className="fgrp">
                  <label className="fl" htmlFor="ct-subject">SUBJECT</label>
                  <select className="inp" id="ct-subject" defaultValue="ORDER">
                    <option>ORDER</option>
                    <option>SHIPPING</option>
                    <option>RETURN / EXCHANGE</option>
                    <option>PRODUCT</option>
                    <option>SOMETHING ELSE</option>
                  </select>
                </div>
              </div>

              <div className="fgrp">
                <label className="fl" htmlFor="ct-msg">MESSAGE</label>
                <textarea className="inp" id="ct-msg" required rows={6} style={{ minHeight: "140px", padding: "14px 16px", resize: "vertical" }} />
              </div>

              <button className="btn btn-full" type="submit">SEND MESSAGE</button>
              <p className="small mut" style={{ marginTop: "12px" }}>
                Not yet connected to a mailbox — see the note above.
              </p>
            </form>
          )}
        </div>

        <div className="addr-card" data-rev="true">
          <h2 className="cap" style={{ marginBottom: "14px" }}>REACH US DIRECTLY</h2>
          <p className="small" style={{ lineHeight: 2 }}>
            {/* TODO: replace with the real support mailbox and number */}
            EMAIL — <code>TODO: support@…</code><br />
            PHONE — <code>TODO: +91 …</code><br />
            HOURS — MON–SAT, 10:00–18:00 IST
          </p>

          <h3 className="cap" style={{ margin: "22px 0 10px" }}>SOCIAL</h3>
          <p className="small mut" style={{ lineHeight: 2 }}>
            INSTAGRAM · YOUTUBE · TIKTOK
          </p>

          <h3 className="cap" style={{ margin: "22px 0 10px" }}>GRIEVANCE OFFICER</h3>
          <p className="small mut">
            {/* Required under India's Consumer Protection (E-Commerce) Rules, 2020 */}
            <code>TODO: name, designation, email and response window</code>
          </p>
        </div>
      </div>
    </>
  );
}
