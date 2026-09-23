"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* TODO: forward to an error reporting service once one is configured. */
    console.error(error);
  }, [error]);

  return (
    <div className="page-fade">
      <div className="wrap">
        <div className="err">
          <p className="d-xl" style={{ opacity: 0.12 }}>500</p>
          <h1 className="h1" style={{ margin: "10px 0 6px" }}>SOMETHING BROKE.</h1>
          <p className="d-md" style={{ fontSize: "clamp(1.2rem,2.6vw,2rem)" }}>NOT YOUR FAULT.</p>
          {error.digest && (
            <p className="small mut" style={{ marginTop: "16px" }}>REFERENCE — {error.digest}</p>
          )}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "34px" }}>
            <button className="btn" onClick={reset}>TRY AGAIN</button>
            <Link href="/" className="btn btn-o">GO HOME</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
