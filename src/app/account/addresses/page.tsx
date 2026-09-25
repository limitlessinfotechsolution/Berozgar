"use client";

import { useCallback, useEffect, useState } from "react";
import { FormError } from "@/components/form-error";
import { useSession } from "@/components/session-provider";
import { accountApi, localPhone } from "@/lib/account-client";
import { showToast } from "@/lib/ui-events";

/* An address as the ERP's address book returns it (/api/public/v1/account/addresses). */
type SavedAddress = {
  id: string;
  label: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

function AddressForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: SavedAddress | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { user } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (k: string) => String(form.get(k) || "").trim();
    setBusy(true);
    setError(null);
    const body = {
      label: text("label") || null,
      recipientName: text("recipientName") || null,
      recipientPhone: text("recipientPhone") || null,
      line1: text("line1"),
      line2: text("line2") || null,
      city: text("city"),
      state: text("state"),
      pincode: text("pincode"),
      isDefault: form.get("isDefault") === "on",
    };
    const result = initial
      ? await accountApi(`/api/account/addresses/${initial.id}`, { method: "PATCH", body })
      : await accountApi("/api/account/addresses", { method: "POST", body });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    showToast("ADDRESS SAVED");
    onDone();
  }

  return (
    <form className="addr-card" style={{ display: "block" }} onSubmit={submit}>
      <h3 className="cap" style={{ marginBottom: "16px" }}>{initial ? "EDIT ADDRESS" : "NEW ADDRESS"}</h3>
      <FormError message={error} />
      <div className="frow">
        <div className="fgrp">
          <label className="fl" htmlFor="ad-label">LABEL</label>
          <input className="inp" id="ad-label" name="label" maxLength={40} placeholder="HOME, OFFICE…" defaultValue={initial?.label ?? ""} />
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="ad-name">RECIPIENT</label>
          <input className="inp" id="ad-name" name="recipientName" maxLength={120} autoComplete="name" defaultValue={initial?.recipientName ?? user?.name ?? ""} />
        </div>
      </div>
      <div className="fgrp">
        <label className="fl" htmlFor="ad-line1">ADDRESS</label>
        <input className="inp" id="ad-line1" name="line1" required maxLength={200} autoComplete="address-line1" placeholder="Flat, building, street" defaultValue={initial?.line1 ?? ""} />
      </div>
      <div className="fgrp">
        <label className="fl" htmlFor="ad-line2">AREA / LANDMARK</label>
        <input className="inp" id="ad-line2" name="line2" maxLength={200} autoComplete="address-line2" defaultValue={initial?.line2 ?? ""} />
      </div>
      <div className="frow">
        <div className="fgrp">
          <label className="fl" htmlFor="ad-city">CITY</label>
          <input className="inp" id="ad-city" name="city" required maxLength={80} autoComplete="address-level2" defaultValue={initial?.city ?? ""} />
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="ad-state">STATE</label>
          <input className="inp" id="ad-state" name="state" required maxLength={80} autoComplete="address-level1" defaultValue={initial?.state ?? ""} />
        </div>
      </div>
      <div className="frow">
        <div className="fgrp">
          <label className="fl" htmlFor="ad-pin">PIN CODE</label>
          <input className="inp" id="ad-pin" name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} autoComplete="postal-code" defaultValue={initial?.pincode ?? ""} />
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="ad-phone">PHONE</label>
          <input className="inp" id="ad-phone" name="recipientPhone" type="tel" autoComplete="tel" defaultValue={localPhone(initial?.recipientPhone) || user?.phone || ""} />
        </div>
      </div>
      <label className="ck"><input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault ?? false} /> USE AS DEFAULT</label>
      <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
        <button className="btn" type="submit" disabled={busy}>{busy ? "SAVING…" : "SAVE ADDRESS"}</button>
        <button className="btn btn-o" type="button" onClick={onCancel}>CANCEL</button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const [list, setList] = useState<SavedAddress[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);

  const load = useCallback(async () => {
    const result = await accountApi<{ data: SavedAddress[] }>("/api/account/addresses");
    if (result.ok) {
      setList(result.data.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address book loads after mount
    void load();
  }, [load]);

  async function setDefault(id: string) {
    const result = await accountApi(`/api/account/addresses/${id}/default`, { method: "POST" });
    showToast(result.ok ? "DEFAULT ADDRESS UPDATED" : result.error.toUpperCase());
    await load();
  }

  async function remove(id: string) {
    const result = await accountApi(`/api/account/addresses/${id}`, { method: "DELETE" });
    showToast(result.ok ? "ADDRESS REMOVED" : result.error.toUpperCase());
    await load();
  }

  function saved() {
    setEditing(null);
    void load();
  }

  return (
    <>
      <h1 className="h2">ADDRESSES</h1>
      <FormError message={error} />
      {list === null && !error && <p className="small mut" style={{ marginTop: "24px" }}>Loading…</p>}
      {list && (
        <div className="grid2" style={{ marginTop: "24px" }}>
          {list.map((address) =>
            editing !== "new" && editing?.id === address.id ? (
              <AddressForm key={address.id} initial={address} onDone={saved} onCancel={() => setEditing(null)} />
            ) : (
              <div className="addr-card" key={address.id}>
                {address.isDefault && <span className="def">DEFAULT</span>}
                <h3 className="cap" style={{ marginBottom: "8px" }}>{address.label || "ADDRESS"}</h3>
                <p className="small" style={{ lineHeight: 1.8 }}>
                  {address.recipientName && <>{address.recipientName}<br /></>}
                  {address.line1}<br />
                  {address.line2 && <>{address.line2}<br /></>}
                  {address.city}, {address.state} — {address.pincode}
                  {address.recipientPhone && <><br />{address.recipientPhone}</>}
                </p>
                <div className="addr-act">
                  <button onClick={() => setEditing(address)}>EDIT</button>
                  {!address.isDefault && <button onClick={() => void setDefault(address.id)}>SET DEFAULT</button>}
                  <button onClick={() => void remove(address.id)}>REMOVE</button>
                </div>
              </div>
            ),
          )}

          {editing === "new" ? (
            <AddressForm initial={null} onDone={saved} onCancel={() => setEditing(null)} />
          ) : (
            <button className="addr-card" style={{ textAlign: "left" }} onClick={() => setEditing("new")}>
              <h3 className="cap">+ ADD NEW ADDRESS</h3>
            </button>
          )}
        </div>
      )}
      {list?.length === 0 && (
        <p className="small mut" style={{ marginTop: "16px" }}>
          Addresses you use at checkout are saved here automatically.
        </p>
      )}
    </>
  );
}
