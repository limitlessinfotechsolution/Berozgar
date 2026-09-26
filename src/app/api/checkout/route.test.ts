import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

const { POST } = await import("./route");

const fetchMock = vi.fn();

function checkout(body: string) {
  return POST(
    new NextRequest("http://shop.test/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "bz_session=bzc_token" },
      body,
    }),
  );
}

function erpAnswers(status: number, body: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.stubEnv("ERP_API_URL", "http://erp.test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    revalidateTag.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("refuses a malformed body without calling the ERP", async () => {
    const res = await checkout("{not json");
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the order untouched with the session — it never adds a price", async () => {
    erpAnswers(201, { success: true, orderId: "BZ-1", grandTotal: "470.82", razorpay: null });
    const order = { items: [{ variantId: "v1", quantity: 1 }], payment: "cod" };
    const res = await checkout(JSON.stringify(order));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, orderId: "BZ-1", grandTotal: "470.82", razorpay: null });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://erp.test/api/public/v1/checkout");
    expect(JSON.parse(init.body)).toEqual(order);
    expect(init.headers.authorization).toBe("Bearer bzc_token");
    expect(init.headers["x-request-id"]).toBeTruthy();
    // Stock was allocated, so availability on the site must refresh.
    expect(revalidateTag).toHaveBeenCalledWith("catalogue", { expire: 0 });
  });

  it("passes the ERP's reason through, in words a shopper can act on", async () => {
    erpAnswers(422, { error: "validation_error", lines: [{ variantId: "v1", reason: "insufficient_stock", available: 1 }] });
    const res = await checkout(JSON.stringify({ items: [] }));
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ success: false, error: "One item only has 1 left." });

    erpAnswers(422, { error: "cod_unavailable", message: "Cash on delivery is available on orders up to ₹3,000." });
    expect((await (await checkout("{}")).json()).error).toBe("Cash on delivery is available on orders up to ₹3,000.");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("never reports an order when the ERP is down or answers without one", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const down = await checkout("{}");
    expect(down.status).toBe(502);
    expect((await down.json()).success).toBe(false);

    erpAnswers(200, { success: true });
    const noId = await checkout("{}");
    expect(noId.status).toBe(502);
    expect((await noId.json()).success).toBe(false);
  });
});
