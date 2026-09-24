# Storefront ↔ ERP Integration

**Status:** catalogue and orders are **live** (Sept 2026). The website reads products from the ERP,
admin edits reach the website within seconds, and checkout creates real ERP orders. Customer
accounts, online payment capture, coupons and reviews are still local. §0 describes what was
built; §1–§11 are the original design, kept for the decisions still open.

---

## 0. What is built

### Running locally

```bash
# ERP (../Berozgar)
docker compose -f docker/docker-compose.dev.yml up -d   # Postgres :5433, Redis, MinIO :9000/:9001
pnpm db:migrate && pnpm db:seed                          # includes 20260919000000_storefront_integration
pnpm dev                                                 # admin :3000, api :3001, portal :3002

# Storefront (this repo)
cp .env.local.example .env.local   # ERP_API_URL, REVALIDATE_SECRET
npm run dev                        # :3003 (admin owns :3000)
```

`REVALIDATE_SECRET` here must equal `STOREFRONT_REVALIDATE_SECRET` in `apps/admin/.env`, and
`apps/api/.env` needs `S3_PUBLIC_URL` (e.g. `http://localhost:9000/berozgar-files`). Buckets created
before the compose file gained its policy step need `node --env-file=../../apps/api/.env
scripts/public-product-images.mjs` once, from `packages/storage`.

### How a change travels

| Direction | Path |
|---|---|
| Admin → site (catalogue) | Admin server action → API → Postgres, then `apps/admin/lib/storefront.ts` `notifyStorefront("catalogue")` → `POST :3003/api/revalidate` → `revalidateTag("catalogue", { expire: 0 })`. Next page view re-reads `GET /api/public/v1/products`. Hooked into product create/update, variant add, stock set/adjust, image upload/remove, category create. |
| Admin → site (tracking) | Order status change → `notifyStorefront("orders")` → tracking cache expires. |
| Site → admin (orders) | `/checkout` → `POST :3003/api/checkout` (server proxy) → `POST /api/public/v1/checkout` → `createOrder()` with `source: "web"`. Appears in admin Orders at `NEW`. |
| Fallback | Every storefront read also has a 60 s (catalogue) / 30 s (tracking) revalidate window, so a missed hook self-heals. |

### Public API (`apps/api/app/api/public/v1`, no `withPermission`, rate-limited per IP)

| Route | Notes |
|---|---|
| `GET products`, `GET products/:slug` | Active only; inactive → 404. Field allow-list excludes `costPrice`, `gstRate`, `hsnCode`, `minStock`. |
| `GET categories` | Only categories with an active product. |
| `POST checkout/quote` | Server price incl. GST + per-line stock problems. Same pricing function and GST-rate rule as `createOrder`. |
| `POST checkout` | Zod `.strict()` — a client `unitPrice`/total is rejected. Find-or-create `Customer` by normalised phone; shipping `CustomerAddress`; `createOrder`. COD: no payment row; UPI/cards/net banking/wallets: `Payment{PENDING}` per §9. `publicToken` limit (30/min). |
| `GET orders/:number?phone=` | Tracking. Wrong phone and unknown order are the same 404. |

Image uploads (admin only) follow handbook §9: `POST /api/v1/uploads/presign` → browser PUT to MinIO
→ `POST /api/v1/uploads/confirm`; `DELETE /api/v1/products/:id/images/:imageId`. Only
`products/*` is public-read; designs and invoices stay private.

### Rules decided while building

- **Slug = lower-cased SKU** (`BZ-TS-CLASSIC` → `bz-ts-classic`). SKU is already unique; no column.
- **Prices are GST-exclusive.** ERP `basePrice` is pre-GST, so the site shows "+ GST", and the review
  step shows the ERP quote. The site never sums a total itself.
- **Merchandising the ERP doesn't hold is shown as absent, not invented**: no sale price, badges,
  GSM/fabric/fit, reviews or drop tags. The UI hides those rows.
- **Collections = ERP categories** (`/collections/t-shirts`); `/collections/drop-001` lists everything.
- **Customer-facing status** (`src/lib/tracking.ts`): NEW → ORDERED; CONFIRMED…QC → CONFIRMED ("in
  production"); PACKED; SHIPPED; DELIVERED; CANCELLED/RETURNED are terminal. No OUT FOR DELIVERY
  until shipments are wired (§8).

### Still open

- **Stock is checked, never decremented.** Nothing in the ERP allocates stock on order today, so
  two shoppers can buy the last unit. Needs an `ORDER_ALLOCATION` inventory transaction inside
  `createOrder` (or at CONFIRMED) — an ERP-wide decision, not a storefront one.
- **No online payment capture.** Non-COD orders say so at checkout and on the success page.
- **Customer login (§6), coupons, reviews** are still local. The admin's coupon/review screens write
  a `SystemSetting` JSON blob, not the `Coupon`/`Review` tables — fix that before wiring them.
- **Rate limits key on `x-forwarded-for`**, which a client can set. Fine behind a trusted proxy that
  overwrites it; not fine exposed directly.
- Journal/lookbook "shop the look" referenced the old fixture products; those blocks hide until
  they're pointed at ERP product ids.

---

## 1. What the two sides actually are

| | `Berozgar Web` (this repo) | `../Berozgar` |
|---|---|---|
| Purpose | D2C storefront | Made-to-order manufacturing ERP |
| Stack | Next 16, React 19, Tailwind 4 | Next 14, Prisma, Postgres, Redis/BullMQ, turbo |
| Data | hardcoded in `src/lib/*.ts` | Postgres via `packages/database` |
| Auth | `localStorage` mock (`src/components/session-provider.tsx`) | NextAuth, staff only |

The ERP's pipeline is `design → approval → production → QC → packing → shipment`. Its handbook
architecture diagram does list "Customer (Web / WhatsApp)" as a client, so a storefront is
anticipated — it just hasn't been built.

### Four blockers

1. **No public API.** All 54 endpoints under `/api/v1` are permission-gated —
   `apps/api/app/api/v1/products/route.ts` opens `withPermission("products.view", …)` and the pattern
   repeats. Nothing is callable without a staff session.
2. **`customer-portal` is not a storefront.** Three pages: landing, `orders/[id]`,
   `design-approval/[token]`. It serves the approval flow.
3. **Customers have no credentials.** `passwordHash` is on the staff `User` model only. `Customer` is
   `name` + `phone` (required) + `email?`.
4. **Only one app may mint a session.** `apps/api/.../auth/session/route.ts`: NextAuth lives on the
   admin origin and "a session cookie may only be issued by the app that owns the NextAuth
   configuration". The API app verifies JWTs and is stateless.

---

## 2. Conventions the storefront client must match

From `apps/api/lib/http.ts` and handbook §11. These are not negotiable — they are how the API
already behaves.

- **List envelope:** `{ data, page, pageSize, total, totalPages }`. Query is
  `?page=&pageSize=&search=&sort=`, `pageSize` capped at 100, `?sort=-createdAt` checked against a
  column allow-list.
- **Money is a string, not a number.** `serialiseDecimal()` emits `.toFixed(2)` deliberately: *"2948.82
  as a JSON number is a float again, and the point of the Decimal columns was to avoid that."*
  **This repo currently types `price: number`** (`src/lib/products.ts`). The client layer must parse
  into minor units or a Decimal type and never let money touch a float. Handbook §11 repeats the rule.
- **Errors:** `{ error: "not_found", resource }`, `{ error: "bad_request", message, details }`.
  Internal messages and stack traces never reach the client.
- JSON camelCase, paths kebab-case, TypeScript strict, no `any`.
- Rate limiting exists — `checkRateLimit` / `RATE_LIMITS` in `packages/auth`. A public surface must
  use it; unauthenticated endpoints are the ones that need it most.
- **CORS:** `apps/api/middleware.ts` echoes an allow-list built from `NEXTAUTH_URL`,
  `ADMIN_BASE_URL` and `ALLOWED_ORIGINS`, never `*` (a wildcard is incompatible with credentialed
  requests). The storefront origin gets added to `ALLOWED_ORIGINS`.

---

## 3. Field gap

Our `Product` (`src/lib/products.ts`) against Prisma `Product` + `ProductVariant`:

| Storefront field | Backend | Notes |
|---|---|---|
| `slug` | ✗ | only `sku` and a cuid `id`; SEO URLs need a unique slug |
| `compareAt` | ✗ | no sale price anywhere on the model |
| `badges` | ✗ | NEW / BEST SELLER are merchandising state |
| `gsm`, `fabric`, `fit` | ✗ | the PDP leads on these |
| `drop` / collection | ✗ | **no Collection model** |
| `word`, `tone`, `accent` | ✗ | plate artwork params; `ProductImage` supersedes them once real photography exists |
| `colors[]`, `sizes[]`, `oos[]` | ✅ | derive from `ProductVariant{size, colour, stock}` |
| `rating`, `reviewCount` | ✅ | aggregate from `Review` |
| `price` | ✅ | `basePrice` — but as a string, see §2 |
| articles, looks | ✗ | no models |
| wishlist | ✗ | no model |

`/collections/drop-001`, `/journal/*`, `/lookbook/*` and the wishlist have nothing to bind to today.

**Recommendation:** `Collection` and `Wishlist` become backend models — they are commerce state the
admin must control. Journal and Lookbook stay editorial content in this repo; they are brand
storytelling with no ERP process behind them, and putting them in Postgres buys nothing.

---

## 4. Schema additions

Each needs a migration (handbook §11: a migration accompanies any `schema.prisma` change).

- `Product.slug String @unique` — backfill from `name`.
- `Product.compareAtPrice Decimal? @db.Decimal(10,2)`.
- `Product.gsm`, `.fabric`, `.fit` — apparel attributes.
- Merchandising flags for badges (or a derived rule: NEW = `createdAt` window, BEST SELLER = order
  volume; decide which, because a hardcoded flag and a derived rule drift apart).
- `Collection` + `CollectionProduct` join.
- `Wishlist` keyed by `customerId`.

---

## 5. Public surface — `/api/public/v1`

A **separate namespace**, so `withPermission` is never loosened on the admin surface and the two can
be rate-limited and cached independently.

### Catalogue (unauthenticated, cacheable)

```
GET /api/public/v1/products?page=&pageSize=&category=&collection=&sort=
GET /api/public/v1/products/:slug
GET /api/public/v1/categories
GET /api/public/v1/collections
GET /api/public/v1/collections/:slug
GET /api/public/v1/products/:slug/reviews     # ReviewStatus approved only
```

Field allow-list is mandatory. **Never exposed:** `costPrice`, `gstRate`, `hsnCode`, `minStock`,
supplier and purchase-order data, `AuditLog`, anything under `packages/reports`. Exposing `costPrice`
on a storefront product would publish the business's margins.

Stock should be exposed as a band (`in_stock` / `low` / `out`), not a raw count — competitors read
exact inventory numbers.

### Customer auth

```
POST /api/public/v1/auth/register
POST /api/public/v1/auth/login
GET  /api/public/v1/auth/session
POST /api/public/v1/auth/logout
```

See §6 — the mechanism is an open decision.

### Commerce

```
POST /api/public/v1/cart/validate     # re-check price + stock server-side
POST /api/public/v1/coupons/check
POST /api/public/v1/checkout          # → order placement, see §7
GET  /api/public/v1/orders/lookup     # orderNumber + phone, for guest tracking
```

`cart/validate` is not optional. Cart contents live in the customer's browser
(`src/components/cart-provider.tsx`, `localStorage`); price and stock must be re-checked server-side
at checkout or the client can dictate what it pays.

### Account (customer session required)

```
GET/POST/PATCH/DELETE /api/public/v1/account/addresses
GET                   /api/public/v1/account/orders
GET                   /api/public/v1/account/orders/:orderNumber
GET/POST/DELETE       /api/public/v1/account/wishlist
```

---

## 6. Decision 1 — customer identity

`Customer` has no credentials, and per blocker 4 only the NextAuth-owning app may mint a session.

| | Phone + OTP | Email + password |
|---|---|---|
| Fits `Customer` model | ✅ phone is required, email optional | ✗ email is optional and non-unique |
| Fits screens already built | ✗ `/login`, `/register` are email+password | ✅ no rework |
| New infrastructure | OTP store (Redis is already in the stack), SMS/WhatsApp sender (`packages/notifications` exists) | `passwordHash` on `Customer`, reset-token flow, a customer NextAuth config |
| Indian D2C norm | ✅ | — |

**Recommendation: phone + OTP.** It matches the data model, the ERP already notifies over WhatsApp,
and it avoids storing another password. Cost is rework of `/login`, `/register` and
`/forgot-password` in this repo — those screens are thin and were always marked provisional.

**Non-negotiable either way:** customer tokens must be a *distinct audience* from staff JWTs. A
customer token must never satisfy `withPermission`. Separate signing keys or an explicit `aud` claim
checked at the boundary.

---

## 7. Decision 2 — order shape, and the placement constraint

Prisma `Order` is made-to-order:

```
productCost + printingCost + shippingCost + discount + otherCharges
  → subtotal → gst → grandTotal → paymentReceived → balanceDue
```

plus `designs`, `production`, `statusHistory` relations. A D2C cart is
`line items → subtotal → shipping → total`, fully paid at checkout. `printingCost`, `designs`,
`production` and `balanceDue` have no D2C meaning.

**Options:** reuse `Order` with those columns zeroed and the relations empty, or introduce a distinct
D2C order type. Reuse keeps one revenue reporting path — `packages/reports` already aggregates over
`Order` — at the cost of columns that never apply. A separate type is cleaner per-record but forks
reporting, invoicing and the admin UI.

**Recommendation: reuse `Order`**, with an `orderSource` discriminator (`D2C` | `MADE_TO_ORDER`).
Reporting and invoicing stay unified; the FSM in §8 branches on the discriminator.

**Hard constraint — handbook §5:** *"nothing writes `order.status` directly."* Every change goes
through `transitionOrder()` in `packages/database/src/orders/transitions.ts`, which validates against
`ORDER_TRANSITIONS`, writes the `OrderStatusHistory` row, and enqueues the automation event. Checkout
creates at `NEW` and transitions — it must never `UPDATE` status. GST must be computed server-side
from `gstRate`; the client's `total` is untrusted input.

---

## 8. Decision 3 — order status mapping

The two vocabularies disagree. Ours is 3 states; the ERP's is 12.

| Our timeline step | Source |
|---|---|
| ORDERED | `Order.status = NEW` |
| CONFIRMED | `Order.status = CONFIRMED` |
| PACKED | `Order.status = PACKED` |
| SHIPPED | `Order.status = SHIPPED` |
| **OUT FOR DELIVERY** | **not an `OrderStatus`** — only `ShipmentStatus.OUT_FOR_DELIVERY` |
| DELIVERED | `Order.status = DELIVERED` |

**Consequence:** the tracking timeline is composed from **two sources** — `Order.status` for
fulfilment and `ShipmentEvent` for courier legs (`src/lib/tracking.ts`, rendered by
`src/components/order-view.tsx` on both /track-order and /account/orders/:id).

ERP states with no storefront equivalent, each needing a decision on what the customer is shown:

| ERP status | D2C? | Suggested customer-facing label |
|---|---|---|
| `DESIGNING`, `AWAITING_APPROVAL`, `DESIGN_APPROVED` | made-to-order only | n/a for D2C orders |
| `PRODUCTION`, `QC` | made-to-order only | "Being made" if ever shown |
| `CANCELLED` | ✅ | Cancelled — **no storefront state today** |
| `RETURNED` | ✅ | Returned — **no storefront state today** |

Both are handled: `order-view.tsx` shows a cancelled / returned notice instead of the timeline.

---

## 9. Payment method mapping

Our checkout offers five options; `PaymentMethod` is
`RAZORPAY | UPI | BANK_TRANSFER | CASH | COD | OTHER`.

| Storefront | `PaymentMethod` |
|---|---|
| UPI | `UPI` |
| CARDS | `RAZORPAY` |
| NET BANKING | `RAZORPAY` |
| WALLETS | `RAZORPAY` |
| CASH ON DELIVERY | `COD` |

Three UI labels collapse to `RAZORPAY` (handbook §8), so the specific instrument must be carried
separately if the admin needs to see it. `PaymentStatus.FAILED` already exists and is the backend
counterpart of the failure state now implemented in `src/app/checkout/page.tsx`.

---

## 10. Seams in this repo

| File | Replaced by |
|---|---|
| `src/lib/products.ts` | ✅ done — types only; data via `src/lib/catalogue.ts` + `<CatalogueProvider>` |
| `src/lib/data.ts` (articles, looks) | stays local — §3 |
| `src/lib/account.ts` (addresses) | `/account/addresses` — still fixtures (needs customer login) |
| `/account/orders`, `/account/orders/:id` | ✅ real ERP orders — the list is orders placed or tracked on this device (`RECENT_ORDERS_KEY`), each opened with its phone via `/api/track`; becomes `/account/orders` on the ERP once customer login exists |
| Order actions (`src/components/order-actions.tsx`) | ✅ done — DOWNLOAD INVOICE → `/api/orders/:id/invoice` (ERP `GET /orders/:n/invoice`); REQUEST RETURN / REQUEST EXCHANGE → `return-request-modal.tsx` → `/api/orders/:id/returns` (ERP `POST /orders/:n/returns`, multipart with photos); withdraw → `/api/orders/:id/returns/:rn/cancel`. Contract: ERP `docs/INTEGRATION.md` §6a–6b |
| `src/lib/search.ts` | ✅ done — searches the ERP catalogue client-side (5 products; move to `?search=` when it grows) |
| `src/components/session-provider.tsx` | `/auth/*` — `login()` / `register()` are the only functions that change |
| `src/app/api/checkout/route.ts` | ✅ done — proxies `POST /checkout`; `/api/checkout/quote` added |
| `src/components/cart-provider.tsx` | ✅ done — lines keyed by ERP `variantId`, re-resolved against the live catalogue |
| `src/components/track-order-client.tsx` | ✅ done — `GET /orders/:number?phone=` via `/api/track` |

---

## 11. Open questions for an owner

1. **§3** — Collection and Wishlist as backend models, Journal and Lookbook local. Confirm.
   (Interim: collections are ERP categories.)
2. **§6** — phone+OTP or email+password for customers. Blocks any auth work.
3. ~~**§7** — reuse `Order` or a separate D2C type.~~ Decided: reuse `Order`, with `source` +
   `shippingAddressId` (migration `20260919000000_storefront_integration`).
4. Badges: stored flags or derived rules (§4).
5. ~~Who owns `/api/public/v1`?~~ Decided: same deploy as `apps/api`, separate namespace.
6. **New:** when is stock allocated — at order creation or at CONFIRMED? (§0 "Still open")
