import { verifySession } from "@/lib/dal";
import { Profile } from "./profile-client";

export default async function ProfilePage() {
  await verifySession("/account/profile");
  return <Profile />;
}
