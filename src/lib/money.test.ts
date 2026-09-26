import { describe, expect, it } from "vitest";
import { formatDecimalINR, formatINR, toMinor } from "@/lib/money";

describe("toMinor", () => {
  it("parses ERP decimal strings exactly", () => {
    expect(toMinor("1499.00")).toBe(149900);
    expect(toMinor("1499.50")).toBe(149950);
    expect(toMinor("998.60")).toBe(99860);
    expect(toMinor("0.07")).toBe(7);
    expect(toMinor("12.5")).toBe(1250);
    expect(toMinor("999")).toBe(99900);
    expect(toMinor("-20.00")).toBe(-2000);
  });

  it("does not drift where a float would", () => {
    // parseFloat("1.15") * 100 is 114.99999999999999
    expect(toMinor("1.15")).toBe(115);
    expect(toMinor("4.35")).toBe(435);
  });

  it("rejects anything that isn't a 2dp decimal", () => {
    for (const bad of ["", "abc", "1.999", "1e3", "₹10", null, undefined]) expect(toMinor(bad)).toBeNull();
  });
});

describe("formatINR", () => {
  it("drops paise only when there are none", () => {
    expect(formatINR(149900)).toBe("₹1,499");
    expect(formatINR(149950)).toBe("₹1,499.50");
    expect(formatINR(105)).toBe("₹1.05");
    expect(formatINR(0)).toBe("₹0");
  });

  it("groups lakhs the Indian way", () => {
    expect(formatINR(12345600)).toBe("₹1,23,456");
  });

  it("formats decimal strings, unparseable as zero", () => {
    expect(formatDecimalINR("2948.82")).toBe("₹2,948.82");
    expect(formatDecimalINR(null)).toBe("₹0");
  });
});
