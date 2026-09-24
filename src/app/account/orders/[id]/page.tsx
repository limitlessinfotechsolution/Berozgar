import { AccountOrderClient } from "@/components/account-order-client";

export const metadata = {
  title: "ACCOUNT — BEROZGAR",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountOrderClient orderNumber={decodeURIComponent(id).toUpperCase()} />;
}
