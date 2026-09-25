import { forwardPost } from "@/lib/erp-proxy";

/* "Email me when it's back" → ERP POST /api/public/v1/stock-alerts. */
export async function POST(request: Request) {
  return forwardPost(request, "/stock-alerts");
}
