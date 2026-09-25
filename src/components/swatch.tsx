import { isLight, swatchFor } from "@/lib/colours";

/* The inside of a colour button: a filled chip when the name is a known colour,
   the old two-letter code when it isn't. The button carries the aria-label. */
export function Swatch({ name }: { name: string }) {
  const hex = swatchFor(name);
  if (!hex) return <>{name.slice(0, 2)}</>;
  return <i className={`sw ${isLight(hex) ? "sw-light" : ""}`.trim()} style={{ background: hex }} aria-hidden="true" />;
}
