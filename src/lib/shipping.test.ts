import { describe, expect, it } from "vitest";
import { DEFAULT_SHIPPING, standardShippingMinor, toShippingRule } from "@/lib/shipping";

describe("toShippingRule", () => {
  it("reads the ERP's decimal strings as paise", () => {
    expect(toShippingRule({ shipping: { freeFrom: "1499.00", standard: "79.00", express: "149.50" } })).toEqual({
      freeFromMinor: 149900,
      standardMinor: 7900,
      expressMinor: 14950,
    });
  });

  it("falls back per field when the ERP is missing or wrong", () => {
    expect(toShippingRule(null)).toEqual(DEFAULT_SHIPPING);
    expect(toShippingRule({ shipping: { freeFrom: "abc", standard: "50.00" } })).toEqual({
      ...DEFAULT_SHIPPING,
      standardMinor: 5000,
    });
  });
});

describe("standardShippingMinor", () => {
  it("is free at the threshold, charged a paisa below it", () => {
    expect(standardShippingMinor(99900, DEFAULT_SHIPPING)).toBe(0);
    expect(standardShippingMinor(99860, DEFAULT_SHIPPING)).toBe(9900);
  });
});
