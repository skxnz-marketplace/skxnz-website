# SKXNZ Data Architecture

## Current Reality

SKXNZ currently runs as a web MVP. The app has a prepared Prisma + PostgreSQL
backend foundation, but the live UI still uses demo/static TypeScript data and
browser-local state for most buyer, seller, admin, cart, wishlist, and checkout
flows.

This is intentional until real authentication, private database writes, payment
gateways, delivery APIs, and production operations are ready.

## Existing Setup Found

- Framework: Next.js App Router.
- ORM: Prisma.
- Planned database: PostgreSQL.
- Prisma schema: `prisma/schema.prisma`.
- Prisma client helper: `lib/prisma.ts`.
- Static catalog data: `src/data/skxnz-products.ts`, `src/data/products.ts`,
  `src/data/brands.ts`, `src/data/categories.ts`, and related files.
- Current marketplace state: `components/marketplace/marketplace-provider.tsx`.
- Demo role state: browser `localStorage`.
- Guest cart: browser `localStorage`.
- Wishlist: browser `localStorage`.
- Seller/admin/order support MVP data: browser `localStorage` plus seed data.
- Demo checkout success: browser `localStorage`.

## What Stays Local For MVP

- Demo role selection.
- Guest cart.
- Temporary wishlist.
- Demo checkout success handoff.
- Seller product submissions used for MVP review demos.
- Seller applications used for MVP review demos.
- Support tickets used for MVP review demos.
- Order and return placeholder state used for internal QA.

Local MVP storage must stay clearly labeled as demo/internal and must not be
treated as production persistence.

## What Needs Database Storage Later

- User accounts managed by a real auth provider.
- User profiles.
- Buyer profiles and style preferences.
- Addresses.
- Logged-in cart items.
- Wishlist items.
- Saved brands.
- Orders and order items.
- Payment references and statuses.
- Shipments and delivery events.
- Return requests and refunds.
- Seller applications.
- Seller profiles.
- Product drafts, products, images, variants, and inventory.
- Support tickets and messages.
- AI jobs, usage logs, and audit logs.
- Future Signal Community posts, likes, saves, product tags, and reports.

## What Should Never Be Stored In Google Sheets Or Excel

- Real passwords.
- Password hashes.
- OAuth tokens.
- Session tokens.
- Private auth provider identifiers unless exported safely for internal admin
  reconciliation.
- Real card numbers.
- CVV codes.
- Full payment credentials.
- Sensitive user addresses at production scale.
- Private support conversations containing personal data.
- User-uploaded personal photos.
- AI try-on photos or biometric-like media.
- Private moderation evidence.

Google Sheets can remain useful for planning catalog structure, seed products,
demo content, admin checklists, and non-sensitive launch planning.

## Guest Cart Versus Logged-In Cart

Guest cart:

- Stored in `localStorage`.
- Does not require login.
- Can be cleared by the browser or device.
- Must not be considered an order.

Logged-in cart later:

- Stored in `cart_items`.
- Belongs to the authenticated buyer profile.
- Should sync the guest cart after login.
- Should deduplicate by product, variant, size, and color.

## Wishlist Storage

MVP:

- Temporary browser-local wishlist is allowed for demo.

Later:

- Real wishlist persistence should require login.
- Store in `wishlist_items`.
- Allow selected size/color only if the user explicitly saves a variant.

## User Profile Storage

User profile data belongs in the database after real auth is connected. The app
should store only the minimum fields needed for marketplace use:

- Display name.
- Email from auth provider.
- Phone if user provides it.
- City/state/country.
- Style preference.
- Preferred fit.
- Budget range.
- Saved addresses.

Do not store unnecessary private information.

## Order And Demo Order Storage

Current demo checkout:

- Creates an internal test order in browser `localStorage`.
- Does not process payment.
- Does not create a production order.
- Does not reserve inventory.

Future real checkout:

- Creates `orders` and `order_items`.
- Stores only payment provider reference, amount, currency, and status.
- Does not store raw card details.
- Creates shipment records only after fulfillment is connected.

## Seller Application Storage

MVP seller applications can remain local/demo for review UI. Later, applications
should be stored in `seller_applications` or promoted into `seller_profiles`
with review status, checklist, risk note, and admin audit trail.

Seller approval must remain manual until SKXNZ has a verified process.

## Signal Community Future Storage

Signal Community is not public yet. Future community data should use:

- `community_posts`
- `community_post_products`
- `community_likes`
- `community_saves`
- `reports`

Public posting must not go live until moderation, reporting, hide/remove, and
admin review workflows are ready.

## Security And Privacy Rules

- Use a real auth provider later; do not manually store passwords.
- Keep `.env` private and never commit secrets.
- Do not store real payment credentials.
- Do not expose private API keys to the frontend.
- Do not store personal AI try-on photos without consent and deletion rules.
- Use database relations and audit logs for admin/seller actions.
- Keep demo data clearly marked as demo seed data.

