/*
 * Client helpers for the storefront's sign-up forms. Each resolves to a message
 * for the shopper; success is only claimed once the ERP has stored the email.
 */

export type SignupResult = { ok: true } | { ok: false; message: string };

async function post(url: string, body: unknown): Promise<SignupResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    if (res.status === 429) return { ok: false, message: "TOO MANY TRIES — WAIT A MINUTE" };
    if (res.status === 422 || res.status === 400) return { ok: false, message: "CHECK YOUR EMAIL ADDRESS" };
    return { ok: false, message: "COULDN'T SAVE THAT — TRY AGAIN" };
  } catch {
    return { ok: false, message: "COULDN'T SAVE THAT — TRY AGAIN" };
  }
}

export function joinNewsletter(email: string, source = "home"): Promise<SignupResult> {
  return post("/api/newsletter", { email, source });
}

export function requestStockAlert(email: string, productId: string, variantId?: string): Promise<SignupResult> {
  return post("/api/stock-alerts", { email, productId, ...(variantId ? { variantId } : {}) });
}
