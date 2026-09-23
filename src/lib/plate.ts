/*
 * Every "image" on the site is a CSS plate generated from a slug — there are no
 * raster assets. Tone, texture and the big number are all derived from a hash so
 * a given slug always renders the same plate.
 */

export type Plate = {
  tone: string;
  /* Undefined when the seed exceeds 2^31 — see the note in plateFor. */
  pat: string | undefined;
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
  const seed = hash(String(slug || "x")) + 97 * variant;
  return {
    tone: ["t0", "t1", "t2", "t3"][seed % 4],
    // `>>` coerces to a signed int32, so any seed past 2^31 makes this index
    // negative and `pat` comes back undefined — the plate then renders with no
    // texture. That is what the live site does (it emits a literal "undefined"
    // class), so keep the signed shift: "fixing" it would change the artwork.
    pat: ["pt-a", "pt-b", "pt-c", "pt-d"][(seed >> 2) % 4],
    num: String((seed % 80) + 10),
    word: (word && word.length ? word : "BRZ").toUpperCase(),
    tag: variant === 1 ? "DROP 001" : "UNEMPLOYED",
    vert: variant === 1 ? "DROP 001" : "BEROZGAR",
  };
}
