import type { Product } from "@/lib/products";
import { plateFor } from "@/lib/plate";
import { PhotoPlate } from "@/components/photo-plate";

export { PhotoPlate };

/*
 * Variant 0 is the resting image, variant 1 the hover/alt image.
 *
 * Uses the product's uploaded images (from the ERP admin) when it has them and
 * falls back to the generated typographic plate when it doesn't. A product with a
 * single photo has no alt image rather than a photo that hovers into a plate.
 */
export function ProductPlate({
  product,
  variant = 0,
  className = "",
}: {
  product: Product;
  variant?: 0 | 1;
  className?: string;
}) {
  const plate = (
    <Plate
      slug={product.slug}
      word={product.word}
      variant={variant}
      label={product.name}
      className={className}
    />
  );

  if (product.images.length > 0) {
    const src = product.images[variant];
    if (!src) return null;
    return <PhotoPlate src={src} label={product.name} className={className} fallback={plate} />;
  }

  return plate;
}

/* Oversized display plate used for the hero and the About band. */
export function HeroPlate({
  word,
  num,
  className = "",
}: {
  word: string;
  num: string;
  className?: string;
}) {
  return (
    <div className={`plate ${className}`.trim()}>
      <span className="pl-num" style={{ fontSize: "clamp(5rem,16vw,14rem)" }}>{num}</span>
      <span className="pl-word" style={{ fontSize: "clamp(2rem,6vw,5rem)" }}>{word}</span>
      <span className="pl-tag">BEROZGAR — EST. MUMBAI</span>
    </div>
  );
}

/* Generic plate for looks, articles and anything else keyed by a slug. */
export function Plate({
  slug,
  word,
  variant = 0,
  label,
  className = "",
}: {
  slug: string;
  word?: string;
  variant?: number;
  label?: string;
  className?: string;
}) {
  const plate = plateFor(slug, word, variant);
  return (
    <div
      className={["plate", plate.tone, plate.pat, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={label || word || "Berozgar visual"}
    >
      <span className="pl-num">{plate.num}</span>
      <span className="pl-word">{plate.word}</span>
      <span className="pl-tag">{plate.tag}</span>
      <span className="pl-vert">{plate.vert}</span>
    </div>
  );
}
