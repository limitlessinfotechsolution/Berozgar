"use client";

import { useState } from "react";

/*
 * A photo in the plate box, so every layout rule written for .plate still applies.
 *
 * If the photo fails (object storage down, a deleted file, a stale URL) it swaps
 * to `fallback` — the product's typographic plate — instead of the browser's
 * broken-image icon with alt text spilling over the card's tags.
 */
export function PhotoPlate({
  src,
  label,
  className = "",
  fallback,
}: {
  src: string;
  label: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed && fallback) return <>{fallback}</>;

  return (
    <div className={`plate pimg ${className}`.trim()}>
      {/* Plain <img>: images come from object storage at a host set per environment. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </div>
  );
}
