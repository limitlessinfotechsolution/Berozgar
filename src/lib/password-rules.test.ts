import { describe, expect, it } from "vitest";
import { passwordAcceptable, passwordRules } from "@/lib/password-rules";

describe("passwordRules", () => {
  it("ticks each rule as it is met", () => {
    expect(passwordRules("").map((r) => r.met)).toEqual([false, false, false]);
    expect(passwordRules("abcdefgh").map((r) => r.met)).toEqual([true, true, false]);
    expect(passwordRules("12345678").map((r) => r.met)).toEqual([true, false, true]);
  });

  it("accepts what the ERP accepts and nothing it refuses", () => {
    expect(passwordAcceptable("streetw3ar")).toBe(true);
    expect(passwordAcceptable("s3cret")).toBe(false); // too short
    expect(passwordAcceptable("onlyletters")).toBe(false);
    expect(passwordAcceptable("a1".repeat(65))).toBe(false); // 130 characters
  });
});
