"use client";

import { useSession } from "@/components/session-provider";
import { showToast } from "@/lib/ui-events";

export default function ProfilePage() {
  const { user, updateUser } = useSession();

  /* Identity comes from the session; the save writes back through it so the
     change survives a reload instead of only firing a toast. */
  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    updateUser({
      name: String(form.get("name") || "").toUpperCase(),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      dob: String(form.get("dob") || ""),
    });
    showToast("PROFILE SAVED");
  }

  return (
    <>
      <h1 className="h2">PROFILE</h1>
      {/* Remount when the session arrives so defaultValue picks it up. */}
      <form key={user?.email ?? "anon"} style={{ maxWidth: "560px", marginTop: "24px" }} onSubmit={save}>
        <div className="frow">
          <div className="fgrp">
            <label className="fl" htmlFor="pf-name">NAME</label>
            <input className="inp" id="pf-name" name="name" defaultValue={user?.name ?? ""} />
          </div>
          <div className="fgrp">
            <label className="fl" htmlFor="pf-dob">DOB</label>
            <input className="inp" id="pf-dob" name="dob" type="date" defaultValue={user?.dob ?? ""} />
          </div>
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="pf-email">EMAIL</label>
          <input className="inp" id="pf-email" name="email" type="email" defaultValue={user?.email ?? ""} />
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="pf-phone">PHONE</label>
          <input className="inp" id="pf-phone" name="phone" defaultValue={user?.phone ?? ""} />
        </div>

        <h3 className="cap" style={{ margin: "28px 0 12px" }}>PREFERENCES</h3>
        <label className="ck"><input type="checkbox" defaultChecked /> DROP ALERTS</label>
        <label className="ck"><input type="checkbox" defaultChecked /> RESTOCK ALERTS</label>
        <label className="ck"><input type="checkbox" defaultChecked /> NEWSLETTER</label>

        <button className="btn" style={{ marginTop: "28px" }} type="submit">SAVE CHANGES</button>
      </form>

      {/* Separate form: a password change must not ride along with profile edits. */}
      <form
        style={{ maxWidth: "560px", marginTop: "44px", borderTop: "1px solid var(--gy)", paddingTop: "28px" }}
        onSubmit={(e) => { e.preventDefault(); showToast("PASSWORD UPDATED"); e.currentTarget.reset(); }}
      >
        <h3 className="cap" style={{ marginBottom: "12px" }}>PASSWORD</h3>
        <div className="fgrp">
          <label className="fl" htmlFor="pf-current">CURRENT PASSWORD</label>
          <input className="inp" id="pf-current" type="password" required autoComplete="current-password" />
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="pf-new">NEW PASSWORD</label>
          <input className="inp" id="pf-new" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <button className="btn btn-o" style={{ marginTop: "8px" }} type="submit">UPDATE PASSWORD</button>
        <p className="small mut" style={{ marginTop: "10px" }}>
          Not yet connected to an auth service — see the note in session-provider.tsx.
        </p>
      </form>
    </>
  );
}
