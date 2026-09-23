"use client";

/*
 * Replaces the root layout when the layout itself fails, so it must render its
 * own <html>/<body> and cannot rely on globals.css being applied.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#000",
          fontFamily: "Archivo, system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <p style={{ fontSize: "clamp(3rem,10vw,7rem)", fontWeight: 900, opacity: 0.12, margin: 0 }}>500</p>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.4rem)", fontWeight: 800, textTransform: "uppercase", margin: "10px 0" }}>
            SOMETHING BROKE.
          </h1>
          <p style={{ color: "#777", fontSize: "14px" }}>BEROZGAR — UNEMPLOYED FOR A REASON.</p>
          {error.digest && (
            <p style={{ color: "#777", fontSize: "12px", marginTop: "12px" }}>REFERENCE — {error.digest}</p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "28px",
              minHeight: "52px",
              padding: "0 32px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              border: "1px solid #000",
              background: "#000",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  );
}
