/*
 * Razorpay Checkout in the browser. The ERP creates the Razorpay order and holds
 * the secret; this only opens the hosted widget against that order and hands the
 * signed result back for verification (/api/checkout/verify).
 */

export type RazorpayOrder = { orderId: string; amount: number; currency: string; keyId: string };

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open(): void;
  on(event: "payment.failed", handler: (response: { error?: { description?: string } }) => void): void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<void> | null = null;

/* Loaded on demand: only a shopper paying online pays for the script. */
function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return loading;
}

export type PaymentOutcome =
  | { kind: "paid"; result: RazorpaySuccess }
  | { kind: "failed"; reason: string }
  | { kind: "dismissed" };

/*
 * Resolves once, with whichever happens first. A failed attempt keeps the widget
 * open so the shopper can try another method; if they then close it, the failure
 * is what we report.
 */
export async function payWithRazorpay(
  order: RazorpayOrder,
  prefill: { name: string; email: string; contact: string },
  orderNumber: string
): Promise<PaymentOutcome> {
  await loadScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("The payment window isn't available.");

  return new Promise<PaymentOutcome>((resolve) => {
    let lastFailure: string | null = null;
    const rzp = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "BEROZGAR",
      description: `Order #${orderNumber}`,
      prefill,
      theme: { color: "#111111" },
      handler: (result: RazorpaySuccess) => resolve({ kind: "paid", result }),
      modal: {
        ondismiss: () => resolve(lastFailure ? { kind: "failed", reason: lastFailure } : { kind: "dismissed" }),
      },
    });
    rzp.on("payment.failed", (response) => {
      lastFailure = response.error?.description ?? "The payment didn't go through.";
    });
    rzp.open();
  });
}
