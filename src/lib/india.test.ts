import { describe, expect, it } from "vitest";
import { INDIAN_STATES, matchState } from "@/lib/india";
import { isIndianMobile, toNationalMobile } from "@/lib/phone";

describe("INDIAN_STATES", () => {
  it("has the 28 states and 8 union territories, spelt as the ERP stores them", () => {
    expect(INDIAN_STATES).toHaveLength(36);
    const names = INDIAN_STATES.map((s) => s.name);
    // The ones easiest to get subtly wrong — the ERP rejects anything else.
    for (const name of ["Andaman and Nicobar Islands", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Jammu and Kashmir", "Puducherry", "Odisha"]) {
      expect(names).toContain(name);
    }
  });
});

describe("matchState", () => {
  it("opens a saved address on the right option however it was written", () => {
    expect(matchState("MH")?.name).toBe("Maharashtra");
    expect(matchState(" maharashtra ")?.name).toBe("Maharashtra");
    expect(matchState("Orissa")?.name).toBe("Odisha");
    expect(matchState("TG")?.name).toBe("Telangana");
    expect(matchState("Andaman And Nicobar Islands")?.name).toBe("Andaman and Nicobar Islands");
  });

  it("returns nothing it can't place, so the shopper chooses", () => {
    expect(matchState("Narnia")).toBeNull();
    expect(matchState("")).toBeNull();
    expect(matchState(null)).toBeNull();
  });
});

describe("toNationalMobile", () => {
  it("reduces pasted and prefixed numbers to the 10 national digits", () => {
    for (const raw of ["+91 98200 11223", "09820011223", "919820011223", "+91-98200-11223", "091 98200 11223", "98200 11223"]) {
      expect(toNationalMobile(raw)).toBe("9820011223");
    }
  });

  it("keeps a 10-digit number that happens to start with 91", () => {
    expect(toNationalMobile("9123456789")).toBe("9123456789");
  });

  it("never grows past 10 digits while typing", () => {
    expect(toNationalMobile("98200112239")).toBe("9820011223");
  });

  it("knows a valid mobile", () => {
    expect(isIndianMobile("9820011223")).toBe(true);
    expect(isIndianMobile("5820011223")).toBe(false);
    expect(isIndianMobile("982001122")).toBe(false);
  });
});
