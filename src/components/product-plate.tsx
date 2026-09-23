import type { Product } from "@/lib/products";
import { plateFor } from "@/lib/plate";

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
  if (product.images.length > 0) {
    const src = product.images[variant];
    if (!src) return null;
    return <PhotoPlate src={src} label={product.name} className={className} />;
  }

  return (
    <Plate
      slug={product.slug}
      word={product.word}
      variant={variant}
      label={product.name}
      className={className}
    />
  );
}

/* A photo in the plate box, so every layout rule written for .plate still applies. */
export function PhotoPlate({ src, label, className = "" }: { src: string; label: string; className?: string }) {
  return (
    <div className={`plate pimg ${className}`.trim()}>
      {/* Plain <img>: images come from object storage at a host set per environment. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} loading="lazy" decoding="async" />
    </div>
  );
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
