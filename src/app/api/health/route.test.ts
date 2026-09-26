import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const fetchMock = vi.fn();

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.stubEnv("ERP_API_URL", "http://erp.test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is 200 when the ERP answers its health check", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, erp: "up" });
    expect(fetchMock.mock.calls[0]![0]).toBe("http://erp.test/api/v1/health");
  });

  it("is 503 when the ERP is down or unhealthy, so a monitor alarms", async () => {
    fetchMock.mockRejectedValue(new Error("timeout"));
    expect((await GET()).status).toBe(503);
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, erp: "down" });
  });
});
