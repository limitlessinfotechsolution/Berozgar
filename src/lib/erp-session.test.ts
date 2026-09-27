import { describe, expect, it } from "vitest";
import { erpHeaders } from "@/lib/erp-session";

describe("erpHeaders", () => {
  it("passes the shopper's browser on, so the ERP's device list can name it", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1";
    const headers = erpHeaders(new Request("http://shop.test/", { headers: { "user-agent": ua } }), "bzc_t");
    expect(headers["user-agent"]).toBe(ua);
    expect(headers.authorization).toBe("Bearer bzc_t");
  });

  it("caps it at the 300 characters the ERP keeps, and leaves it out when there is none", () => {
    const long = erpHeaders(new Request("http://shop.test/", { headers: { "user-agent": "x".repeat(400) } }));
    expect(long["user-agent"]).toHaveLength(300);
    expect(erpHeaders(new Request("http://shop.test/"))).not.toHaveProperty("user-agent");
  });
});
