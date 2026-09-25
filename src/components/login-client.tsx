"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormError } from "@/components/form-error";
import { useSession } from "@/components/session-provider";
import { showToast } from "@/lib/ui-events";

type Mode = "password" | "otp";

/* Only same-site paths: ?next= must not send a shopper off to another site. */
export function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithPassword, requestOtp, loginWithOtp } = useSession();
  const next = safeNext(searchParams.get("next"));

  const [mode, setMode] = useState<Mode>("password");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Password
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // One-time code
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [codeSent, setCodeSent] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function switchMode(value: Mode) {
    setMode(value);
    setError(null);
  }

  function done(customerName: string, isNew = false) {
    showToast(`${isNew ? "WELCOME" : "WELCOME BACK"}, ${customerName.toUpperCase()}`);
    router.push(next);
  }

  async function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await loginWithPassword(identifier.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.status === 401 ? "That email or password isn't right." : result.error);
      return;
    }
    done(result.data.customer.name);
  }

  async function sendCode(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const result = await requestOtp(phone.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const channel = result.data.channel;
    setCodeSent(channel === "whatsapp" ? "WhatsApp" : channel === "email" ? "your email" : "your phone");
    setCooldown(result.data.resendAfter ?? 30);
  }

  async function submitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await loginWithOtp(phone.trim(), code.trim(), name.trim() || undefined);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    done(result.data.customer.name, Boolean((result.data as { isNew?: boolean }).isNew));
  }

  return (
    <AuthCard
      eyebrow="ACCOUNT"
      title="LOG IN."
      footer={
        <p className="small mut">
          No account yet? <Link href="/register" className="tlink">CREATE ONE</Link>
        </p>
      }
    >
      <div role="tablist" style={{ display: "flex", gap: "8px", marginBottom: "22px" }}>
        <button type="button" role="tab" aria-selected={mode === "password"} className={`chip${mode === "password" ? " on" : ""}`} onClick={() => switchMode("password")}>
          PASSWORD
        </button>
        <button type="button" role="tab" aria-selected={mode === "otp"} className={`chip${mode === "otp" ? " on" : ""}`} onClick={() => switchMode("otp")}>
          ONE-TIME CODE
        </button>
      </div>

      <FormError message={error} />

      {mode === "password" ? (
        <form onSubmit={submitPassword}>
          <div className="fgrp">
            <label className="fl" htmlFor="li-id">EMAIL OR MOBILE</label>
            <input
              className="inp"
              id="li-id"
              autoComplete="username"
              required
              placeholder="you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="fgrp">
            <label className="fl" htmlFor="li-pass">PASSWORD</label>
            <input
              className="inp"
              id="li-pass"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", margin: "4px 0 22px" }}>
            <Link href="/forgot-password" className="tlink" style={{ border: 0 }}>FORGOT PASSWORD?</Link>
          </div>

          <button className="btn btn-full" type="submit" disabled={busy}>{busy ? "SIGNING IN…" : "LOG IN"}</button>
          <p className="small mut" style={{ marginTop: "12px" }}>
            A mobile number works here once you&apos;ve verified it on your account.
          </p>
        </form>
      ) : !codeSent ? (
        <form onSubmit={sendCode}>
          <div className="fgrp">
            <label className="fl" htmlFor="li-phone">MOBILE NUMBER</label>
            <input
              className="inp"
              id="li-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="98200 11223"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button className="btn btn-full" type="submit" disabled={busy}>{busy ? "SENDING…" : "SEND CODE"}</button>
          <p className="small mut" style={{ marginTop: "12px" }}>
            Ordered with us before? Signing in with the same number brings your past orders into your account.
          </p>
        </form>
      ) : (
        <form onSubmit={submitCode}>
          <p className="small" style={{ marginBottom: "16px" }}>
            We sent a 6-digit code to {codeSent} for <b>{phone}</b>.{" "}
            <button
              type="button"
              className="tlink"
              style={{ border: 0, background: "none", padding: 0, cursor: "pointer" }}
              onClick={() => { setCodeSent(null); setCode(""); setError(null); }}
            >
              CHANGE NUMBER
            </button>
          </p>
          <div className="fgrp">
            <label className="fl" htmlFor="li-code">CODE</label>
            <input
              className="inp num"
              id="li-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder="______"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="fgrp">
            <label className="fl" htmlFor="li-name">YOUR NAME (FIRST TIME ONLY)</label>
            <input className="inp" id="li-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className="btn btn-full" type="submit" disabled={busy}>{busy ? "CHECKING…" : "VERIFY & LOG IN"}</button>
          <button
            type="button"
            className="btn btn-o btn-full"
            style={{ marginTop: "10px" }}
            disabled={busy || cooldown > 0}
            onClick={() => void sendCode()}
          >
            {cooldown > 0 ? `RESEND IN ${cooldown}s` : "RESEND CODE"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
