"use client";

import { useState } from "react";
import { joinNewsletter } from "@/lib/audience";
import { showToast } from "@/lib/ui-events";

/* The black-band sign-up (home newsletter, drop waitlists). Clears only once the
   ERP has stored the email; on failure the address stays for another try. */
export function NewsletterForm({ source = "home", cta = "JOIN" }: { source?: string; cta?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await joinNewsletter(email.trim(), source);
    setBusy(false);
    if (result.ok) {
      setDone(true);
      setEmail("");
      showToast("YOU'RE IN");
    } else {
      showToast(result.message);
    }
  }

  if (done) {
    return <p className="cap" style={{ marginTop: "24px" }} role="status">YOU&apos;RE ON THE LIST.</p>;
  }

  return (
    <form className="nl-form" onSubmit={submit}>
      <input
        type="email"
        required
        placeholder="EMAIL ADDRESS"
        aria-label="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={busy}>{busy ? "…" : cta}</button>
    </form>
  );
}
