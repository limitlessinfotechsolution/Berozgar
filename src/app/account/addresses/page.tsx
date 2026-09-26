import { verifySession } from "@/lib/dal";
import { Addresses } from "./addresses-client";

export default async function AddressesPage() {
  await verifySession("/account/addresses");
  return <Addresses />;
}
