import { ImageResponse } from "next/og";
import { getCatalogue, getCatalogueProduct } from "@/lib/catalogue";
import { plateFor } from "@/lib/plate";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BEROZGAR product";

export async function generateStaticParams() {
  const products = await getCatalogue();
  return products.map((product) => ({ slug: product.slug }));
}

/* Mirrors the on-site plate tones so a shared link looks like the page it opens. */
const TONE_BG: Record<string, { bg: string; fg: string }> = {
  t0: { bg: "#181818", fg: "#ffffff" },
  t1: { bg: "#262626", fg: "#ffffff" },
  t2: { bg: "#F5F3EE", fg: "#000000" },
  t3: { bg: "#000000", fg: "#ffffff" },
};

export default async function ProductOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogueProduct(slug);

  const plate = plateFor(slug, product?.word, 0);
  const tone = TONE_BG[plate.tone] ?? TONE_BG.t0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: tone.bg,
          color: tone.fg,
          padding: "72px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 30, left: 56, fontSize: 340, fontWeight: 900, opacity: 0.08 }}>
          {plate.num}
        </div>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 10, opacity: 0.7 }}>
          {product?.categoryName ?? "BEROZGAR"}
        </div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 900, lineHeight: 1.05, marginTop: 18 }}>
          {product?.name ?? "BEROZGAR"}
        </div>
        {product && (
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, marginTop: 22 }}>
            ₹{product.price.toLocaleString("en-IN")}
          </div>
        )}
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 8, opacity: 0.55, marginTop: 26 }}>
          BEROZGAR — EST. MUMBAI
        </div>
      </div>
    ),
    size
  );
}
