import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalogueOrThrow, getCatalogueProduct } from "@/lib/catalogue";
import { ProductDetail } from "@/components/product-detail";

/* Products added in the admin after a build still resolve — they render on first request. */
export const dynamicParams = true;

export async function generateStaticParams() {
  /* Not re-run during revalidation, so an empty list here means no product
     pages until the next build. Fail the build instead. */
  const products = await getCatalogueOrThrow();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogueProduct(slug);

  if (!product) return { title: "BEROZGAR — Unemployed For A Reason." };

  return {
    title: `${product.name} — BEROZGAR`,
    description: product.description || `${product.name} — ${product.categoryName}`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogueProduct(slug);

  /* Unknown, or set inactive in the admin — the public API answers 404 for both. */
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
