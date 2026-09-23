import type { NextConfig } from "next";

/*
 * The brand spec's sitemap uses flat policy URLs (/privacy, /terms, …) and the
 * site serves them under /legal/*. These redirects keep both working, so a link
 * printed on an invoice or shared a year ago still lands on the policy.
 */
const LEGAL_REDIRECTS: [string, string][] = [
  ["/privacy", "/legal/privacy"],
  ["/privacy-policy", "/legal/privacy"],
  ["/terms", "/legal/terms"],
  ["/terms-and-conditions", "/legal/terms"],
  ["/refund-policy", "/legal/refund"],
  ["/return-policy", "/legal/refund"],
  ["/cancellation-policy", "/legal/cancellation"],
  ["/shipping-policy", "/legal/shipping"],
  ["/cookies", "/legal/cookies"],
  ["/cookie-policy", "/legal/cookies"],
  ["/disclaimer", "/legal/disclaimer"],
  ["/grievance", "/legal/grievance"],
  ["/ip-policy", "/legal/ip"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return LEGAL_REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
