import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site";

describe("resolveSiteUrl", () => {
  it("fails a production build when the origin is missing", () => {
    expect(() => resolveSiteUrl(undefined, true)).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
    expect(() => resolveSiteUrl("", true)).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
    expect(() => resolveSiteUrl("   ", true)).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
  });

  it("falls back to localhost in development", () => {
    expect(resolveSiteUrl(undefined, false)).toBe("http://localhost:3003");
  });

  it("rejects a malformed or non-http origin in either environment", () => {
    expect(() => resolveSiteUrl("berozgar.com", false)).toThrow(/not a valid URL/);
    expect(() => resolveSiteUrl("ftp://berozgar.com", true)).toThrow(/must be http or https/);
  });

  it("keeps the origin only, dropping any path or trailing slash", () => {
    expect(resolveSiteUrl("https://berozgar.com/", true)).toBe("https://berozgar.com");
    expect(resolveSiteUrl("https://berozgar.com/shop", true)).toBe("https://berozgar.com");
    expect(resolveSiteUrl("  https://berozgar.com  ", true)).toBe("https://berozgar.com");
  });
});
