import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { CatalogueProvider } from "@/components/catalogue-provider";
import { SessionProvider } from "@/components/session-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { QuickSheet } from "@/components/quick-sheet";
import { getCatalogue } from "@/lib/catalogue";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* One cached read of the ERP catalogue, shared with every client component. */
  const products = await getCatalogue();

  return (
    <html lang="en" className={`${archivo.variable} antialiased`} data-scroll-behavior="smooth">
      <body>
        <CatalogueProvider products={products}>
          <SessionProvider>
            <CartProvider>
              <div className="brz-reset flex flex-col min-h-screen">
                <div id="grain" aria-hidden="true"></div>
                <SiteHeader />
                <main id="app" className="flex-1">{children}</main>
                <SiteFooter />
                <QuickSheet />
              </div>
            </CartProvider>
          </SessionProvider>
        </CatalogueProvider>
      </body>
    </html>
  );
}
