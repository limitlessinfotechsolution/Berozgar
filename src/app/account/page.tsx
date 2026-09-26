import { verifySession } from "@/lib/dal";
import { AccountOverview } from "./overview-client";

export default async function AccountOverviewPage() {
  await verifySession("/account");
  return <AccountOverview />;
}
