"use client";

import { useState } from "react";
import { FormError } from "@/components/form-error";
import { useSession, type User } from "@/components/session-provider";
import { accountApi, type Customer } from "@/lib/account-client";
import { showToast } from "@/lib/ui-events";

const section: React.CSSProperties = {
  maxWidth: "560px",
  marginTop: "44px",
  borderTop: "1px solid var(--gy)",
  paddingTop: "28px",
};

/* Name, email and date of birth. A new email has to be confirmed again. */
function DetailsForm({ user }: { user: User }) {
  const { setCustomer } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const result = await accountApi<{ customer: Customer }>("/api/account/profile", {
      method: "PATCH",
      body: {
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim(),
        dateOfBirth: String(form.get("dob") || ""),
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.status === 409 ? "Another account already uses that email." : result.error);
      return;
    }
    setCustomer(result.data.customer);
    showToast(result.data.customer.emailVerified ? "PROFILE SAVED" : "PROFILE SAVED — CHECK YOUR EMAIL TO VERIFY IT");
  }

  async function resend() {
    const result = await accountApi("/api/auth/email/verify/resend", { method: "POST" });
    showToast(result.ok ? "VERIFICATION LINK SENT" : result.error.toUpperCase());
  }

  return (
    <form style={{ maxWidth: "560px", marginTop: "24px" }} onSubmit={save}>
      <FormError message={error} />
      <div className="frow">
        <div className="fgrp">
          <label className="fl" htmlFor="pf-name">NAME</label>
          <input className="inp" id="pf-name" name="name" required maxLength={120} autoComplete="name" defaultValue={user.name} />
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="pf-dob">DOB</label>
          <input className="inp" id="pf-dob" name="dob" type="date" defaultValue={user.dob ?? ""} />
        </div>
      </div>
      <div className="fgrp">
        <label className="fl" htmlFor="pf-email">
          EMAIL {user.email && (user.emailVerified ? "· VERIFIED" : "· NOT VERIFIED")}
        </label>
        <input className="inp" id="pf-email" name="email" type="email" required autoComplete="email" defaultValue={user.email} />
        {user.email && !user.emailVerified && (
          <button type="button" className="tlink small" style={{ border: 0, background: "none", padding: 0, marginTop: "8px", cursor: "pointer" }} onClick={() => void resend()}>
            RESEND VERIFICATION LINK
          </button>
        )}
      </div>
      <button className="btn" style={{ marginTop: "12px" }} type="submit" disabled={busy}>
        {busy ? "SAVING…" : "SAVE CHANGES"}
      </button>
    </form>
  );
}

/* A phone changes only with a code sent to it; proving it also brings in past guest orders. */
function PhoneForm({ user }: { user: User }) {
  const { requestOtp, setCustomer } = useSession();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await requestOtp(phone.trim(), "VERIFY_PHONE");
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSent(true);
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await accountApi<{ customer: Customer; mergedRecords?: number }>("/api/account/phone", {
      method: "POST",
      body: { phone: phone.trim(), code: code.trim(), purpose: "VERIFY_PHONE" },
    });
    setBusy(false);
    if (!result.ok) {
      return setError(result.status === 409 ? "That number is already verified on another account." : result.error);
    }
    setCustomer(result.data.customer);
    setEditing(false);
    setSent(false);
    setCode("");
    showToast(result.data.mergedRecords ? "PHONE VERIFIED — PAST ORDERS ADDED" : "PHONE VERIFIED");
  }

  return (
    <div style={section}>
      <h3 className="cap" style={{ marginBottom: "12px" }}>MOBILE</h3>
      {!editing ? (
        <>
          <p className="small">
            {user.phone ? <b>{user.phone}</b> : "No number yet."}{" "}
            {user.phone && <span className="mut">{user.phoneVerified ? "· VERIFIED" : "· NOT VERIFIED"}</span>}
          </p>
          <button type="button" className="btn btn-o" style={{ marginTop: "14px" }} onClick={() => setEditing(true)}>
            {user.phone && !user.phoneVerified ? "VERIFY NUMBER" : "CHANGE NUMBER"}
          </button>
        </>
      ) : !sent ? (
        <form onSubmit={send}>
          <FormError message={error} />
          <div className="fgrp">
            <label className="fl" htmlFor="pf-phone">MOBILE NUMBER</label>
            <input className="inp" id="pf-phone" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" type="submit" disabled={busy}>{busy ? "SENDING…" : "SEND CODE"}</button>
            <button className="btn btn-o" type="button" onClick={() => { setEditing(false); setError(null); }}>CANCEL</button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify}>
          <FormError message={error} />
          <p className="small" style={{ marginBottom: "14px" }}>Enter the 6-digit code sent for <b>{phone}</b>.</p>
          <div className="fgrp">
            <label className="fl" htmlFor="pf-code">CODE</label>
            <input
              className="inp num"
              id="pf-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" type="submit" disabled={busy}>{busy ? "CHECKING…" : "VERIFY"}</button>
            <button className="btn btn-o" type="button" onClick={() => { setSent(false); setCode(""); setError(null); }}>BACK</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* Marketing only — order and delivery updates are always sent. */
function PreferencesForm({ user }: { user: User }) {
  const { refresh } = useSession();
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const result = await accountApi("/api/account/preferences", {
      method: "PATCH",
      body: {
        marketingEmailOptIn: form.get("email") === "on",
        marketingWhatsappOptIn: form.get("whatsapp") === "on",
      },
    });
    setBusy(false);
    if (!result.ok) return showToast(result.error.toUpperCase());
    await refresh();
    showToast("PREFERENCES SAVED");
  }

  return (
    <form style={section} onSubmit={save}>
      <h3 className="cap" style={{ marginBottom: "12px" }}>PREFERENCES</h3>
      <label className="ck"><input type="checkbox" name="email" defaultChecked={user.marketingEmailOptIn} /> DROPS &amp; OFFERS BY EMAIL</label>
      <label className="ck"><input type="checkbox" name="whatsapp" defaultChecked={user.marketingWhatsappOptIn} /> DROPS &amp; OFFERS ON WHATSAPP</label>
      <p className="small mut" style={{ marginTop: "6px" }}>Order and delivery updates are always sent.</p>
      <button className="btn btn-o" style={{ marginTop: "16px" }} type="submit" disabled={busy}>
        {busy ? "SAVING…" : "SAVE PREFERENCES"}
      </button>
    </form>
  );
}

/* Separate form: a password change must not ride along with profile edits. */
function PasswordForm({ user }: { user: User }) {
  const { refresh } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setError(null);
    const result = await accountApi("/api/account/password", {
      method: "POST",
      body: {
        ...(user.hasPassword ? { currentPassword: String(form.get("current") || "") } : {}),
        newPassword: String(form.get("new") || ""),
      },
    });
    setBusy(false);
    if (!result.ok) {
      return setError(result.code === "wrong_password" ? "Your current password isn't right." : result.error);
    }
    formElement.reset();
    await refresh();
    showToast(user.hasPassword ? "PASSWORD UPDATED — OTHER DEVICES SIGNED OUT" : "PASSWORD SET");
  }

  return (
    <form style={section} onSubmit={save}>
      <h3 className="cap" style={{ marginBottom: "12px" }}>PASSWORD</h3>
      <FormError message={error} />
      {!user.hasPassword && (
        <p className="small mut" style={{ marginBottom: "14px" }}>
          You sign in with a one-time code. Set a password to also sign in with your email.
        </p>
      )}
      {user.hasPassword && (
        <div className="fgrp">
          <label className="fl" htmlFor="pf-current">CURRENT PASSWORD</label>
          <input className="inp" id="pf-current" name="current" type="password" required autoComplete="current-password" />
        </div>
      )}
      <div className="fgrp">
        <label className="fl" htmlFor="pf-new">NEW PASSWORD</label>
        <input
          className="inp"
          id="pf-new"
          name="new"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          placeholder="8+ characters, a letter and a number"
        />
      </div>
      <button className="btn btn-o" style={{ marginTop: "8px" }} type="submit" disabled={busy}>
        {busy ? "SAVING…" : user.hasPassword ? "UPDATE PASSWORD" : "SET PASSWORD"}
      </button>
    </form>
  );
}

export default function ProfilePage() {
  const { user } = useSession();

  return (
    <>
      <h1 className="h2">PROFILE</h1>
      {user && (
        <>
          {/* Keyed so defaultValues follow a save or a fresh session. */}
          <DetailsForm key={`${user.name}|${user.email}|${user.dob}`} user={user} />
          <PhoneForm key={`${user.phone}|${user.phoneVerified}`} user={user} />
          <PreferencesForm key={`${user.marketingEmailOptIn}|${user.marketingWhatsappOptIn}`} user={user} />
          <PasswordForm user={user} />
        </>
      )}
    </>
  );
}
