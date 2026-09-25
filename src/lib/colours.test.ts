import { describe, expect, it } from "vitest";
import { isLight, swatchFor } from "@/lib/colours";

describe("swatchFor", () => {
  it("matches names regardless of case, hyphens and spacing", () => {
    expect(swatchFor("black")).toBe("#111111");
    expect(swatchFor("Navy-Blue")).toBe("#1c2541");
    expect(swatchFor("  heather   grey ")).toBe("#b5b5b2");
  });

  it("never guesses an unknown colour", () => {
    expect(swatchFor("GALAXY PRINT")).toBeNull();
  });
});

describe("isLight", () => {
  it("flags swatches that need an outline", () => {
    expect(isLight("#ffffff")).toBe(true);
    expect(isLight("#111111")).toBe(false);
  });
});
