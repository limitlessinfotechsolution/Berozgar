import { describe, expect, it } from "vitest";
import { statusDetail, stepTimes, trackStep, type TrackedOrder } from "@/lib/tracking";

describe("trackStep", () => {
  it("maps the ERP's 12 statuses onto the five customer steps", () => {
    expect(trackStep("NEW")).toBe(0);
    expect(trackStep("CONFIRMED")).toBe(1);
    expect(trackStep("PRODUCTION")).toBe(1);
    expect(trackStep("QC")).toBe(1);
    expect(trackStep("PACKED")).toBe(2);
    expect(trackStep("SHIPPED")).toBe(3);
    expect(trackStep("DELIVERED")).toBe(4);
  });

  it("treats cancelled and returned as off the timeline", () => {
    expect(trackStep("CANCELLED")).toBe(-1);
    expect(trackStep("RETURNED")).toBe(-1);
  });

  it("labels internal production states for the customer", () => {
    expect(statusDetail("AWAITING_APPROVAL")).toBe("IN PRODUCTION");
    expect(statusDetail("SHIPPED")).toBeNull();
  });
});

describe("stepTimes", () => {
  it("stamps each step with the first time the order reached it", () => {
    const order = {
      history: [
        { toStatus: "NEW", changedAt: "2026-09-19T10:00:00Z" },
        { toStatus: "CONFIRMED", changedAt: "2026-09-19T11:00:00Z" },
        { toStatus: "PRODUCTION", changedAt: "2026-09-19T12:00:00Z" },
      ],
    } as TrackedOrder;
    expect(stepTimes(order)).toEqual(["2026-09-19T10:00:00Z", "2026-09-19T11:00:00Z", null, null, null]);
  });
});
