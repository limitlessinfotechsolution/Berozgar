/*
 * Browser helpers for the shopper's account. Every call goes to this site's own
 * /api/auth/* or /api/account/* proxy (src/lib/erp-account-proxy.ts), which adds the
 * session from the httpOnly cookie — the page never holds a token.
 */

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  /** E.164 as the ERP stores it, e.g. +919820011223. */
  phone: string | null;
  phoneVerified: boolean;
  whatsapp: string | null;
  dateOfBirth: string | null;
  hasPassword: boolean;
  marketingEmailOptIn: boolean;
  marketingWhatsappOptIn: boolean;
};

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; code?: string; data?: unknown };

type ErrorBody = {
  error?: string;
  message?: string;
  attemptsLeft?: number;
  issues?: { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };
};

/** The one sentence to show for a failed call. */
export function describeError(status: number, body: ErrorBody | null | undefined): string {
  if (status === 429) return "Too many attempts. Wait a few minutes and try again.";
  if (status === 502) return body?.message ?? "We can't reach our servers right now. Try again in a moment.";
  const issues = body?.issues;
  if (issues) {
    const field = Object.values(issues.fieldErrors ?? {}).find((v) => v?.length)?.[0];
    const form = issues.formErrors?.[0];
    if (field || form) return (field ?? form) as string;
  }
  if (body?.message) return body.message;
  if (status === 401) return "Please sign in again.";
  return "Something went wrong. Please try again.";
}

export async function accountApi<T = unknown>(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown } = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: init.method ?? "GET",
      headers: init.body !== undefined ? { "content-type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as unknown;
    if (response.ok) return { ok: true, status: response.status, data: data as T };
    const body = data as ErrorBody | null;
    return { ok: false, status: response.status, error: describeError(response.status, body), code: body?.error, data };
  } catch {
    return { ok: false, status: 0, error: "You appear to be offline. Check your connection and try again." };
  }
}

/** +919820011223 → 9820011223 for Indian numbers; anything else unchanged. */
export function localPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : phone;
}

/** Published policies to record as accepted (terms + privacy), or [] when none are published. */
export async function signupPolicies(): Promise<{ slug: string; version: string }[]> {
  try {
    const response = await fetch("/api/legal", { cache: "no-store" });
    const body = (await response.json()) as { data?: { slug: string; version: string }[] };
    return (body.data ?? [])
      .filter((p) => p.slug === "terms" || p.slug === "privacy")
      .map(({ slug, version }) => ({ slug, version }));
  } catch {
    return [];
  }
}
