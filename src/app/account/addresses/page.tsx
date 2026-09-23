"use client";

import { useState } from "react";
import { addresses as seedAddresses, type Address } from "@/lib/account";
import { useSession } from "@/components/session-provider";
import { showToast } from "@/lib/ui-events";

export default function AddressesPage() {
  const { user } = useSession();
  const [list, setList] = useState<Address[]>(seedAddresses);
  const [adding, setAdding] = useState(false);

  const setDefault = (id: string) => {
    setList((current) => current.map((a) => ({ ...a, isDefault: a.id === id })));
    showToast("DEFAULT ADDRESS UPDATED");
  };

  const remove = (id: string) => {
    setList((current) => current.filter((a) => a.id !== id));
    showToast("ADDRESS REMOVED");
  };

  const add = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = new FormData(e.currentTarget).getAll("inp");
    setList((current) => [...current, {
      id: `a${Date.now()}`,
      type: String(values[0] || "OTHER"),
      isDefault: false,
      name: String(values[1] || user?.name || ""),
      line1: String(values[2] || "New address"),
      line2: String(values[3] || "—"),
      phone: String(values[4] || user?.phone || ""),
    }]);
    showToast("ADDRESS SAVED");
    setAdding(false);
  };

  return (
    <>
      <h1 className="h2">ADDRESSES</h1>
      <div className="grid2" style={{ marginTop: "24px" }}>
        {list.map((address) => (
          <div className="addr-card" key={address.id}>
            {address.isDefault && <span className="def">DEFAULT</span>}
            <h3 className="cap" style={{ marginBottom: "8px" }}>{address.type}</h3>
            <p className="small" style={{ lineHeight: 1.8 }}>
              {address.name}<br />{address.line1}<br />{address.line2}<br />{address.phone}
            </p>
            <div className="addr-act">
              {!address.isDefault && <button onClick={() => setDefault(address.id)}>SET DEFAULT</button>}
              <button onClick={() => remove(address.id)}>REMOVE</button>
            </div>
          </div>
        ))}

        {adding ? (
          <form className="addr-card" style={{ marginTop: "18px", display: "block" }} onSubmit={add}>
            <h3 className="cap" style={{ marginBottom: "16px" }}>NEW ADDRESS</h3>
            <div className="frow">
              <div className="fgrp">
                <label className="fl">LABEL</label>
                <input className="inp" name="inp" defaultValue="OTHER" />
              </div>
              <div className="fgrp">
                <label className="fl">NAME</label>
                <input className="inp" name="inp" defaultValue={user?.name ?? ""} />
              </div>
            </div>
            <div className="fgrp">
              <label className="fl">ADDRESS</label>
              <input className="inp" name="inp" placeholder="Street, building…" />
            </div>
            <div className="frow">
              <div className="fgrp">
                <label className="fl">CITY / PIN</label>
                <input className="inp" name="inp" placeholder="Mumbai — 400050" />
              </div>
              <div className="fgrp">
                <label className="fl">PHONE</label>
                <input className="inp" name="inp" defaultValue="+91 98200 41221" />
              </div>
            </div>
            <button className="btn" type="submit" style={{ marginTop: "18px" }}>SAVE ADDRESS</button>
          </form>
        ) : (
          <button className="addr-card" style={{ textAlign: "left" }} onClick={() => setAdding(true)}>
            <h3 className="cap">+ ADD NEW ADDRESS</h3>
          </button>
        )}
      </div>
    </>
  );
}
