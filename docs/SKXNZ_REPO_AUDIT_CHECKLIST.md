# SKXNZ Repo Audit Checklist

## Phase 0 audit date
May 14, 2026

## Basic repo info found
```text
Project path: /Users/vrishank/Downloads/SKXNZ_PROJECT_ECOSYSTEM_COMMAND_PACK 2/website
Framework: Next.js 15 App Router
Language: TypeScript / React 19
Package manager declared: pnpm@10.33.0
Lockfile found: pnpm-lock.yaml
Commands requested by founder: npm run lint, npm run build, npm test if available
CSS system: Tailwind CSS plus app/globals.css CSS variables
Component library: local components under components/ and src/components/
Database: Prisma schema exists under prisma/schema.prisma
Auth system: demo role provider only, no real auth provider connected
Testing setup: no npm test script in package.json at Phase 0 audit
Deployment target: not finalized in repo docs; app is private MVP foundation
```

## App/routes/pages structure found
```text
app/
app/page.tsx
app/layout.tsx
app/globals.css
app/shop/page.tsx
app/product/[id]/page.tsx
app/categories/[slug]/page.tsx
app/brands/page.tsx
app/brands/[slug]/page.tsx
app/cart/page.tsx
app/wishlist/page.tsx
app/orders/page.tsx
app/orders/[id]/page.tsx
app/returns/page.tsx
app/account/page.tsx
app/support/page.tsx
app/sell/page.tsx
app/seller/page.tsx
app/seller/products/page.tsx
app/seller/products/new/page.tsx
app/seller/orders/page.tsx
app/admin/page.tsx
app/admin/sellers/page.tsx
app/admin/products/page.tsx
app/admin/orders/page.tsx
app/admin/returns/page.tsx
app/admin/support/page.tsx
app/ai-stylist/page.tsx
app/ai-tools/product-title/page.tsx
app/ai-tools/product-description/page.tsx
app/ai-tools/product-video-prompt/page.tsx
app/api/ai-assistant/route.ts
app/api/ai/buyer-assistant/route.ts
app/api/ai/outfit-builder/route.ts
app/api/ai/seller-product-check/route.ts
app/api/ai/usage/route.ts
app/api/ai/audit-logs/route.ts
```

## Styling setup found
```text
Global CSS: app/globals.css
Tailwind config: tailwind.config.ts
PostCSS config: postcss.config.js
Fonts: public/assets/fonts/
Theme tokens: CSS variables in app/globals.css
```

## Current homepage component
```text
Route: app/page.tsx
Main component: components/buyer/final-homepage-experience.tsx
```

## Current navbar/header component
```text
Shared navbar: components/shared/navbar.tsx
Page shell: components/layout/page-shell.tsx
```

## Current product grid/card files
```text
Homepage product cards: components/buyer/final-homepage-experience.tsx
Shop browser: components/buyer/shop-browser.tsx
Shop catalog: components/buyer/shop-catalog.tsx
Shared product grid: components/shared/product-grid.tsx
Reusable product card: components/sections/product-card.tsx
Product detail: components/buyer/product-detail-shell.tsx
Purchase panel: components/buyer/product-purchase-panel.tsx
```

## Current AI assistant files
```text
Floating assistant: components/ai/floating-skxnz-assistant.tsx
Buyer assistant panel: components/ai/buyer-ai-assistant-panel.tsx
Outfit builder panel: components/ai/ai-outfit-builder-panel.tsx
AI phase studio: components/ai/ai-phase-one-studio.tsx
Assistant logic: src/lib/skxnzAssistant.ts
AI backend helpers: src/lib/ai/
API route: app/api/ai-assistant/route.ts
```

## Current seller/admin files
```text
Seller dashboard: app/seller/page.tsx and app/seller/dashboard/page.tsx
Seller products: app/seller/products/page.tsx
Seller product form: components/forms/product-upload-form.tsx
Seller application: components/forms/seller-application-form.tsx
Seller orders: components/seller/seller-orders-panel.tsx
Admin shell routes: app/admin/*
Admin seller review: components/admin/admin-seller-review-panel.tsx
Admin product review: components/admin/admin-product-review-panel.tsx
Admin orders: components/admin/admin-orders-panel.tsx
Admin returns: components/admin/admin-returns-panel.tsx
```

## Current community files
No `app/community` route and no `components/community` folder were found in the Phase 0 audit.

## Data and backend structure found
```text
Structured data: src/data/
Search helpers: src/lib/site-search.ts
Assets map: src/lib/assets.ts
Prisma schema: prisma/schema.prisma
Seed script: prisma/seed.mjs
Migration folder: prisma/migrations/20260507_prepare_sheet_backend/
Project data planning folder: project-data/
```

## Risk notes before Phase 1 continuation
- Current homepage/theme work is already checkpointed and must be preserved.
- There are older homepage components still present but not used by `/`; avoid accidentally reactivating them.
- AI assistant is a real component; do not replace it with static screenshots.
- No community feature exists yet; add only after moderation planning.
- No `npm test` script exists at this audit point.

## Phase 0 check results
```text
npm run lint: passed
npm run typecheck: passed
npm run build: passed
npm test: not available, no test script in package.json
```

## Files changed during Phase 0
Only documentation files under `docs/` were added after the safety checkpoint. Existing homepage, navbar, AI assistant, theme, product, seller, admin, and route code was not edited during the docs step.
