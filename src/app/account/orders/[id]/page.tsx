import { notFound } from "next/navigation";
import { orders } from "@/lib/account";
import { OrderDetail } from "@/components/order-detail";

export const metadata = {
  title: "ACCOUNT — BEROZGAR",
};

export async function generateStaticParams() {
  return orders.map((o) => ({ id: o.id }));
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = orders.find((o) => o.id === id);

  if (!order) notFound();

  return <OrderDetail order={order} />;
}
