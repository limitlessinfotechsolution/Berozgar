import { describe, expect, it } from "vitest";
import { allowEmptyCatalogue, onCatalogueFailure } from "./catalogue";

/*
 * These two decide whether an unreachable ERP fails a build or quietly ships an
 * empty shop. A deploy was published with no products because that distinction
 * did not exist, so the guard is only worth having if it provably throws.
 */

describe("onCatalogueFailure", () => {
  it("fails a production build so the last good deploy keeps serving", () => {
    expect(onCatalogueFailure(true, false)).toBe("throw");
  });

  it("degrades to an empty catalogue in development", () => {
    // Working on the storefront without running the whole ERP stack must stay possible.
    expect(onCatalogueFailure(false, false)).toBe("empty");
  });

  it("honours the escape hatch in production — this is what CI relies on", () => {
    expect(onCatalogueFailure(true, true)).toBe("empty");
  });

  it("never throws in development, escape hatch or not", () => {
    expect(onCatalogueFailure(false, true)).toBe("empty");
  });
});

describe("allowEmptyCatalogue", () => {
  it("treats unset and blank as not allowed", () => {
    expect(allowEmptyCatalogue(undefined)).toBe(false);
    expect(allowEmptyCatalogue("")).toBe(false);
    expect(allowEmptyCatalogue("   ")).toBe(false);
  });

  it("accepts the values a CI config actually writes", () => {
    expect(allowEmptyCatalogue("1")).toBe(true);
    expect(allowEmptyCatalogue("true")).toBe(true);
    expect(allowEmptyCatalogue("TRUE")).toBe(true);
    expect(allowEmptyCatalogue(" 1 ")).toBe(true);
  });

  it("does not treat other truthy-looking strings as permission", () => {
    // "0" and "false" are the values someone writes meaning to turn this OFF.
    expect(allowEmptyCatalogue("0")).toBe(false);
    expect(allowEmptyCatalogue("false")).toBe(false);
    expect(allowEmptyCatalogue("yes")).toBe(false);
  });
});
