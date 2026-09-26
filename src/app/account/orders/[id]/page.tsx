import { AccountOrderClient } from "@/components/account-order-client";
import { verifySession } from "@/lib/dal";

export const metadata = {
  title: "ACCOUNT — BEROZGAR",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await verifySession(`/account/orders/${encodeURIComponent(id)}`);
  return <AccountOrderClient orderNumber={decodeURIComponent(id).toUpperCase()} />;
}
