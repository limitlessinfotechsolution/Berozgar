import { verifySession } from "@/lib/dal";
import { AccountReviews } from "./reviews-client";

export default async function AccountReviewsPage() {
  await verifySession("/account/reviews");
  return <AccountReviews />;
}
