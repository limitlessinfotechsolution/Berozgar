"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { useSession } from "@/components/session-provider";
import { showToast } from "@/lib/ui-events";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useSession();
  const [email, setEmail] = useState("");

  const next = searchParams.get("next") || "/account";

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const user = login(email);
    showToast(`WELCOME BACK, ${user.name}`);
    router.push(next);
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
      <form onSubmit={submit}>
        <div className="fgrp">
          <label className="fl" htmlFor="li-email">EMAIL OR MOBILE</label>
          <input
            className="inp"
            id="li-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="fgrp">
          <label className="fl" htmlFor="li-pass">PASSWORD</label>
          <input className="inp" id="li-pass" type="password" required placeholder="••••••••" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 22px" }}>
          <label className="ck" style={{ margin: 0 }}><input type="checkbox" /> KEEP ME SIGNED IN</label>
          <Link href="/forgot-password" className="tlink" style={{ border: 0 }}>FORGOT?</Link>
        </div>

        <button className="btn btn-full" type="submit">LOG IN</button>
      </form>

      {/* Alternative sign-in methods are part of the spec but have no provider
          wired, so they are shown disabled rather than pretending to work. */}
      <p className="cap mut" style={{ margin: "26px 0 12px", textAlign: "center" }}>OR CONTINUE WITH</p>
      <div style={{ display: "grid", gap: "10px" }}>
        <button className="btn btn-o btn-full" disabled>ONE-TIME PASSWORD</button>
        <button className="btn btn-o btn-full" disabled>GOOGLE</button>
        <button className="btn btn-o btn-full" disabled>APPLE</button>
      </div>
      <p className="small mut" style={{ marginTop: "12px", textAlign: "center" }}>
        Not yet connected to an identity provider.
      </p>
    </AuthCard>
  );
}
