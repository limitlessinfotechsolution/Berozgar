"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormError } from "@/components/form-error";
import { PhoneInput } from "@/components/phone-input";
import { SavedNote, useSavedNote } from "@/components/saved-note";
import { useSession, type User } from "@/components/session-provider";
import { accountApi, type Customer } from "@/lib/account-client";
import { formatDay, todayIso } from "@/lib/dates";
import { toNationalMobile } from "@/lib/phone";
import { showToast } from "@/lib/ui-events";

/*
 * Name, email, WhatsApp and date of birth. A new email has to be confirmed again.
 * The mobile number and password live under Security: they're how you sign in.
 *
 * WhatsApp: the ERP sends WhatsApp messages to `whatsapp`, or to the mobile when
 * that's empty (worker notifications.ts), so "Same as my mobile" stores nothing.
 */
function DetailsForm({ user }: { user: User }) {
  const { setCustomer } = useSession();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [dob, setDob] = useState(user.dob ?? "");
  const initialSame = !user.whatsapp || user.whatsapp === user.phone;
  const [sameAsMobile, setSameAsMobile] = useState(initialSame);
  const [whatsapp, setWhatsapp] = useState(initialSame ? "" : (user.whatsapp ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, flashSaved] = useSavedNote();

  /* Typing your own mobile here is the same as ticking the box. */
  const typedWhatsapp = toNationalMobile(whatsapp);
  const whatsappValue = sameAsMobile || typedWhatsapp === user.phone ? "" : typedWhatsapp;
  const savedWhatsapp = initialSame ? "" : (user.whatsapp ?? "");
  const dirty =
    name.trim() !== user.name ||
    email.trim() !== user.email ||
    dob !== (user.dob ?? "") ||
    whatsappValue !== savedWhatsapp;

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await accountApi<{ customer: Customer }>("/api/account/profile", {
      method: "PATCH",
      body: { name: name.trim(), email: email.trim(), dateOfBirth: dob, whatsapp: whatsappValue },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.status === 409 ? "Another account already uses that email." : result.error);
      return;
    }
    setCustomer(result.data.customer);
    if (!whatsappValue && user.phone) {
      setSameAsMobile(true);
      setWhatsapp("");
    }
    flashSaved();
    if (!result.data.customer.emailVerified && email.trim() !== user.email) {
      showToast("CHECK YOUR EMAIL TO VERIFY THE NEW ADDRESS");
    }
  }

  async function resend() {
    const result = await accountApi("/api/auth/email/verify/resend", { method: "POST" });
    showToast(result.ok ? "VERIFICATION LINK SENT" : result.error.toUpperCase());
  }

  return (
    <section className="acc-sec first" aria-labelledby="pf-details-h">
      <h2 className="cap" id="pf-details-h">Personal details</h2>
      <form onSubmit={save}>
        <FormError message={error} />
        <div className="frow">
          <div className="fgrp">
            <label className="fl" htmlFor="pf-name">Name</label>
            <input
              className="inp"
              id="pf-name"
              required
              maxLength={120}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="fgrp">
            <label className="fl" htmlFor="pf-dob">Date of birth (optional)</label>
            <input
              className="inp"
              id="pf-dob"
              type="date"
              max={todayIso()}
              autoComplete="bday"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
        </div>

        <div className="fgrp">
          <label className="fl" htmlFor="pf-email">
            Email
            {user.email && (
              <span className={user.emailVerified ? "pill pill-ok" : "pill pill-warn"}>
                {user.emailVerified ? "Verified" : "Not verified"}
              </span>
            )}
          </label>
          <input
            className="inp"
            id="pf-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {user.email && !user.emailVerified && email.trim() === user.email && (
            <p className="small mut" style={{ marginTop: "8px" }}>
              We sent a link to confirm this address.{" "}
              <button type="button" className="tlink small" style={{ border: 0, background: "none", padding: 0, cursor: "pointer" }} onClick={() => void resend()}>
                Resend link
              </button>
            </p>
          )}
        </div>

        <fieldset className="fgrp" style={{ border: 0, padding: 0, margin: "0 0 16px" }}>
          <legend className="fl" style={{ padding: 0 }}>WhatsApp number</legend>
          {user.phone && (
            <label className="ck">
              <input type="checkbox" checked={sameAsMobile} onChange={(e) => setSameAsMobile(e.target.checked)} />
              Same as my mobile (+91 {user.phone})
            </label>
          )}
          {(!sameAsMobile || !user.phone) && (
            <div style={{ marginTop: "8px" }}>
              <label className="sr-only" htmlFor="pf-whatsapp">WhatsApp number</label>
              <PhoneInput id="pf-whatsapp" value={whatsapp} onChange={setWhatsapp} />
            </div>
          )}
          <p className="small mut" style={{ marginTop: "6px" }}>
            Order and delivery updates on WhatsApp go here.
          </p>
        </fieldset>

        <div className="form-act">
          <button className="btn" type="submit" disabled={busy || !dirty}>
            {busy ? "SAVING…" : "SAVE CHANGES"}
          </button>
          <SavedNote show={saved} />
        </div>
      </form>
    </section>
  );
}

/* Marketing only — order and delivery updates are always sent. */
function NotificationsForm({ user }: { user: User }) {
  const { refresh } = useSession();
  const [email, setEmail] = useState(user.marketingEmailOptIn);
  const [whatsapp, setWhatsapp] = useState(user.marketingWhatsappOptIn);
  const [changedAt, setChangedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, flashSaved] = useSavedNote();
  const dirty = email !== user.marketingEmailOptIn || whatsapp !== user.marketingWhatsappOptIn;

  useEffect(() => {
    let cancelled = false;
    void accountApi<{ updatedAt: string | null }>("/api/account/preferences").then((result) => {
      if (!cancelled && result.ok) setChangedAt(result.data.updatedAt);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const result = await accountApi<{ updatedAt: string | null }>("/api/account/preferences", {
      method: "PATCH",
      body: { marketingEmailOptIn: email, marketingWhatsappOptIn: whatsapp },
    });
    setBusy(false);
    if (!result.ok) return showToast(result.error.toUpperCase());
    setChangedAt(result.data.updatedAt);
    await refresh();
    flashSaved();
  }

  return (
    <section className="acc-sec" aria-labelledby="pf-notify-h">
      <h2 className="cap" id="pf-notify-h">Notifications</h2>
      <p className="small mut">
        Order and delivery updates are always sent. Choose where you hear about drops and offers.
      </p>
      <form onSubmit={save}>
        <label className="ck">
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Drops &amp; offers by email
        </label>
        <label className="ck">
          <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} /> Drops &amp; offers on WhatsApp
        </label>
        {changedAt && <p className="small mut" style={{ marginTop: "6px" }}>Last changed {formatDay(changedAt)}.</p>}
        <div className="form-act" style={{ marginTop: "16px" }}>
          <button className="btn btn-o" type="submit" disabled={busy || !dirty}>
            {busy ? "SAVING…" : "SAVE PREFERENCES"}
          </button>
          <SavedNote show={saved} />
        </div>
      </form>
    </section>
  );
}

export function Profile() {
  const { user } = useSession();

  return (
    <>
      <h1 className="h2">PROFILE</h1>
      <p className="small mut acc-sub">
        Your mobile number and password are under <Link href="/account/security" className="tlink">Security</Link>.
      </p>
      {user && (
        <>
          {/* Keyed by account only: the forms hold their own state and compare it
              with the session, so a save doesn't remount them (and lose "Saved"). */}
          <DetailsForm key={user.id} user={user} />
          <NotificationsForm key={`n-${user.id}`} user={user} />
        </>
      )}
    </>
  );
}
