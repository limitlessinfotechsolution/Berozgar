"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { useSession } from "@/components/session-provider";
import { accountApi } from "@/lib/account-client";

type State = "checking" | "verified" | "invalid" | "failed";

/* The page the emailed verification link opens. The token is single-use. */
function VerifyEmail() {
  const token = useSearchParams().get("token") ?? "";
  const { isAuthenticated, refresh } = useSession();
  const [state, setState] = useState<State>(token ? "checking" : "invalid");
  const [message, setMessage] = useState<string | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    // Once only: React may run effects twice in development, and the token is single-use.
    if (!token || sent.current) return;
    sent.current = true;
    void accountApi("/api/auth/email/verify", { method: "POST", body: { token } }).then((result) => {
      if (result.ok) {
        setState("verified");
        void refresh();
      } else if (result.code === "invalid_token") {
        setState("invalid");
      } else {
        setState("failed");
        setMessage(result.error);
      }
    });
  }, [token, refresh]);

  if (state === "checking") return <p className="small mut">Checking your link…</p>;

  if (state === "verified") {
    return (
      <div className="empty" style={{ padding: "20px 0" }}>
        <h2 className="h3">EMAIL VERIFIED.</h2>
        <p className="small mut">Thanks — order updates and password resets will reach you there.</p>
        <Link href={isAuthenticated ? "/account" : "/login"} className="btn" style={{ marginTop: "20px" }}>
          {isAuthenticated ? "MY ACCOUNT" : "LOG IN"}
        </Link>
      </div>
    );
  }

  return (
    <div className="empty" style={{ padding: "20px 0" }}>
      <h2 className="h3">{state === "invalid" ? "LINK EXPIRED." : "NOT VERIFIED YET."}</h2>
      <p className="small mut">
        {state === "invalid"
          ? "This link has expired or was already used. Send a fresh one from your profile."
          : message}
      </p>
      <Link href={isAuthenticated ? "/account/profile" : "/login?next=/account/profile"} className="btn" style={{ marginTop: "20px" }}>
        GO TO PROFILE
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard eyebrow="ACCOUNT" title="VERIFY EMAIL.">
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </AuthCard>
  );
}
