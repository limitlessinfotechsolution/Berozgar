/*
 * Order tracking against the ERP (GET /api/public/v1/orders/:number via /api/track).
 *
 * The ERP has 12 order statuses, most of them internal to production. Customers
 * see six steps; everything between confirmation and packing reads as "in
 * production". OUT FOR DELIVERY is a shipment status, not an order status, so it
 * comes from the order's shipment (docs/INTEGRATION.md §7).
 */

/* Saved by checkout so /track-order can prefill the phone for the order just placed. */
export const LAST_ORDER_KEY = "berozgar-last-order";

/*
 * Every order this browser has placed or looked up, with the phone that proves it.
 * Until customer login reaches the ERP (docs/INTEGRATION.md §6), this is what
 * /account/orders lists — orders on this device, not every order on the account.
 */
export const RECENT_ORDERS_KEY = "berozgar-recent-orders";
const RECENT_ORDERS_MAX = 20;

export type RecentOrder = { id: string; phone: string; seenAt: string };

/* Newest first; a repeat moves to the top with the latest phone. Pure, for testing. */
export function withRecentOrder(list: readonly RecentOrder[], id: string, phone: string, now = new Date()): RecentOrder[] {
  const key = id.trim().toUpperCase();
  const rest = list.filter((o) => o.id !== key);
  return [{ id: key, phone: phone.trim(), seenAt: now.toISOString() }, ...rest].slice(0, RECENT_ORDERS_MAX);
}

/* Browser only; tolerant of private mode and corrupt values, like readStored. */
export function recentOrders(): RecentOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_ORDERS_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((o): o is RecentOrder => typeof o?.id === "string" && typeof o?.phone === "string")
      : [];
  } catch {
    return [];
  }
}

export function rememberOrder(id: string, phone: string): void {
  if (typeof window === "undefined" || !id || !phone) return;
  try {
    window.localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(withRecentOrder(recentOrders(), id, phone)));
  } catch {
    /* Private mode or a full quota — the order page still works without it. */
  }
}

export type ErpOrderStatus =
  | "NEW" | "CONFIRMED" | "DESIGNING" | "AWAITING_APPROVAL" | "DESIGN_APPROVED" | "PRODUCTION"
  | "QC" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";

export type TrackedOrder = {
  orderNumber: string;
  status: ErpOrderStatus;
  createdAt: string;
  deliveredAt: string | null;
  items: {
    id: string;
    name: string;
    slug: string;
    size: string;
    colour: string;
    quantity: number;
    unitPrice: string;
    /* Units still open to a return / exchange claim. */
    claimable: number;
  }[];
  totals: { subtotal: string; shipping: string; gst: string; grandTotal: string };
  history: { toStatus: ErpOrderStatus; changedAt: string }[];
  /* The latest payment attempt; null means cash on delivery. */
  payment: { method: string; status: PaymentStatus } | null;
  balanceDue: string;
  /* Issued on delivery; download through /api/orders/:id/invoice. */
  invoice: { invoiceNumber: string; issuedAt: string } | null;
  returns: OrderReturns;
  shipment: TrackedShipment | null;
};

export type ReturnReason = "DAMAGED" | "DEFECTIVE" | "WRONG_ITEM" | "NOT_AS_APPROVED" | "MISSING_ITEM";
export type ReturnResolution = "REFUND" | "REPLACEMENT";
export type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "RECEIVED" | "RESOLVED" | "CANCELLED";

export type OrderReturns = {
  eligible: boolean;
  /* Why not, when not: before delivery, after the window, a claim already open, or nothing left to claim. */
  code: "ok" | "not_delivered" | "window_closed" | "open_claim" | "nothing_left";
  deadline: string | null;
  windowDays: number;
  requests: {
    returnNumber: string;
    status: ReturnStatus;
    reason: ReturnReason;
    resolution: ReturnResolution;
    createdAt: string;
    rejectionReason: string | null;
    pickupRequired: boolean;
    /* Resolved refund claims: the value taken off the order, and the part of it returned as cash. */
    creditAmount: string | null;
    refundAmount: string | null;
    items: { orderItemId: string; quantity: number }[];
    replacementOrderNumber: string | null;
  }[];
};

export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export type ShipmentStatus =
  | "PENDING" | "READY" | "DISPATCHED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED" | "RETURNED";

export type TrackedShipment = {
  courier: string;
  trackingId: string | null;
  trackingUrl: string | null;
  status: ShipmentStatus;
  dispatchDate: string | null;
  expectedDelivery: string | null;
  events: { status: ShipmentStatus; location: string | null; occurredAt: string }[];
};

export const TRACK_STEPS = ["ORDERED", "CONFIRMED", "PACKED", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED"] as const;
const OUT_FOR_DELIVERY_STEP = 4;

/* Which customer-facing step each ERP status sits on. */
const STEP_OF: Record<ErpOrderStatus, number> = {
  NEW: 0,
  CONFIRMED: 1,
  DESIGNING: 1,
  AWAITING_APPROVAL: 1,
  DESIGN_APPROVED: 1,
  PRODUCTION: 1,
  QC: 1,
  PACKED: 2,
  SHIPPED: 3,
  DELIVERED: 5,
  CANCELLED: -1,
  RETURNED: -1,
};

/* A shipped order whose parcel is on the last leg sits one step further on. */
export function trackStep(status: ErpOrderStatus, shipment?: ShipmentStatus | null): number {
  const step = STEP_OF[status] ?? 0;
  return status === "SHIPPED" && shipment === "OUT_FOR_DELIVERY" ? OUT_FOR_DELIVERY_STEP : step;
}

/* A sub-label for the current step when the ERP is more specific than the step name. */
export function statusDetail(status: ErpOrderStatus, shipment?: TrackedShipment | null): string | null {
  if (["DESIGNING", "AWAITING_APPROVAL", "DESIGN_APPROVED", "PRODUCTION", "QC"].includes(status)) return "IN PRODUCTION";
  if (status === "SHIPPED" && shipment) {
    const last = shipment.events.at(-1);
    const where = last?.location ? last.location.toUpperCase() : null;
    if (shipment.status === "IN_TRANSIT") return where ? `IN TRANSIT — ${where}` : "IN TRANSIT";
    if (shipment.status === "FAILED") return "DELIVERY ATTEMPT FAILED";
    if (shipment.status === "OUT_FOR_DELIVERY") return where;
  }
  return null;
}

/* When the order first reached each step: the ERP's status history, plus the
   shipment's own events for the step that isn't an order status. */
export function stepTimes(order: TrackedOrder): (string | null)[] {
  return TRACK_STEPS.map((_, step) => {
    if (step === OUT_FOR_DELIVERY_STEP) {
      return order.shipment?.events.find((e) => e.status === "OUT_FOR_DELIVERY")?.occurredAt ?? null;
    }
    const hit = order.history.find((h) => STEP_OF[h.toStatus] === step);
    return hit ? hit.changedAt : null;
  });
}

export type PaymentState = "PAID" | "PAY ON DELIVERY" | "PAYMENT PENDING" | "REFUNDED";

/* What the shopper sees about the money. No payment row means cash on delivery. */
export function paymentState(order: Pick<TrackedOrder, "payment">): PaymentState {
  const status = order.payment?.status;
  if (!order.payment) return "PAY ON DELIVERY";
  if (status === "PAID") return "PAID";
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") return "REFUNDED";
  return "PAYMENT PENDING";
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function formatStamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}
