"use client";

import { INDIAN_STATES, matchState } from "@/lib/india";
import { explain } from "@/lib/validity";

/*
 * State as a dropdown of the 36 states and UTs, holding the canonical name the
 * ERP stores (src/lib/india.ts). A value saved before the dropdown ("MH",
 * "maharashtra") opens on the matching option; one it can't place opens on
 * "Choose state", so the shopper picks rather than keeps a value that fails.
 */
export function StateSelect({
  id,
  name,
  value,
  onChange,
  required = true,
}: {
  id: string;
  name?: string;
  value: string | null | undefined;
  onChange: (name: string) => void;
  required?: boolean;
}) {
  const selected = matchState(value)?.name ?? "";
  return (
    <select
      className="inp"
      id={id}
      name={name}
      required={required}
      autoComplete="address-level1"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      {...explain("Choose your state.")}
    >
      <option value="" disabled>
        Choose state
      </option>
      {INDIAN_STATES.map((s) => (
        <option key={s.abbr} value={s.name}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

/*
 * Country, shown so the address reads completely — and so a shopper abroad
 * learns before they pay that we don't ship to them. India is the only option
 * and it isn't sent: the ERP has no country field.
 */
export function CountryField({ id }: { id: string }) {
  return (
    <div className="fgrp">
      <label className="fl" htmlFor={id}>COUNTRY</label>
      <select className="inp" id={id} disabled value="IN" aria-describedby={`${id}-note`}>
        <option value="IN">India</option>
      </select>
      <small className="small mut" id={`${id}-note`} style={{ display: "block", marginTop: "6px" }}>
        We deliver within India only.
      </small>
    </div>
  );
}
