"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PHOTO_LIMITS,
  RESOLUTION_COPY,
  RETURN_REASONS,
  buildReturnFormData,
  compressImage,
  returnErrorMessage,
} from "@/lib/returns";
import type { ReturnReason, ReturnResolution, TrackedOrder } from "@/lib/tracking";

/*
 * The claim form. REQUEST RETURN opens it on a refund, REQUEST EXCHANGE on a
 * free remake; either can be switched here. Photos are shrunk in the browser
 * before upload (compressImage) — the ERP checks them again.
 */
export function ReturnRequestModal({
  order,
  phone,
  initialResolution,
  onClose,
  onSubmitted,
}: {
  order: TrackedOrder;
  phone: string;
  initialResolution: ReturnResolution;
  onClose: () => void;
  onSubmitted: (returnNumber: string) => void;
}) {
  const claimable = order.items.filter((i) => i.claimable > 0);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    claimable.length === 1 && claimable[0] ? { [claimable[0].id]: claimable[0].claimable } : {},
  );
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [resolution, setResolution] = useState<ReturnResolution>(initialResolution);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const previews = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !sending) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, sending]);

  const units = Object.values(quantities).reduce((n, q) => n + q, 0);

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const next = [...photos, ...Array.from(list).filter((f) => f.type.startsWith("image/"))].slice(0, PHOTO_LIMITS.max);
    setPhotos(next);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (units === 0) return setError("Choose the item(s) with the problem.");
    if (!reason) return setError("Tell us what's wrong.");
    if (description.trim().length < 10) return setError("Describe the problem in a sentence or two.");
    if (photos.length < PHOTO_LIMITS.min) return setError("Add at least one photo — the fault, the whole item and the shipping label help most.");

    setSending(true);
    try {
      const compressed = await Promise.all(photos.map((p) => compressImage(p)));
      const tooBig = compressed.find((b) => b.size > PHOTO_LIMITS.maxBytes);
      if (tooBig) {
        setError("One of the photos is still over 5 MB. Try a smaller photo.");
        return;
      }
      const res = await fetch(`/api/orders/${encodeURIComponent(order.orderNumber)}/returns`, {
        method: "POST",
        body: buildReturnFormData({ phone, reason, resolution, description, quantities, photos: compressed }),
      });
      const body = (await res.json().catch(() => null)) as { returnNumber?: string; error?: string; message?: string; details?: { code?: string } } | null;
      if (res.status === 201 && body?.returnNumber) {
        onSubmitted(body.returnNumber);
        return;
      }
      setError(returnErrorMessage(res.status, body));
    } catch {
      setError("Couldn't send your claim. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div id="modal" className="open" onClick={(e) => { if (e.target === e.currentTarget && !sending) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={RESOLUTION_COPY[resolution].title}>
        <button className="xbtn" style={{ position: "absolute", top: "10px", right: "10px" }} aria-label="Close" onClick={onClose} disabled={sending}>✕</button>
        <h3 className="h2" style={{ marginBottom: "6px" }}>{RESOLUTION_COPY[resolution].title}</h3>
        <p className="small mut" style={{ marginBottom: "20px" }}>ORDER #{order.orderNumber}</p>

        <form onSubmit={submit} noValidate>
          <div className="fgrp">
            <h4>WHICH ITEM?</h4>
            {claimable.map((item) => (
              <div key={item.id} className="sumrow" style={{ alignItems: "center" }}>
                <span className="small">{item.name} — {item.size} / {item.colour}</span>
                <select
                  className="inp"
                  style={{ width: "90px", minHeight: "40px" }}
                  aria-label={`Quantity of ${item.name}`}
                  value={quantities[item.id] ?? 0}
                  onChange={(e) => setQuantities({ ...quantities, [item.id]: Number(e.target.value) })}
                >
                  {Array.from({ length: item.claimable + 1 }, (_, n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="fgrp">
            <h4>WHAT&apos;S WRONG?</h4>
            {RETURN_REASONS.map((r) => (
              <label key={r.value} className="ck">
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                {r.label}
              </label>
            ))}
          </div>

          <div className="fgrp">
            <h4>WHAT WOULD YOU LIKE?</h4>
            {(Object.keys(RESOLUTION_COPY) as ReturnResolution[]).map((r) => (
              <label key={r} className="ck" style={{ alignItems: "flex-start" }}>
                <input type="radio" name="resolution" value={r} checked={resolution === r} onChange={() => setResolution(r)} />
                <span>
                  <b>{RESOLUTION_COPY[r].title}</b>
                  <span className="small mut" style={{ display: "block" }}>{RESOLUTION_COPY[r].body}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="fgrp">
            <label className="fl" htmlFor="claim-desc">DESCRIBE THE PROBLEM</label>
            <textarea
              id="claim-desc"
              className="inp"
              style={{ minHeight: "96px", padding: "12px 16px" }}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. The print is cracked across the back after first wear."
            />
          </div>

          <div className="fgrp">
            <label className="fl" htmlFor="claim-photos">PHOTOS ({photos.length}/{PHOTO_LIMITS.max})</label>
            <p className="small mut" style={{ marginBottom: "8px" }}>The fault up close, the whole item, and the shipping label.</p>
            {photos.length < PHOTO_LIMITS.max && (
              <input
                id="claim-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                multiple
                onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }}
              />
            )}
            {previews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: "8px", marginTop: "10px" }}>
                {previews.map((url, i) => (
                  <div key={url} style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                    <img src={url} alt={`Photo ${i + 1}`} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", border: "1px solid var(--gy)" }} />
                    <button
                      type="button"
                      aria-label={`Remove photo ${i + 1}`}
                      onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: 2, right: 2, background: "var(--wt)", width: 22, height: 22, fontSize: 12 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="co-fail inline" role="alert" style={{ marginTop: 0, marginBottom: "16px" }}>
              <b className="cap">NOT SENT</b>
              <p className="small" style={{ marginTop: "4px" }}>{error}</p>
            </div>
          )}

          <button type="submit" className="btn" style={{ width: "100%" }} disabled={sending}>
            {sending ? "SENDING…" : "SEND CLAIM"}
          </button>
          <p className="small mut" style={{ marginTop: "12px" }}>
            We reply within 2 working days. Claims are for damaged, defective or wrong items — see our{" "}
            <Link href="/legal/refund" className="tlink">returns policy</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}
