import { verifySession } from "@/lib/dal";
import { Privacy } from "./privacy-client";

export const metadata = { title: "PRIVACY & DATA — BEROZGAR" };

export default async function PrivacyPage() {
  await verifySession("/account/privacy");
  return <Privacy />;
}
