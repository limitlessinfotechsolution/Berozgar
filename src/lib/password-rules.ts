/*
 * The ERP's rule for a new password (packages/validation/src/customer-account.ts,
 * `newPassword`): 8-128 characters with at least one letter and one number. Shown
 * as a checklist while typing, so the rule is met before the ERP has to refuse it.
 * Keep the two in step — the ERP stays the one that enforces it.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export type PasswordRule = { id: string; label: string; met: boolean };

export function passwordRules(value: string): PasswordRule[] {
  return [
    { id: "length", label: `At least ${PASSWORD_MIN} characters`, met: value.length >= PASSWORD_MIN },
    { id: "letter", label: "A letter", met: /[A-Za-z]/.test(value) },
    { id: "number", label: "A number", met: /\d/.test(value) },
  ];
}

export function passwordAcceptable(value: string): boolean {
  return value.length <= PASSWORD_MAX && passwordRules(value).every((r) => r.met);
}
