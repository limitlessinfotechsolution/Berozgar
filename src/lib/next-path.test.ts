import { describe, expect, it } from "vitest";
import { loginHref, safeNext } from "@/lib/next-path";

describe("safeNext", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/account/orders")).toBe("/account/orders");
    expect(safeNext("/account/orders/BZ-1?x=1")).toBe("/account/orders/BZ-1?x=1");
  });

  it("refuses anything a browser would resolve to another host", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "evil.com", "", null, undefined]) {
      expect(safeNext(bad)).toBe("/account");
    }
  });
});

describe("loginHref", () => {
  it("carries the path back through login, encoded", () => {
    expect(loginHref("/account/orders")).toBe("/login?next=%2Faccount%2Forders");
    expect(loginHref("//evil.com")).toBe("/login?next=%2Faccount");
  });
});
