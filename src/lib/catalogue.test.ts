import { describe, expect, it } from "vitest";
import { allowEmptyCatalogue, onCatalogueFailure, resolveErpUrl } from "./catalogue";

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

describe("resolveErpUrl", () => {
  const ERP = "https://erp.example.com";
  const BAKED = "https://baked.example.com";

  it("fails a deployed build when neither variable is set", () => {
    // Two Netlify builds silently dialled localhost instead and reported
    // ECONNREFUSED, which read as a network fault rather than missing config.
    expect(() => resolveErpUrl(undefined, undefined, true)).toThrow(/ERP_API_URL is not set/);
    expect(() => resolveErpUrl("", "   ", true)).toThrow(/ERP_API_URL is not set/);
  });

  it("falls back to localhost only in development", () => {
    expect(resolveErpUrl(undefined, undefined, false)).toBe("http://localhost:3001");
  });

  it("prefers the private runtime variable over the baked one", () => {
    // So switching back to a runtime-only variable is a config change, not a code change.
    expect(resolveErpUrl(ERP, BAKED, true)).toBe(ERP);
  });

  it("uses the baked value when no runtime variable exists", () => {
    expect(resolveErpUrl(undefined, BAKED, true)).toBe(BAKED);
    expect(resolveErpUrl("   ", BAKED, true)).toBe(BAKED);
  });

  it("keeps the origin only, dropping any path or trailing slash", () => {
    expect(resolveErpUrl("https://erp.example.com/", undefined, true)).toBe(ERP);
    expect(resolveErpUrl("https://erp.example.com/api/", undefined, true)).toBe(ERP);
    expect(resolveErpUrl("  https://erp.example.com  ", undefined, true)).toBe(ERP);
  });

  it("rejects a malformed or non-http origin in either environment", () => {
    expect(() => resolveErpUrl("erp.example.com", undefined, false)).toThrow(/not a valid URL/);
    expect(() => resolveErpUrl("ftp://erp.example.com", undefined, true)).toThrow(/must be http or https/);
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
