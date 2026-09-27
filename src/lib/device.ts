/*
 * "Chrome on Android" from a user-agent string, for the account's list of signed-in
 * devices. Order matters: Edge, Opera and Samsung Internet also say "Chrome", and
 * nearly everything says "Safari". Sessions created before the storefront forwarded
 * the browser recorded its own fetch ("node", "undici") and read as Unknown device.
 */

const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Version\/[\d.]+.*Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/CrOS/, "ChromeOS"],
  [/Macintosh|Mac OS X/, "Mac"],
  [/Linux/, "Linux"],
];

const first = (list: [RegExp, string][], ua: string) => list.find(([re]) => re.test(ua))?.[1] ?? null;

export function describeDevice(userAgent: string | null | undefined): string {
  if (!userAgent || !userAgent.startsWith("Mozilla/")) return "Unknown device";
  const browser = first(BROWSERS, userAgent);
  const system = first(SYSTEMS, userAgent);
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? (system ? `${system} device` : "Unknown device");
}
