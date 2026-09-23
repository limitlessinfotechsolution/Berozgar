import Link from "next/link";
import { orders, orderTotal, statusClass, inr } from "@/lib/account";

export const metadata = {
  title: "ACCOUNT — BEROZGAR",
};

export default function OrdersPage() {
  return (
    <>
      <h1 className="h2">MY ORDERS</h1>
      {orders.map((order) => (
        <Link key={order.id} className="o-row" href={`/account/orders/${order.id}`}>
          <span className="oid">#{order.id}</span>
          <span className="small mut">
            {order.date} · {order.items.length} ITEM{order.items.length > 1 ? "S" : ""}
          </span>
          <b className="price num">{inr(orderTotal(order))}</b>
          <span className={`stchip ${statusClass(order.status)}`}>{order.status}</span>
        </Link>
      ))}
    </>
  );
}
