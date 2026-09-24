import { describe, expect, it } from "vitest";
import { buildReturnFormData, claimBlockedMessage, returnErrorMessage } from "@/lib/returns";
import { withRecentOrder } from "@/lib/tracking";
import type { OrderReturns } from "@/lib/tracking";

const returns = (code: OrderReturns["code"], deadline: string | null = null): OrderReturns => ({
  eligible: code === "ok",
  code,
  deadline,
  windowDays: 7,
  requests: [],
});

describe("claimBlockedMessage", () => {
  it("says nothing when a claim can be raised", () => {
    expect(claimBlockedMessage(returns("ok"), (d) => d)).toBeNull();
  });

  it("names the closing date when the window has passed", () => {
    expect(claimBlockedMessage(returns("window_closed", "2026-09-17"), () => "17 SEP")).toContain("17 SEP");
  });
});

describe("buildReturnFormData", () => {
  it("sends only the lines with a quantity, as JSON", () => {
    const form = buildReturnFormData({
      phone: "9820011223",
      reason: "DAMAGED",
      resolution: "REFUND",
      description: "  Seam torn at the shoulder  ",
      quantities: { a: 1, b: 0 },
      photos: [new Blob(["x"], { type: "image/jpeg" })],
    });
    expect(JSON.parse(String(form.get("items")))).toEqual([{ orderItemId: "a", quantity: 1 }]);
    expect(form.get("description")).toBe("Seam torn at the shoulder");
    expect(form.getAll("photos")).toHaveLength(1);
  });
});

describe("returnErrorMessage", () => {
  it("explains the ERP's conflict codes", () => {
    expect(returnErrorMessage(409, { details: { code: "window_closed" } })).toMatch(/window/);
    expect(returnErrorMessage(409, { details: { code: "open_claim" } })).toMatch(/open claim/);
    expect(returnErrorMessage(404, null)).toMatch(/couldn't match/);
  });
});

describe("withRecentOrder", () => {
  it("keeps the newest first without duplicates", () => {
    const one = withRecentOrder([], "bz-1", "98200", new Date("2026-01-01"));
    const two = withRecentOrder(one, "BZ-2", "98201", new Date("2026-01-02"));
    const again = withRecentOrder(two, "BZ-1", "98209", new Date("2026-01-03"));
    expect(again.map((o) => o.id)).toEqual(["BZ-1", "BZ-2"]);
    expect(again[0]?.phone).toBe("98209");
  });
});
