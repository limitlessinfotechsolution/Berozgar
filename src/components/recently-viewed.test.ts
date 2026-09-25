import { describe, expect, it } from "vitest";
import { pushRecent } from "@/components/recently-viewed";

describe("pushRecent", () => {
  it("puts the latest first, dedupes and caps", () => {
    expect(pushRecent(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
    expect(pushRecent(["a", "b"], "c", 2)).toEqual(["c", "a"]);
  });
});
