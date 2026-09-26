import { verifySession } from "@/lib/dal";
import { Wishlist } from "./wishlist-client";

export default async function WishlistPage() {
  await verifySession("/account/wishlist");
  return <Wishlist />;
}
