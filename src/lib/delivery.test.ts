import { describe, expect, it } from "vitest";
import { addWorkingDays, deliveryRange } from "@/lib/delivery";

// Thursday 24 Sep 2026, local time.
const thu = new Date(2026, 8, 24, 10, 0);

describe("addWorkingDays", () => {
  it("skips Sundays", () => {
    expect(addWorkingDays(thu, 2).getDate()).toBe(26); // Sat
    expect(addWorkingDays(thu, 3).getDate()).toBe(28); // Sun 27 skipped → Mon
  });

  it("returns the same day for zero", () => {
    expect(addWorkingDays(thu, 0).getDate()).toBe(24);
  });
});

describe("deliveryRange", () => {
  it("formats a window, collapsing a single day", () => {
    expect(deliveryRange([2, 3], thu)).toBe("SAT 26 SEP – MON 28 SEP");
    expect(deliveryRange([1, 1], thu)).toBe("FRI 25 SEP");
  });
});
