import { NextResponse } from "next/server";
import { getLegalIndex } from "@/lib/legal";

/*
 * Same-origin proxy for the published policy list, so the checkout page can
 * record which version the customer accepted without the browser ever seeing
 * ERP_API_URL (the same shape as the checkout and track proxies).
 */
export async function GET() {
  const documents = await getLegalIndex();
  return NextResponse.json({
    data: documents.map(({ slug, title, version }) => ({ slug, title, version })),
  });
}
