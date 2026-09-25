import { forwardPost } from "@/lib/erp-proxy";

/* Newsletter and drop-waitlist sign-ups → ERP POST /api/public/v1/newsletter. */
export async function POST(request: Request) {
  return forwardPost(request, "/newsletter");
}
