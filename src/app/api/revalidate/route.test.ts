import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

const { POST } = await import("./route");

const SECRET = "s3cret-value-for-tests";

function call(body: unknown, secret: string | null = SECRET) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret !== null) headers["x-revalidate-secret"] = secret;
  return POST(new Request("http://localhost/api/revalidate", { method: "POST", headers, body: JSON.stringify(body) }));
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.stubEnv("REVALIDATE_SECRET", SECRET);
    revalidateTag.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("refuses a missing, wrong or different-length secret without touching the cache", async () => {
    for (const secret of [null, "wrong-value-same-len!!", "short", `${SECRET}x`]) {
      expect((await call({ tags: ["catalogue"] }, secret)).status).toBe(401);
    }
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refuses everything when the site has no secret configured", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    expect((await call({ tags: ["catalogue"] }, "")).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("400s when no tag is one it knows", async () => {
    const res = await call({ tags: ["everything", "user:1"] });
    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("expires broad and scoped tags, normalised and de-duplicated, and ignores the rest", async () => {
    const res = await call({ tags: ["catalogue", "order:bz1042", "order:BZ1042", "review:BZ-TS-CLASSIC", "nope", 7] });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ revalidated: ["catalogue", "order:BZ1042", "review:bz-ts-classic"] });
    expect(revalidateTag.mock.calls.map(([tag]) => tag)).toEqual(["catalogue", "order:BZ1042", "review:bz-ts-classic"]);
    expect(revalidateTag).toHaveBeenCalledWith("catalogue", { expire: 0 });
  });
});
