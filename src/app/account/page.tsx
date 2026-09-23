"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useSession } from "@/components/session-provider";

/*
 * Only what the storefront can actually answer today.
 *
 * Rewards, referrals, the "active order" card and the notification feed were
 * invented numbers with nothing behind them — no loyalty, referral or
 * notification model exists in the ERP. The order count follows once
 * /account/orders reads real orders instead of fixtures.
 */
export default function AccountOverviewPage() {
  const { wishlist } = useCart();
  const { user } = useSession();

  return (
    <>
      <h1 className="h1">WELCOME BACK{user ? `, ${user.name}` : ""}</h1>

      <div className="stat-cards" data-rev="true">
        <Link className="stat" href="/account/orders">
          <span>ORDERS</span>
          <b style={{ fontSize: "15px", letterSpacing: "0.06em" }}>VIEW →</b>
        </Link>
        <Link className="stat" href="/account/wishlist">
          <span>WISHLIST</span>
          <b>{wishlist.length}</b>
        </Link>
        <Link className="stat" href="/account/addresses">
          <span>ADDRESSES</span>
          <b style={{ fontSize: "15px", letterSpacing: "0.06em" }}>MANAGE →</b>
        </Link>
        <Link className="stat" href="/track-order">
          <span>TRACK</span>
          <b style={{ fontSize: "15px", letterSpacing: "0.06em" }}>ORDER →</b>
        </Link>
      </div>
    </>
  );
}
