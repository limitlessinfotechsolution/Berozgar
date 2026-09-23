import Link from "next/link";
import { getCatalogue } from "@/lib/catalogue";
import { categoriesOf } from "@/lib/catalogue-map";
import { Plate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";

export const metadata = {
  title: "COLLECTIONS — BEROZGAR",
  description: "Berozgar collections and drops.",
};

/*
 * The drop is the whole live catalogue; each ERP product category is a collection
 * of its own. The ERP has no Collection model yet (docs/INTEGRATION.md §2).
 */
export default async function CollectionsPage() {
  const products = await getCatalogue();
  const categories = categoriesOf(products);

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "60px 0" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / COLLECTIONS
        </div>

        <header data-rev="true" style={{ padding: "18px 0 40px" }}>
          <h1 className="h1">COLLECTIONS</h1>
        </header>

        <Link href="/collections/drop-001" className="looktile" style={{ aspectRatio: "21 / 9" }} data-rev="true">
          <Plate slug="drop-001" word="DROP 001" label="Drop 001 — The First Statement" variant={3} />
        </Link>

        <p className="cap mut" style={{ marginTop: "14px" }}>
          DROP 001 — THE FIRST STATEMENT — {products.length} PRODUCT{products.length === 1 ? "" : "S"}
        </p>

        {categories.length > 0 && (
          <div className="grid3" style={{ marginTop: "48px" }} data-rev="true">
            {categories.map((category) => (
              <Link key={category.slug} href={`/collections/${category.slug}`} className="jcard">
                <Plate slug={category.slug} word={category.name} label={category.name} variant={2} />
                <span className="cap mut">{category.count} PRODUCT{category.count === 1 ? "" : "S"}</span>
                <span className="h3">{category.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
