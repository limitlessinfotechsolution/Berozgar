import { AccountOrdersClient } from "@/components/account-orders-client";
import { verifySession } from "@/lib/dal";

export const metadata = {
  title: "ACCOUNT — BEROZGAR",
};

export default async function OrdersPage() {
  await verifySession("/account/orders");
  return <AccountOrdersClient />;
}
