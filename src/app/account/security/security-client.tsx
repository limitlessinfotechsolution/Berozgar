"use client";

import { useCallback, useEffect, useState } from "react";
import { FormError } from "@/components/form-error";
import { PasswordField } from "@/components/password-field";
import { PhoneInput } from "@/components/phone-input";
import { SavedNote, useSavedNote } from "@/components/saved-note";
import { useSession, type User } from "@/components/session-provider";
import { accountApi, type Customer } from "@/lib/account-client";
import { formatDay, timeAgo } from "@/lib/dates";
import { describeDevice } from "@/lib/device";
import { passwordAcceptable } from "@/lib/password-rules";
import { showToast } from "@/lib/ui-events";

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
    <section className="acc-sec first" aria-labelledby="sec-phone-h">
      <h2 className="cap" id="sec-phone-h">Mobile number</h2>
      <p className="small mut">
        You sign in with a code sent to this number. Verifying it also brings in orders you placed as a guest.
      </p>
      {!editing ? (
        <>
          <p className="small">
            {user.phone ? <b>+91 {user.phone}</b> : "No number yet."}
            {user.phone && (
              <span className={user.phoneVerified ? "pill pill-ok" : "pill pill-warn"}>
                {user.phoneVerified ? "Verified" : "Not verified"}
              </span>
            )}
          </p>
          <button type="button" className="btn btn-o" style={{ marginTop: "14px" }} onClick={() => setEditing(true)}>
            {user.phone && !user.phoneVerified ? "VERIFY NUMBER" : user.phone ? "CHANGE NUMBER" : "ADD NUMBER"}
          </button>
        </>
      ) : !sent ? (
        <form onSubmit={send}>
          <FormError message={error} />
          <div className="fgrp">
            <label className="fl" htmlFor="sec-phone">Mobile number</label>
            <PhoneInput id="sec-phone" required value={phone} onChange={setPhone} />
          </div>
          <div className="form-act">
            <button className="btn" type="submit" disabled={busy}>{busy ? "SENDING…" : "SEND CODE"}</button>
            <button className="btn btn-o" type="button" onClick={() => { setEditing(false); setError(null); }}>CANCEL</button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify}>
          <FormError message={error} />
          <p className="small" style={{ marginBottom: "14px" }}>Enter the 6-digit code sent to <b>+91 {phone}</b>.</p>
          <div className="fgrp">
            <label className="fl" htmlFor="sec-code">Code</label>
            <input
              className="inp num"
              id="sec-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="form-act">
            <button className="btn" type="submit" disabled={busy}>{busy ? "CHECKING…" : "VERIFY"}</button>
            <button className="btn btn-o" type="button" onClick={() => { setSent(false); setCode(""); setError(null); }}>BACK</button>
          </div>
        </form>
      )}
    </section>
  );
}

/* Separate form: a password change must not ride along with profile edits. */
function PasswordForm({ user, onSaved }: { user: User; onSaved: () => void }) {
  const { refresh } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [saved, flashSaved] = useSavedNote(5000);
  const [savedText, setSavedText] = useState("");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("new") || "");
    if (!passwordAcceptable(newPassword)) {
      return setError("Your new password needs at least 8 characters, with a letter and a number.");
    }
    setBusy(true);
    setError(null);
    const result = await accountApi("/api/account/password", {
      method: "POST",
      body: {
        ...(user.hasPassword ? { currentPassword: String(form.get("current") || "") } : {}),
        newPassword,
      },
    });
    setBusy(false);
    if (!result.ok) {
      return setError(result.code === "wrong_password" ? "Your current password isn't right." : result.error);
    }
    const hadPassword = user.hasPassword;
    setFormKey((k) => k + 1); // clears both fields and their Show state
    await refresh();
    setSavedText(hadPassword ? "Password updated" : "Password set");
    flashSaved();
    onSaved();
    showToast(hadPassword ? "PASSWORD UPDATED — OTHER DEVICES SIGNED OUT" : "PASSWORD SET");
  }

  return (
    <section className="acc-sec" aria-labelledby="sec-pw-h">
      <h2 className="cap" id="sec-pw-h">Password</h2>
      <p className="small mut">
        {user.hasPassword
          ? "Changing it signs you out on your other devices."
          : "You sign in with a one-time code. Set a password to also sign in with your email."}
      </p>
      <form key={formKey} onSubmit={save}>
        <FormError message={error} />
        {user.hasPassword && (
          <PasswordField id="sec-current" name="current" label="Current password" autoComplete="current-password" />
        )}
        <PasswordField id="sec-new" name="new" label="New password" autoComplete="new-password" rules />
        <div className="form-act">
          <button className="btn btn-o" type="submit" disabled={busy}>
            {busy ? "SAVING…" : user.hasPassword ? "UPDATE PASSWORD" : "SET PASSWORD"}
          </button>
          <SavedNote show={saved} text={savedText} />
        </div>
      </form>
    </section>
  );
}

type DeviceSession = { id: string; userAgent: string | null; createdAt: string; lastSeenAt: string };

/*
 * Every live session on the account (ERP /account/sessions), this one first. Another
 * device can be signed out on its own or all at once; this one signs out with Log out.
 */
function DevicesSection({ version }: { version: number }) {
  const [sessions, setSessions] = useState<DeviceSession[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const load = useCallback(async () => {
    const result = await accountApi<{ data: DeviceSession[]; currentId: string }>("/api/account/sessions");
    if (!result.ok) return setError(result.error);
    setError(null);
    setCurrentId(result.data.currentId);
    // This device first, then most recently used.
    setSessions([...result.data.data].sort((a, b) => Number(b.id === result.data.currentId) - Number(a.id === result.data.currentId)));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads after mount and after a password change
    void load();
  }, [load, version]);

  async function signOut(id: string) {
    setBusyId(id);
    const result = await accountApi(`/api/account/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusyId(null);
    if (!result.ok && result.status !== 404) return setError(result.error);
    setSessions((list) => list?.filter((s) => s.id !== id) ?? null);
    showToast("DEVICE SIGNED OUT");
  }

  async function signOutOthers() {
    setBusyId("all");
    const result = await accountApi<{ revoked: number }>("/api/account/sessions", { method: "DELETE" });
    setBusyId(null);
    setConfirmAll(false);
    if (!result.ok) return setError(result.error);
    setSessions((list) => list?.filter((s) => s.id === currentId) ?? null);
    const count = result.data.revoked ?? others;
    showToast(count === 1 ? "1 DEVICE SIGNED OUT" : `${count} DEVICES SIGNED OUT`);
  }

  const others = sessions?.filter((s) => s.id !== currentId).length ?? 0;

  return (
    <section className="acc-sec" aria-labelledby="sec-dev-h">
      <h2 className="cap" id="sec-dev-h">Where you&apos;re signed in</h2>
      <p className="small mut">If you don&apos;t recognise a device, sign it out and change your password.</p>
      <FormError message={error} />
      {!sessions && !error && (
        <div aria-hidden="true" style={{ display: "grid", gap: "10px" }}>
          <div className="skel-line" />
          <div className="skel-line short" />
        </div>
      )}
      {sessions && (
        <ul className="dev-list">
          {sessions.map((s) => {
            const current = s.id === currentId;
            return (
              <li key={s.id} className="dev-row">
                <div>
                  <p className="small">
                    <b>{describeDevice(s.userAgent)}</b>
                    {current && <span className="pill pill-ok">This device</span>}
                  </p>
                  <p className="small mut">
                    {current ? "Active now" : `Last active ${timeAgo(s.lastSeenAt)}`} · Signed in {formatDay(s.createdAt)}
                  </p>
                </div>
                {!current && (
                  <button type="button" className="tlink" disabled={busyId !== null} onClick={() => void signOut(s.id)}>
                    {busyId === s.id ? "Signing out…" : "Sign out"}
                    <span className="sr-only"> {describeDevice(s.userAgent)}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {others > 0 && (
        <div className="form-act" style={{ marginTop: "18px" }}>
          {!confirmAll ? (
            <button type="button" className="btn btn-o" onClick={() => setConfirmAll(true)}>
              SIGN OUT OF ALL OTHER DEVICES
            </button>
          ) : (
            <>
              <button type="button" className="btn" disabled={busyId !== null} onClick={() => void signOutOthers()}>
                {busyId === "all" ? "SIGNING OUT…" : others === 1 ? "SIGN OUT 1 DEVICE" : `SIGN OUT ${others} DEVICES`}
              </button>
              <button type="button" className="btn btn-o" onClick={() => setConfirmAll(false)}>CANCEL</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export function Security() {
  const { user } = useSession();
  /* Bumped after a password change, which signs out the other devices. */
  const [devicesVersion, setDevicesVersion] = useState(0);

  return (
    <>
      <h1 className="h2">SECURITY</h1>
      {user && (
        <>
          <PhoneForm key={`${user.phone}|${user.phoneVerified}`} user={user} />
          <PasswordForm user={user} onSaved={() => setDevicesVersion((v) => v + 1)} />
          <DevicesSection version={devicesVersion} />
        </>
      )}
    </>
  );
}
