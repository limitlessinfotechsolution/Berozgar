import { Suspense } from "react";
import { ShopClient } from "@/components/shop-client";
import { getCatalogueState } from "@/lib/catalogue";

export const metadata = {
  title: "SHOP — BEROZGAR",
  description: "Shop Berozgar.",
};

export default async function ShopPage() {
  const { products, unavailable } = await getCatalogueState();
  return (
    <Suspense>
      <ShopClient initialProducts={products} unavailable={unavailable} />
    </Suspense>
  );
}
