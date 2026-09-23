import { Suspense } from "react";
import { OrderSuccess } from "@/components/order-success";

export const metadata = {
  title: "ORDER PLACED — BEROZGAR",
  description: "Your Berozgar order has been placed.",
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <OrderSuccess />
    </Suspense>
  );
}
