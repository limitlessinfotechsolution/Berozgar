import { Suspense } from "react";
import { TrackOrderClient } from "@/components/track-order-client";

export const metadata = {
  title: "TRACK ORDER — BEROZGAR",
  description: "Track your Berozgar order.",
};

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackOrderClient />
    </Suspense>
  );
}
