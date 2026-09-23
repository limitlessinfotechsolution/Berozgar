import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BEROZGAR — Unemployed For A Reason.";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#000",
          color: "#fff",
          padding: "72px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 40, left: 56, fontSize: 340, fontWeight: 900, color: "#fff", opacity: 0.07 }}>
          001
        </div>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 10, opacity: 0.7 }}>DROP 001 — LIVE NOW</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 108, fontWeight: 900, lineHeight: 1, marginTop: 20 }}>
          <span>UNEMPLOYED</span>
          <span>FOR A REASON.</span>
        </div>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 8, opacity: 0.55, marginTop: 28 }}>
          BEROZGAR — EST. MUMBAI
        </div>
      </div>
    ),
    size
  );
}
