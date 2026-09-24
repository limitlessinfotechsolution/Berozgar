import { Suspense } from "react";
import { ContactClient } from "@/components/contact-client";

export const metadata = {
  title: "CONTACT — BEROZGAR",
  description: "Reach Berozgar support about an order, payment, shipping or returns.",
};

export default function ContactPage() {
  return (
    <Suspense>
      <ContactClient />
    </Suspense>
  );
}
