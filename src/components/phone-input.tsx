"use client";

import { useState } from "react";
import { COUNTRY_CODE, MOBILE_PATTERN, toNationalMobile } from "@/lib/phone";
import { explain } from "@/lib/validity";

/*
 * A phone field: a fixed +91 before 10 national digits. The site only takes
 * Indian mobiles (the ERP stores +91XXXXXXXXXX), so the code is shown, not
 * chosen — a one-option dropdown would be a control that does nothing. When
 * other countries are needed, the prefix becomes a picker here and nowhere else.
 *
 * Typing and pasting are cleaned as they happen ("+91 98200 11223" → 9820011223),
 * and the value — controlled or, with `name`, submitted by a plain form — is the
 * 10 digits, which every ERP phone field accepts.
 */
export function PhoneInput({
  id,
  name,
  value,
  defaultValue = "",
  onChange,
  required = false,
  placeholder = "98200 11223",
  autoFocus,
}: {
  id: string;
  name?: string;
  /* Controlled: pass value + onChange. Uncontrolled: defaultValue (and name). */
  value?: string;
  defaultValue?: string;
  onChange?: (national: string) => void;
  required?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [inner, setInner] = useState(() => toNationalMobile(defaultValue));
  const national = value !== undefined ? toNationalMobile(value) : inner;

  function change(raw: string) {
    const next = toNationalMobile(raw);
    if (value === undefined) setInner(next);
    onChange?.(next);
  }

  return (
    <div className="phone-in">
      {/* Read with the field (aria-describedby): "Phone, +91 India". */}
      <span className="phone-cc" id={`${id}-cc`}>
        <span className="phone-cc-flag" aria-hidden="true">IN</span>
        {COUNTRY_CODE}
        <span className="sr-only"> India</span>
      </span>
      <input
        className="inp"
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        pattern={MOBILE_PATTERN}
        required={required}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-describedby={`${id}-cc`}
        value={national}
        onChange={(e) => change(e.target.value)}
        {...explain("Enter the 10-digit mobile number, starting with 6, 7, 8 or 9.")}
      />
    </div>
  );
}
