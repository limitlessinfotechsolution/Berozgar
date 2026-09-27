"use client";

import { useState } from "react";
import { PASSWORD_MAX, PASSWORD_MIN, passwordRules } from "@/lib/password-rules";

/*
 * A password input with a Show/Hide toggle. With `rules`, a checklist of the
 * ERP's password rule sits under it and ticks as it's met (src/lib/password-rules.ts).
 */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  rules = false,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  rules?: boolean;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="fgrp">
      <label className="fl" htmlFor={id}>{label}</label>
      <div className="pw-in">
        <input
          className="inp"
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          {...(rules ? { minLength: PASSWORD_MIN, maxLength: PASSWORD_MAX, "aria-describedby": `${id}-rules` } : {})}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          className="pw-tog"
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
          <span className="sr-only"> password</span>
        </button>
      </div>
      {rules && (
        <ul className="pw-rules" id={`${id}-rules`} aria-label="Password must have">
          {passwordRules(value).map((rule) => (
            <li key={rule.id} className={rule.met ? "met" : undefined}>
              {rule.label}
              <span className="sr-only">{rule.met ? " (done)" : " (not yet)"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
