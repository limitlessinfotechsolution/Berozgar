"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormError } from "@/components/form-error";
import { accountApi } from "@/lib/account-client";

/* The page the emailed reset link opens. A reset signs the account out everywhere. */
function ResetPassword() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await accountApi("/api/auth/password/reset", { method: "POST", body: { token, password } });
    setBusy(false);
    if (!result.ok) {
      setError(
        result.code === "invalid_token"
          ? "This link has expired or was already used. Ask for a new one."
          : result.error,
      );
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <div className="empty" style={{ padding: "20px 0" }}>
        <h2 className="h3">LINK INCOMPLETE.</h2>
        <p className="small mut">Open the link from your email again, or ask for a new one.</p>
        <Link href="/forgot-password" className="btn" style={{ marginTop: "20px" }}>NEW RESET LINK</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="empty" style={{ padding: "20px 0" }}>
        <h2 className="h3">PASSWORD UPDATED.</h2>
        <p className="small mut">Every device was signed out. Log in with your new password.</p>
        <Link href="/login" className="btn" style={{ marginTop: "20px" }}>LOG IN</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <FormError message={error} />
      <div className="fgrp">
        <label className="fl" htmlFor="rp-new">NEW PASSWORD</label>
        <input
          className="inp"
          id="rp-new"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          placeholder="8+ characters, a letter and a number"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="fgrp">
        <label className="fl" htmlFor="rp-confirm">CONFIRM PASSWORD</label>
        <input
          className="inp"
          id="rp-confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button className="btn btn-full" type="submit" disabled={busy} style={{ marginTop: "8px" }}>
        {busy ? "SAVING…" : "SET NEW PASSWORD"}
      </button>
      {error && (
        <p className="small mut" style={{ marginTop: "12px" }}>
          <Link href="/forgot-password" className="tlink" style={{ border: 0 }}>SEND A NEW LINK</Link>
        </p>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard eyebrow="ACCOUNT" title="NEW PASSWORD.">
      <Suspense>
        <ResetPassword />
      </Suspense>
    </AuthCard>
  );
}
