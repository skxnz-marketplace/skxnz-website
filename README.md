# SKXNZ Private Web MVP

Private web MVP foundation for **SKXNZ**, the AI-powered futurewear marketplace by **Vivaan Poddar Companies**.

This project is intentionally private-first:

- No public launch yet
- No live payments
- No live delivery API
- No real AI API
- No live seller payouts
- Demo authentication only
- Mock and browser-local state for testing

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style component structure
- Prisma
- PostgreSQL

## Current MVP Status

Built now:

- Buyer flows: homepage, shop, product detail, cart, wishlist, orders, returns, account, support, waitlist
- Seller flows: seller application, dashboard, products workspace, inventory, orders
- Admin flows: dashboard, sellers, products, orders, returns, support
- AI placeholders: stylist, product title, product description, product video prompt
- Prisma foundation: schema, seed script, env template, database setup guide

Mock or placeholder now:

- Demo login and demo role switching
- Seller onboarding approval workflow
- Product approval workflow
- Cart, wishlist, support, orders, and returns local/browser state
- AI tool outputs

Not live yet:

- Real authentication provider
- Real database-backed form writes from the UI
- Real payment gateway
- Real refund processing
- Real delivery tracking or carrier APIs
- Real AI integrations
- Real seller payouts

## Main Routes

Buyer:

- `/`
- `/shop`
- `/product/[id]`
- `/cart`
- `/wishlist`
- `/orders`
- `/orders/[id]`
- `/returns`
- `/account`
- `/support`
- `/waitlist`

Seller:

- `/sell`
- `/seller`
- `/seller/products`
- `/seller/inventory`
- `/seller/orders`
- `/seller/login`

Admin:

- `/admin`
- `/admin/sellers`
- `/admin/products`
- `/admin/orders`
- `/admin/returns`
- `/admin/support`
- `/admin/login`

AI placeholders:

- `/ai-stylist`
- `/ai-tools/product-title`
- `/ai-tools/product-description`
- `/ai-tools/product-video-prompt`

## How To Run Locally

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Read the beginner database guide:

- `docs/DATABASE_SETUP.md`

4. Add a real PostgreSQL connection string to `.env`:

- `DATABASE_URL=...`

5. Generate the Prisma client:

```bash
npx prisma generate
```

6. Create your local development migration after the database is ready:

```bash
npx prisma migrate dev --name init
```

7. Seed placeholder data:

```bash
npm run db:seed
```

8. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup Docs

Database setup instructions live in:

- `docs/DATABASE_SETUP.md`

That file explains:

- what PostgreSQL is
- why SKXNZ needs a database
- what Prisma does
- what `DATABASE_URL` means
- why `.env` must stay private
- common setup errors and how to debug them

## Project Docs

- `docs/DATABASE_SETUP.md`
- `docs/BACKEND_SETUP.md`
- `docs/PRIVATE_TESTING_CHECKLIST.md`
- `docs/ROUTE_AUDIT.md`
- `SKXNZ_MVP_STATUS.md`

## What Uses Mock Or Local State Right Now

- Buyer cart
- Wishlist
- Support ticket creation
- Buyer order and return views
- Seller application submission
- Seller product submission
- Admin seller/product approval actions
- Seller and admin order state actions

These flows are for private testing only and are not production-ready persistence.

## What Is Not Live Yet

- Payments are not live
- Refunds are not live
- Delivery API is not connected
- Real AI is not connected
- Seller payouts are not live
- Authentication is demo or MVP only
- Do not use real customer payment data yet

## Notes For Beginners

- `.env.example` is safe to commit because it contains fake example values only.
- `.env` is private and should never be committed.
- If Prisma commands fail, check `docs/DATABASE_SETUP.md` first.
- Use `docs/BACKEND_SETUP.md` when preparing schema, migrations, or sheet-backed seed data.
- Use `docs/PRIVATE_TESTING_CHECKLIST.md` before private stakeholder reviews.
- Use `docs/ROUTE_AUDIT.md` to confirm which routes are built versus placeholder-only.
- This project uses a Next.js WASM fallback in scripts so builds stay stable on machines where the native SWC binary is blocked.

## Useful Commands

```bash
npm run lint
npm run build
npm run dev
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```
