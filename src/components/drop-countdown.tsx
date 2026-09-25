"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/*
 * Time to a drop's launch, ticking each second. At zero it asks the server for
 * the page again — the ERP starts listing the products at the same moment, so
 * the refresh shows them. Renders nothing until mounted (the time is "now").
 */
export function DropCountdown({ launchAt }: { launchAt: string }) {
  const router = useRouter();
  const target = Date.parse(launchAt);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const left = now === null ? null : Math.max(0, target - now);
  useEffect(() => {
    if (left === 0) router.refresh();
  }, [left, router]);

  if (left === null) return <div style={{ height: "64px" }} aria-hidden="true" />;
  if (left === 0) return <p className="cap">LIVE NOW — LOADING THE DROP…</p>;

  const s = Math.floor(left / 1000);
  const parts: [string, string][] = [
    [String(Math.floor(s / 86400)), "DAYS"],
    [pad(Math.floor((s % 86400) / 3600)), "HRS"],
    [pad(Math.floor((s % 3600) / 60)), "MIN"],
    [pad(s % 60), "SEC"],
  ];

  return (
    <div role="timer" aria-live="off" style={{ display: "flex", gap: "clamp(14px,4vw,28px)", marginTop: "26px" }}>
      {parts.map(([value, label]) => (
        <div key={label}>
          <div className="d-md num">{value}</div>
          <div className="cap" style={{ opacity: 0.6, marginTop: "4px" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
