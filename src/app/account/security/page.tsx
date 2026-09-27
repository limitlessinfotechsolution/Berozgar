import { verifySession } from "@/lib/dal";
import { Security } from "./security-client";

export const metadata = { title: "SECURITY — BEROZGAR" };

export default async function SecurityPage() {
  await verifySession("/account/security");
  return <Security />;
}
