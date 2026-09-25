"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormError } from "@/components/form-error";
import { accountApi } from "@/lib/account-client";

/*
 * Asks the ERP to email a reset link. The answer is the same whether or not the email
 * has an account, so this page can't be used to find out who shops here. Shoppers
 * without an email on file sign in with a one-time code instead.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await accountApi("/api/auth/password/forgot", { method: "POST", body: { email: email.trim() } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
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
      {sent ? (
        <div className="empty" style={{ padding: "20px 0" }}>
          <h2 className="h3">CHECK YOUR INBOX.</h2>
          <p className="small mut">
            If <b>{email}</b> has an account, a reset link is on its way. It works once and expires in 30 minutes.
          </p>
          <Link href="/login" className="btn" style={{ marginTop: "20px" }}>BACK TO LOG IN</Link>
        </div>
      ) : (
        <form onSubmit={submit}>
          <FormError message={error} />
          <div className="fgrp">
            <label className="fl" htmlFor="fp-email">EMAIL</label>
            <input
              className="inp"
              id="fp-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <p className="small mut" style={{ margin: "0 0 22px" }}>
            We&apos;ll email you a link to choose a new password. No email on your account? Use{" "}
            <Link href="/login" className="tlink" style={{ border: 0 }}>ONE-TIME CODE</Link> on the log-in page.
          </p>
          <button className="btn btn-full" type="submit" disabled={busy}>{busy ? "SENDING…" : "SEND RESET LINK"}</button>
        </form>
      )}
    </AuthCard>
  );
}
