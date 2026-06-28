# SKXNZ Phase 1 Handoff

## Current status
Phase 1 homepage/theme work has already started and was checkpointed before Phase 0 docs.

Checkpoint created:

```text
checkpoint: preserved current SKXNZ homepage and theme fixes before phase 0 docs
```

## Files to preserve
Do not overwrite these blindly:

```text
app/globals.css
tailwind.config.ts
components/shared/navbar.tsx
components/buyer/final-homepage-experience.tsx
components/ai/floating-skxnz-assistant.tsx
src/lib/assets.ts
src/data/*
```

## Current Phase 1 implementation paths
```text
Homepage route: app/page.tsx
Homepage component: components/buyer/final-homepage-experience.tsx
Navbar: components/shared/navbar.tsx
Page shell: components/layout/page-shell.tsx
Floating AI assistant: components/ai/floating-skxnz-assistant.tsx
Global theme: app/globals.css
Tailwind theme: tailwind.config.ts
Product data: src/data/products.ts
Brand data: src/data/brands.ts
Category data: src/data/categories.ts
Search data: src/data/searchIndex.ts
```

## Phase 1 continuation plan
1. Finish homepage visual QA only.
2. Verify hero carousel image fit and text proportions.
3. Verify navbar is consistently dark maroon glass.
4. Verify main background is near-white and premium.
5. Verify product cards stay compact.
6. Verify the existing floating AI assistant still appears and opens.
7. Run lint, typecheck, and build.
8. Commit the finished Phase 1 visual pass separately.

## Phase 1 not allowed yet
1. Do not connect real payments.
2. Do not connect real AI provider.
3. Do not connect delivery API.
4. Do not connect real auth.
5. Do not connect production database.
6. Do not build mobile apps.
7. Do not add public community posting.
8. Do not replace working components with screenshots.

