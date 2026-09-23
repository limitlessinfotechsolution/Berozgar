"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { showToast } from "@/lib/ui-events";

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<"request" | "verify" | "done">("request");
  const [contact, setContact] = useState("");

  function requestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStage("verify");
    showToast("CODE SENT (DEMO)");
  }

  function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStage("done");
    showToast("PASSWORD UPDATED");
  }

  return (
    <AuthCard
      eyebrow="ACCOUNT"
      title="RESET ACCESS."
      footer={
        <p className="small mut">
          Remembered it? <Link href="/login" className="tlink">LOG IN</Link>
        </p>
      }
    >
      {stage === "request" && (
        <form onSubmit={requestCode}>
          <div className="fgrp">
            <label className="fl" htmlFor="fp-contact">EMAIL OR MOBILE</label>
            <input
              className="inp"
              id="fp-contact"
              required
              placeholder="you@example.com"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <p className="small mut" style={{ margin: "0 0 22px" }}>
            We&apos;ll send a one-time code to confirm it&apos;s you.
          </p>
          <button className="btn btn-full" type="submit">SEND CODE</button>
        </form>
      )}

      {stage === "verify" && (
        <form onSubmit={verifyCode}>
          <p className="small mut" style={{ marginBottom: "18px" }}>
            Enter the 6-digit code sent to <b>{contact}</b>.
          </p>
          <div className="fgrp">
            <label className="fl" htmlFor="fp-otp">ONE-TIME CODE</label>
            <input className="inp num" id="fp-otp" required inputMode="numeric" pattern="[0-9]{6}" placeholder="______" />
          </div>
          <div className="fgrp">
            <label className="fl" htmlFor="fp-new">NEW PASSWORD</label>
            <input className="inp" id="fp-new" type="password" required minLength={8} />
          </div>
          <div style={{ display: "grid", gap: "10px", marginTop: "22px" }}>
            <button className="btn btn-full" type="submit">UPDATE PASSWORD</button>
            <button type="button" className="btn btn-o btn-full" onClick={() => setStage("request")}>← BACK</button>
          </div>
        </form>
      )}

      {stage === "done" && (
        <div className="empty" style={{ padding: "20px 0" }}>
          <h2 className="h3">PASSWORD UPDATED.</h2>
          <p className="small mut">You can sign in with your new password.</p>
          <Link href="/login" className="btn" style={{ marginTop: "20px" }}>LOG IN</Link>
        </div>
      )}
    </AuthCard>
  );
}
