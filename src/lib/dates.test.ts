import { describe, expect, it } from "vitest";
import { formatDay, formatMonth, timeAgo, todayIso } from "@/lib/dates";

describe("dates", () => {
  it("formats a day and a month the Indian way", () => {
    expect(formatDay("2026-09-12T10:00:00Z")).toMatch(/^12 Sep/);
    expect(formatMonth("2026-01-05T10:00:00Z")).toMatch(/^Jan/);
    expect(formatDay(null)).toBe("");
    expect(formatDay("not a date")).toBe("");
  });

  it("says how long ago, in words", () => {
    const now = new Date("2026-09-27T12:00:00Z");
    expect(timeAgo("2026-09-27T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-09-27T10:00:00Z", now)).toBe("2 hours ago");
    expect(timeAgo("2026-09-26T12:00:00Z", now)).toBe("yesterday");
    expect(timeAgo("2026-09-13T12:00:00Z", now)).toBe("2 weeks ago");
  });

  it("gives today for a date input's max", () => {
    expect(todayIso(new Date(2026, 8, 7))).toBe("2026-09-07");
  });
});
