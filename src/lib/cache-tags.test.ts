import { describe, expect, it } from "vitest";
import { acceptTag, orderTag, productTag, reviewTag } from "@/lib/cache-tags";

describe("cache tags", () => {
  it("writes scoped tags in one canonical case", () => {
    expect(orderTag("bz1042")).toBe("order:BZ1042");
    expect(reviewTag("BZ-TS-CLASSIC")).toBe("review:bz-ts-classic");
    expect(productTag("bz-ts-classic")).toBe("product:bz-ts-classic");
  });

  it("accepts broad tags and well-formed scoped tags, normalised to match the fetch", () => {
    expect(acceptTag("catalogue")).toBe("catalogue");
    expect(acceptTag("settings")).toBe("settings");
    expect(acceptTag("order:bz1042")).toBe("order:BZ1042");
    expect(acceptTag("review:BZ-TS-CLASSIC")).toBe("review:bz-ts-classic");
  });

  it("refuses anything else, so the secret can't be used to evict arbitrary keys", () => {
    for (const bad of ["", "everything", "order:", "order:a:b", "order:../x", "user:1", `order:${"x".repeat(65)}`, "Catalogue"]) {
      expect(acceptTag(bad)).toBeNull();
    }
  });
});
