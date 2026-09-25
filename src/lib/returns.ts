/*
 * Return & exchange claims (the ERP's POST /api/public/v1/orders/:n/returns, via
 * /api/orders/:id/returns). What can be claimed is set by the Return, Replacement
 * & Refund Policy (/legal/refund): damaged, defective or wrong items, within the
 * claim window after delivery, with photos. A size the customer chose is not a claim.
 */
import type { OrderReturns, ReturnReason, ReturnResolution, ReturnStatus } from "@/lib/tracking";

export const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: "DAMAGED", label: "ARRIVED DAMAGED" },
  { value: "DEFECTIVE", label: "PRINT OR MANUFACTURING DEFECT" },
  { value: "WRONG_ITEM", label: "WRONG ITEM, SIZE, COLOUR OR QUANTITY SENT" },
  { value: "NOT_AS_APPROVED", label: "PRINT DOESN'T MATCH THE APPROVED DESIGN" },
  { value: "MISSING_ITEM", label: "ITEM MISSING FROM THE PARCEL" },
];

export const RESOLUTION_COPY: Record<ReturnResolution, { title: string; body: string }> = {
  REFUND: { title: "RETURN & REFUND", body: "Refund to your original payment method." },
  REPLACEMENT: {
    title: "EXCHANGE",
    body: "We remake the same item — same print, size and colour — free. To change a size you chose, this isn't the route.",
  },
};

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "RECEIVED — UNDER REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "NOT ACCEPTED",
  RECEIVED: "ITEM RECEIVED",
  RESOLVED: "RESOLVED",
  CANCELLED: "WITHDRAWN",
};

/* Mirrors RETURN_PHOTO_LIMITS in the ERP's packages/validation. */
export const PHOTO_LIMITS = { min: 1, max: 5, maxBytes: 5_000_000 } as const;

/* Why the claim buttons are unavailable, in the order page's voice. Null when they are. */
export function claimBlockedMessage(returns: OrderReturns, formatDate: (iso: string) => string): string | null {
  switch (returns.code) {
    case "ok":
      return null;
    case "not_delivered":
      return "Returns and exchanges open once your order is delivered.";
    case "window_closed":
      return returns.deadline
        ? `The claim window for this order closed on ${formatDate(returns.deadline)}.`
        : "The claim window for this order has closed.";
    case "open_claim":
      return "You have a claim open on this order — we'll update you here.";
    case "nothing_left":
      return "Every item on this order already has a claim.";
  }
}

export interface ClaimDraft {
  phone: string;
  reason: ReturnReason;
  resolution: ReturnResolution;
  description: string;
  quantities: Record<string, number>;
  photos: Blob[];
}

/* The multipart body the ERP expects. Lines with quantity 0 are left out. */
export function buildReturnFormData(draft: ClaimDraft): FormData {
  const form = new FormData();
  // Empty for a signed-in shopper: the session proves the order instead.
  if (draft.phone) form.set("phone", draft.phone);
  form.set("reason", draft.reason);
  form.set("resolution", draft.resolution);
  form.set("description", draft.description.trim());
  form.set(
    "items",
    JSON.stringify(
      Object.entries(draft.quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
    ),
  );
  draft.photos.forEach((photo, i) => form.append("photos", photo, `photo-${i + 1}.jpg`));
  return form;
}

type ErpError = { error?: string; message?: string; details?: { code?: string } };

/* The ERP's answer turned into one sentence for the shopper. */
export function returnErrorMessage(status: number, body: ErpError | null): string {
  const code = body?.details?.code;
  if (status === 404) return "We couldn't match that order and phone number.";
  if (status === 429) return "Too many claims from this connection. Try again in an hour.";
  if (status === 413) return "Those photos are too large. Use fewer or smaller photos.";
  if (status === 503) return body?.message ?? "Photo uploads aren't available right now. Contact us with your photos instead.";
  if (status === 409) {
    if (code === "window_closed") return "The claim window for this order has closed.";
    if (code === "not_delivered") return "You can raise a claim once the order is delivered.";
    if (code === "open_claim") return "This order already has an open claim.";
    if (code === "not_cancellable") return "We're already handling this claim — contact us to change it.";
    return body?.message ?? "That claim can't be raised for this order.";
  }
  if (status === 422) return body?.message ?? "Check the form — something is missing or a photo isn't a JPEG, PNG or WebP.";
  return "Something went wrong. Try again in a moment.";
}

/*
 * Shrinks a photo to at most 1600px on the long side as a JPEG before upload —
 * phone photos are often 4–8 MB, well over the 5 MB limit. Also drops EXIF (and
 * with it the location a phone camera records). Falls back to the original file
 * when the browser can't decode it (e.g. HEIC outside Safari); the ERP then
 * checks it like any other upload.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    return blob ?? file;
  } catch {
    return file;
  }
}
