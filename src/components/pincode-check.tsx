"use client";

import { useEffect, useState } from "react";
import { deliveryRange, PINCODE_KEY, type PincodeInfo } from "@/lib/delivery";
import { readStored, useHydrated, writeStored } from "@/lib/use-hydrated";

type Check = { state: "idle" } | { state: "loading" } | { state: "done"; info: PincodeInfo } | { state: "error"; message: string };

async function lookup(pin: string): Promise<Check> {
  try {
    const res = await fetch(`/api/pincode/${pin}`);
    if (res.status === 400) return { state: "error", message: "ENTER A 6-DIGIT PINCODE" };
    if (!res.ok) return { state: "error", message: "CAN'T CHECK RIGHT NOW — TRY AGAIN" };
    return { state: "done", info: (await res.json()) as PincodeInfo };
  } catch {
    return { state: "error", message: "CAN'T CHECK RIGHT NOW — TRY AGAIN" };
  }
}

/*
 * "Delivers to MUMBAI by SAT 26 SEP – MON 28 SEP · COD available". The pincode is
 * remembered so the next product page and checkout already know it. Everything
 * shown comes from the ERP's storefront settings; nothing is estimated here.
 */
export function PincodeCheck() {
  const hydrated = useHydrated();
  /* null = untouched: show the pincode checked on an earlier product page. */
  const [pinEdit, setPinEdit] = useState<string | null>(null);
  const saved = hydrated ? readStored<string>(PINCODE_KEY, "") : "";
  const remembered = /^[1-9][0-9]{5}$/.test(saved) ? saved : "";
  const pin = pinEdit ?? remembered;
  const [check, setCheck] = useState<Check>({ state: "idle" });

  /* A remembered pincode answers straight away. */
  useEffect(() => {
    if (!remembered) return;
    let live = true;
    void lookup(remembered).then((next) => { if (live) setCheck(next); });
    return () => { live = false; };
  }, [remembered]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = pin.trim();
    setCheck({ state: "loading" });
    const next = await lookup(value);
    setCheck(next);
    if (next.state === "done") writeStored(PINCODE_KEY, value);
  }

  const info = check.state === "done" ? check.info : null;

  return (
    <div className="sel-block">
      <div className="lbl"><span className="cap">DELIVERY</span></div>
      <form className="coupon" style={{ margin: "0 0 10px" }} onSubmit={submit}>
        <input
          inputMode="numeric"
          pattern="[1-9][0-9]{5}"
          maxLength={6}
          autoComplete="postal-code"
          placeholder="ENTER PINCODE"
          aria-label="Delivery pincode"
          value={pin}
          onChange={(e) => setPinEdit(e.target.value.replace(/\D/g, ""))}
          required
        />
        <button type="submit" disabled={check.state === "loading"}>{check.state === "loading" ? "…" : "CHECK"}</button>
      </form>
      {check.state === "error" && <p className="small" role="status">{check.message}</p>}
      {info && (
        <p className="small" role="status">
          {info.deliveryDays ? (
            <>
              DELIVERS{info.city ? <> TO <b>{info.city.toUpperCase()}</b></> : null} BY <b>{deliveryRange(info.deliveryDays)}</b>
            </>
          ) : (
            <>WE DELIVER ACROSS INDIA — WE COULDN&apos;T PLACE THIS PINCODE, SO YOUR DATE WILL SHOW AT CHECKOUT.</>
          )}
          <br />
          <span className="mut">{info.cod.available ? "Cash on delivery available." : info.cod.reason ?? "Prepaid only."}</span>
        </p>
      )}
    </div>
  );
}
