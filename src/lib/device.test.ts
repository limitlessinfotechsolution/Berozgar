import { describe, expect, it } from "vitest";
import { describeDevice } from "@/lib/device";

const UA = {
  chromeWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  edgeWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
  chromeAndroid: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  samsungAndroid: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  chromeIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1",
  safariIpad: "Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
  safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0",
  operaWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 OPR/124.0.0.0",
  firefoxIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/141.0 Mobile/15E148 Safari/605.1.15",
};

describe("describeDevice", () => {
  it("names the browser and the system", () => {
    expect(describeDevice(UA.chromeWindows)).toBe("Chrome on Windows");
    expect(describeDevice(UA.edgeWindows)).toBe("Edge on Windows");
    expect(describeDevice(UA.chromeAndroid)).toBe("Chrome on Android");
    expect(describeDevice(UA.samsungAndroid)).toBe("Samsung Internet on Android");
    expect(describeDevice(UA.safariIphone)).toBe("Safari on iPhone");
    expect(describeDevice(UA.chromeIphone)).toBe("Chrome on iPhone");
    expect(describeDevice(UA.firefoxIphone)).toBe("Firefox on iPhone");
    expect(describeDevice(UA.safariIpad)).toBe("Safari on iPad");
    expect(describeDevice(UA.safariMac)).toBe("Safari on Mac");
    expect(describeDevice(UA.firefoxLinux)).toBe("Firefox on Linux");
    expect(describeDevice(UA.operaWindows)).toBe("Opera on Windows");
  });

  it("admits what it can't tell — including sessions that recorded the storefront server", () => {
    expect(describeDevice(null)).toBe("Unknown device");
    expect(describeDevice("")).toBe("Unknown device");
    expect(describeDevice("node")).toBe("Unknown device");
    expect(describeDevice("undici")).toBe("Unknown device");
  });
});
