import { describe, expect, it } from "vitest";
import { plateFor } from "./plate";

const PATTERNS = ["pt-a", "pt-b", "pt-c", "pt-d"];
const TONES = ["t0", "t1", "t2", "t3"];

/*
 * plateFor generates every "image" on the site, so a silent failure here shows up
 * as blank artwork rather than an error. Both cases below were real: five of the
 * thirteen slugs in the catalogue and editorial data rendered with no texture,
 * and a product's gallery mixed tones so it read as five different products.
 */

describe("plateFor", () => {
  it("always returns a real pattern, even for a hash above 2^31", () => {
    // "bz-ts-classic" hashes to 3867145177. A signed >> made the index negative
    // and pat came back undefined, so the plate rendered as a flat block.
    for (let variant = 0; variant < 5; variant++) {
      const plate = plateFor("bz-ts-classic", "CLASSIC", variant);
      expect(PATTERNS).toContain(plate.pat);
    }
  });

  it("gives every slug a pattern and a tone", () => {
    const slugs = ["bz-ts-classic", "bz-ts-premium", "bz-ts-dryfit", "inside-drop-001", "a", "", "x".repeat(64)];
    for (const slug of slugs) {
      const plate = plateFor(slug);
      expect(PATTERNS).toContain(plate.pat);
      expect(TONES).toContain(plate.tone);
    }
  });

  it("keeps one tone across a product's variants", () => {
    // A gallery is several views of one garment, not several products.
    const tones = [0, 1, 2, 3, 4].map((v) => plateFor("bz-ts-classic", "CLASSIC", v).tone);
    expect(new Set(tones).size).toBe(1);
  });

  it("still varies the plate between variants", () => {
    // Tone is shared, but the slides must not be identical.
    const plates = [0, 1, 2, 3, 4].map((v) => plateFor("bz-ts-classic", "CLASSIC", v));
    expect(new Set(plates.map((p) => p.num)).size).toBeGreaterThan(1);
  });

  it("is stable for a given slug, so a plate does not change between renders", () => {
    expect(plateFor("bz-ts-oversized", "OVERSIZED", 2)).toEqual(plateFor("bz-ts-oversized", "OVERSIZED", 2));
  });

  it("falls back to BRZ when a product has no word", () => {
    expect(plateFor("bz-ts-classic").word).toBe("BRZ");
    expect(plateFor("bz-ts-classic", "").word).toBe("BRZ");
    expect(plateFor("bz-ts-classic", "classic").word).toBe("CLASSIC");
  });
});
