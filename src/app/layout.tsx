import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { CatalogueProvider } from "@/components/catalogue-provider";
import { SessionProvider } from "@/components/session-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { QuickSheet } from "@/components/quick-sheet";
import { StoreSettingsProvider } from "@/components/store-settings-provider";
import { getCatalogueState } from "@/lib/catalogue";
import { getShippingRule } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  /* Without this, the OG image routes resolve to relative URLs that crawlers can't fetch. */
  metadataBase: new URL(SITE_URL),
  title: "BEROZGAR — Unemployed For A Reason.",
  description: "Premium Indian streetwear. Drop culture, no noise. Drop 001 — The First Statement.",
  keywords: "Berozgar,streetwear,india,drop 001,oversized tee,heavyweight cotton",
};

/*
 * viewportFit: "cover" is what makes env(safe-area-inset-*) resolve to anything.
 * Without it those values are 0, and #bnav's safe-area padding in globals.css was
 * a no-op — the fixed bottom nav sat under the home indicator on notched phones.
 *
 * Deliberately no maximumScale / userScalable: blocking pinch-zoom would stop
 * anyone enlarging the page to read it.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* One cached read of the ERP catalogue, shared with every client component.
     Deliberately the forgiving read: an ERP outage must not take down the legal
     pages, order tracking or the rest of the site along with the shop. */
  const [{ products, unavailable }, shipping] = await Promise.all([getCatalogueState(), getShippingRule()]);

  return (
    <html lang="en" className={`${archivo.variable} antialiased`} data-scroll-behavior="smooth">
      <body>
        <CatalogueProvider products={products} unavailable={unavailable}>
          <StoreSettingsProvider shipping={shipping}>
            <SessionProvider>
              <CartProvider>
                {/* dvh rather than the screen utility, which compiles to 100vh — on mobile
                    that is the largest viewport and leaves a dead scroll under short pages. */}
                <div className="brz-reset flex flex-col min-h-dvh">
                  <div id="grain" aria-hidden="true"></div>
                  <SiteHeader />
                  <main id="app" className="flex-1">{children}</main>
                  <SiteFooter />
                  <QuickSheet />
                </div>
              </CartProvider>
            </SessionProvider>
          </StoreSettingsProvider>
        </CatalogueProvider>
      </body>
    </html>
  );
}
