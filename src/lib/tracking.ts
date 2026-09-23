/*
 * Order tracking against the ERP (GET /api/public/v1/orders/:number via /api/track).
 *
 * The ERP has 12 order statuses, most of them internal to production. Customers
 * see five steps; everything between confirmation and packing reads as "in
 * production". OUT FOR DELIVERY is a shipment event, not an order status, so it is
 * left out until shipments are wired (docs/INTEGRATION.md §7).
 */

/* Saved by checkout so /track-order can prefill the phone for the order just placed. */
export const LAST_ORDER_KEY = "berozgar-last-order";

export type ErpOrderStatus =
  | "NEW" | "CONFIRMED" | "DESIGNING" | "AWAITING_APPROVAL" | "DESIGN_APPROVED" | "PRODUCTION"
  | "QC" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";

export type TrackedOrder = {
  orderNumber: string;
  status: ErpOrderStatus;
  createdAt: string;
  items: { name: string; slug: string; size: string; colour: string; quantity: number; unitPrice: string }[];
  totals: { subtotal: string; shipping: string; gst: string; grandTotal: string };
  history: { toStatus: ErpOrderStatus; changedAt: string }[];
};

export const TRACK_STEPS = ["ORDERED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

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
  DELIVERED: 4,
  CANCELLED: -1,
  RETURNED: -1,
};

export function trackStep(status: ErpOrderStatus): number {
  return STEP_OF[status] ?? 0;
}

/* A sub-label for the current step when the ERP is more specific than the step name. */
export function statusDetail(status: ErpOrderStatus): string | null {
  if (["DESIGNING", "AWAITING_APPROVAL", "DESIGN_APPROVED", "PRODUCTION", "QC"].includes(status)) return "IN PRODUCTION";
  return null;
}

/* When the order first reached each step, from the ERP's status history. */
export function stepTimes(order: TrackedOrder): (string | null)[] {
  return TRACK_STEPS.map((_, step) => {
    const hit = order.history.find((h) => STEP_OF[h.toStatus] === step);
    return hit ? hit.changedAt : null;
  });
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function formatStamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}
