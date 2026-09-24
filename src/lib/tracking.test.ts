import { describe, expect, it } from "vitest";
import { paymentState, statusDetail, stepTimes, trackStep, type TrackedOrder, type TrackedShipment } from "@/lib/tracking";

describe("trackStep", () => {
  it("maps the ERP's 12 statuses onto the six customer steps", () => {
    expect(trackStep("NEW")).toBe(0);
    expect(trackStep("CONFIRMED")).toBe(1);
    expect(trackStep("PRODUCTION")).toBe(1);
    expect(trackStep("QC")).toBe(1);
    expect(trackStep("PACKED")).toBe(2);
    expect(trackStep("SHIPPED")).toBe(3);
    expect(trackStep("DELIVERED")).toBe(5);
  });

  it("moves a shipped order to OUT FOR DELIVERY from its shipment", () => {
    expect(trackStep("SHIPPED", "IN_TRANSIT")).toBe(3);
    expect(trackStep("SHIPPED", "OUT_FOR_DELIVERY")).toBe(4);
    // A stale shipment status never drags a delivered order backwards.
    expect(trackStep("DELIVERED", "OUT_FOR_DELIVERY")).toBe(5);
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
    expect(stepTimes(order)).toEqual(["2026-09-19T10:00:00Z", "2026-09-19T11:00:00Z", null, null, null, null]);
  });

  it("stamps OUT FOR DELIVERY from the shipment's events", () => {
    const order = {
      history: [{ toStatus: "SHIPPED", changedAt: "2026-09-20T09:00:00Z" }],
      shipment: {
        events: [
          { status: "IN_TRANSIT", location: "Mumbai hub", occurredAt: "2026-09-20T18:00:00Z" },
          { status: "OUT_FOR_DELIVERY", location: "Andheri", occurredAt: "2026-09-21T08:00:00Z" },
        ],
      },
    } as TrackedOrder;
    expect(stepTimes(order)[3]).toBe("2026-09-20T09:00:00Z");
    expect(stepTimes(order)[4]).toBe("2026-09-21T08:00:00Z");
  });
});

describe("statusDetail with a shipment", () => {
  const shipment = (status: TrackedShipment["status"], location: string | null) =>
    ({ status, events: [{ status, location, occurredAt: "2026-09-20T18:00:00Z" }] }) as TrackedShipment;

  it("says where a parcel in transit last was", () => {
    expect(statusDetail("SHIPPED", shipment("IN_TRANSIT", "Mumbai hub"))).toBe("IN TRANSIT — MUMBAI HUB");
    expect(statusDetail("SHIPPED", shipment("IN_TRANSIT", null))).toBe("IN TRANSIT");
  });

  it("flags a failed delivery attempt", () => {
    expect(statusDetail("SHIPPED", shipment("FAILED", null))).toBe("DELIVERY ATTEMPT FAILED");
  });
});

describe("paymentState", () => {
  it("reads no payment row as cash on delivery", () => {
    expect(paymentState({ payment: null })).toBe("PAY ON DELIVERY");
  });

  it("distinguishes paid from pending and failed", () => {
    expect(paymentState({ payment: { method: "UPI", status: "PAID" } })).toBe("PAID");
    expect(paymentState({ payment: { method: "UPI", status: "PENDING" } })).toBe("PAYMENT PENDING");
    expect(paymentState({ payment: { method: "UPI", status: "FAILED" } })).toBe("PAYMENT PENDING");
  });
});
