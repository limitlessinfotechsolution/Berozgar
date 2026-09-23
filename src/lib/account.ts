/*
 * Account fixtures — orders, addresses, order timeline.
 *
 * SEAM: replaced by /api/public/v1/account/* — see docs/INTEGRATION.md §5.
 * ORDER_TIMELINE cannot come from Order.status alone: OUT FOR DELIVERY exists
 * only as ShipmentStatus, so the real timeline is composed from Order.status
 * plus ShipmentEvent (§8). OrderStatus here is also missing CANCELLED and
 * RETURNED, both of which a customer can reach.
 */
export type Address = {
  id: string;
  type: string;
  isDefault: boolean;
  name: string;
  phone: string;
  line1: string;
  line2: string;
};

/* [productId, "COLOUR / SIZE", quantity, unitPrice] */
export type OrderItem = [string, string, number, number];

export type OrderStatus = "PROCESSING" | "SHIPPED" | "DELIVERED";

export type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  payment: string;
  addressId: string | null;
};

export const addresses: Address[] = [
  {
    id: "a1",
    type: "HOME",
    isDefault: true,
    name: "FAISAL K.",
    phone: "+91 98200 41221",
    line1: "402, Sunrise Heights, Carter Road",
    line2: "Bandra West, Mumbai — 400050",
  },
  {
    id: "a2",
    type: "OFFICE",
    isDefault: false,
    name: "FAISAL K.",
    phone: "+91 98200 41221",
    line1: "3rd Floor, Prestige Tech Park",
    line2: "Kadubeesanahalli, Bengaluru — 560103",
  },
];

export const orders: Order[] = [
  {
    id: "BRZ10187",
    date: "02 AUG",
    status: "DELIVERED",
    items: [["cargo", "BLACK / M", 1, 1299], ["tee-white", "WHITE / L", 1, 1499]],
    payment: "UPI",
    addressId: "a2",
  },
  {
    id: "BRZ10041",
    date: "11 JUL",
    status: "DELIVERED",
    items: [["crew", "CHARCOAL / L", 1, 1299]],
    payment: "UPI",
    addressId: "a1",
  },
  {
    id: "BRZ10355",
    date: "29 AUG",
    status: "PROCESSING",
    items: [["hoodie", "BLACK / L", 1, 1999]],
    payment: "COD",
    addressId: "a1",
  },
  {
    id: "BRZ10294",
    date: "26 AUG",
    status: "SHIPPED",
    items: [["tee-black", "BLACK / L", 1, 1499], ["cap", "BLACK / OS", 1, 499]],
    payment: "UPI",
    addressId: "a1",
  },
];

export const ORDER_TIMELINE: [string, string][] = [
  ["ORDERED", "26 AUG, 10:12"],
  ["CONFIRMED", "26 AUG, 10:15"],
  ["PACKED", "27 AUG, 16:40"],
  ["SHIPPED", "28 AUG, 09:05"],
  ["OUT FOR DELIVERY", "—"],
  ["DELIVERED", "—"],
];

/* How far along the timeline each status sits. */
export const STATUS_STEP: Record<OrderStatus, number> = {
  PROCESSING: 1,
  SHIPPED: 3,
  DELIVERED: 5,
};

export function statusClass(status: OrderStatus) {
  return status === "SHIPPED" ? "st-ship" : status === "DELIVERED" ? "st-del" : "st-pro";
}

export function orderTotal(order: Order) {
  return order.items.reduce((sum, [, , qty, price]) => sum + price * qty, 0);
}

export function getOrder(id: string) {
  return orders.find((o) => o.id === id);
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
