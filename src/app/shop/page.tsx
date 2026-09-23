import { Suspense } from "react";
import { ShopClient } from "@/components/shop-client";
import { getCatalogue } from "@/lib/catalogue";

export const metadata = {
  title: "SHOP — BEROZGAR",
  description: "Shop Berozgar.",
};

export default async function ShopPage() {
  const products = await getCatalogue();
  return (
    <Suspense>
      <ShopClient initialProducts={products} />
    </Suspense>
  );
}
