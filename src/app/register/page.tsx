"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormError } from "@/components/form-error";
import { useSession } from "@/components/session-provider";
import { signupPolicies } from "@/lib/account-client";
import { showToast } from "@/lib/ui-events";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const result = await register({
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      password: String(form.get("password") || ""),
      dateOfBirth: String(form.get("dob") || "") || undefined,
      // The versions on show right now are what the tick agreed to.
      acceptedPolicies: await signupPolicies(),
      marketingOptIn: form.get("marketing") === "on",
    });
    setBusy(false);
    if (!result.ok) {
      setError(
        result.status === 409
          ? "An account with that email already exists. Log in, or reset your password."
          : result.error,
      );
      return;
    }
    showToast(`ACCOUNT CREATED — CHECK YOUR EMAIL TO VERIFY IT`);
    router.push("/account");
  }

  return (
    <AuthCard
      eyebrow="ACCOUNT"
      title="JOIN THE UNEMPLOYED."
      footer={
        <p className="small mut">
          Already have an account? <Link href="/login" className="tlink">LOG IN</Link>
        </p>
      }
    >
      <FormError message={error} />
      <form onSubmit={submit}>
        <div className="fgrp">
          <label className="fl" htmlFor="rg-name">FULL NAME</label>
          <input className="inp" id="rg-name" name="name" autoComplete="name" required maxLength={120} placeholder="Faisal K." />
        </div>

        <div className="fgrp">
          <label className="fl" htmlFor="rg-email">EMAIL</label>
          <input className="inp" id="rg-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </div>

        <div className="frow">
          <div className="fgrp">
            <label className="fl" htmlFor="rg-phone">MOBILE</label>
            <input className="inp" id="rg-phone" name="phone" type="tel" autoComplete="tel" required placeholder="98200 11223" />
          </div>
          <div className="fgrp">
            <label className="fl" htmlFor="rg-dob">DATE OF BIRTH</label>
            <input className="inp" id="rg-dob" name="dob" type="date" />
          </div>
        </div>

        <div className="fgrp">
          <label className="fl" htmlFor="rg-pass">PASSWORD</label>
          <input
            className="inp"
            id="rg-pass"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            placeholder="8+ characters, a letter and a number"
          />
        </div>

        <label className="ck"><input type="checkbox" name="marketing" /> DROP ALERTS &amp; NEWSLETTER</label>
        <label className="ck">
          <input type="checkbox" required /> I AGREE TO THE{" "}
          <Link href="/legal/terms" className="tlink" style={{ border: 0 }}>TERMS</Link> AND{" "}
          <Link href="/legal/privacy" className="tlink" style={{ border: 0 }}>PRIVACY POLICY</Link>
        </label>

        <button className="btn btn-full" type="submit" disabled={busy} style={{ marginTop: "22px" }}>
          {busy ? "CREATING…" : "CREATE ACCOUNT"}
        </button>
      </form>
    </AuthCard>
  );
}
