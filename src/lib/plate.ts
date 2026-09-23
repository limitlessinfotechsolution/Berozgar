/*
 * Every "image" on the site is a CSS plate generated from a slug — there are no
 * raster assets. Tone, texture and the big number are all derived from a hash so
 * a given slug always renders the same plate.
 */

export type Plate = {
  tone: string;
  pat: string;
  num: string;
  word: string;
  tag: string;
  vert: string;
};

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function plateFor(slug: string, word?: string, variant = 0): Plate {
  const base = hash(String(slug || "x"));
  const seed = base + 97 * variant;
  return {
    /*
     * Tone comes from the slug alone, not the variant. Several plates of one
     * product are meant to read as one garment shot a few ways; when the variant
     * moved the tone too, a product's gallery mixed the cream t2 in among the
     * dark tones and looked like five unrelated products.
     */
    tone: ["t0", "t1", "t2", "t3"][base % 4],
    /*
     * `>>>`, not `>>`. A signed shift on a hash above 2^31 yields a negative
     * index, so `pat` was undefined and the plate rendered as a flat block with
     * no texture — which is every slug whose hash happens to be large, including
     * bz-ts-classic (3867145177).
     */
    pat: ["pt-a", "pt-b", "pt-c", "pt-d"][(seed >>> 2) % 4],
    num: String((seed % 80) + 10),
    word: (word && word.length ? word : "BRZ").toUpperCase(),
    tag: variant === 1 ? "DROP 001" : "UNEMPLOYED",
    vert: variant === 1 ? "DROP 001" : "BEROZGAR",
  };
}
