"use client";

import Link from "next/link";
import { useCatalogue } from "@/components/catalogue-provider";
import { Plate, ProductPlate } from "@/components/product-plate";
import { showToast } from "@/lib/ui-events";
import {
  addresses,
  orderTotal,
  statusClass,
  inr,
  ORDER_TIMELINE,
  STATUS_STEP,
  type Order,
} from "@/lib/account";

export function OrderDetail({ order }: { order: Order }) {
  const { byId } = useCatalogue();
  const total = orderTotal(order);
  const step = STATUS_STEP[order.status] ?? 0;
  const address = addresses.find((a) => a.id === order.addressId) || addresses[0];

  return (
    <>
      <Link href="/account/orders" className="tlink" style={{ border: 0 }}>← ALL ORDERS</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", margin: "20px 0" }}>
        <h1 className="h2">ORDER #{order.id}</h1>
        <span className={`stchip ${statusClass(order.status)}`}>{order.status}</span>
      </div>

      {order.items.map(([id, variant, qty, price]) => {
        /* Account orders are still fixtures (customer login isn't wired to the ERP);
           their products may not exist in the live catalogue, so fall back to the id. */
        const product = byId(id);
        return (
          <div className="ci" key={id + variant}>
            <div className="th">
              {product ? <ProductPlate product={product} variant={0} /> : <Plate slug={id} word={id} label={id} />}
            </div>
            <div>
              <div className="nm">{product?.name ?? id.replace(/-/g, " ").toUpperCase()}</div>
              <div className="mt">{variant} × {qty}</div>
            </div>
            <b className="price num">{inr(price * qty)}</b>
          </div>
        );
      })}

      <div className="sumrow" style={{ maxWidth: "320px", marginLeft: "auto" }}>
        <span>Total ({order.payment})</span>
        <b className="num">{inr(total)}</b>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "22px 0" }}>
        {order.status !== "DELIVERED" && (
          <Link className="btn btn-o" href={`/track-order?id=${order.id}`}>TRACK ORDER</Link>
        )}
        <button className="btn btn-o" onClick={() => showToast(`INVOICE DOWNLOADED — #${order.id}`)}>
          DOWNLOAD INVOICE
        </button>
        {order.status === "DELIVERED" && (
          <>
            <button className="btn btn-o" onClick={() => showToast(`RETURN REQUEST RECEIVED — #${order.id}`)}>
              REQUEST RETURN
            </button>
            <button className="btn btn-o" onClick={() => showToast(`EXCHANGE REQUEST RECEIVED — #${order.id}`)}>
              REQUEST EXCHANGE
            </button>
          </>
        )}
      </div>

      <h3 className="cap" style={{ margin: "26px 0 4px" }}>SHIP TO</h3>
      <p className="small mut">{address?.line1}<br />{address?.line2}</p>

      <h3 className="cap" style={{ margin: "26px 0 0" }}>TIMELINE</h3>
      <div className="tl">
        {ORDER_TIMELINE.map(([label], i) => (
          <div key={label} className={`tl-i ${i < step ? "done" : ""} ${i === step ? "cur" : ""}`.trim()}>
            <b>{label}</b>
          </div>
        ))}
      </div>
    </>
  );
}
