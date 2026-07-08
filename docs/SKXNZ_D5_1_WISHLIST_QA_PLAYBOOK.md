# SKXNZ D5-1 Wishlist QA Playbook

Compact QA + route index for Claude's D5-1 work: live wishlist / save-for-later backend compatibility.

## Current findings

- Current wishlist UI is browser-local and product-id based.
- Main storage key: `skxnz-marketplace-wishlist`.
- Current provider state: `components/marketplace/marketplace-provider.tsx` stores `wishlistProductIds: string[]`, not full product snapshots.
- `wishlistProducts` is derived by matching saved ids against the current provider `catalog`.
- `ShopCatalog` uses live products passed from `/shop` when available, but does not write them into provider `catalog`.
- Risk: saving a live product id from `/shop` or `/product/[id]` can mark the button as saved, but wishlist rendering can fail later because only the id is stored and the live product snapshot may not exist in provider catalog.
- Cart already stores stable live product snapshots for live add-to-cart; wishlist does not yet have equivalent snapshot storage.
- Account/auth exists, but current wishlist pages do not enforce login.

Related graph notes: [[SKXNZ_CART_WISHLIST_DATA_PLAN]], [[SKXNZ_LIVE_CATALOG_RUNTIME_QA_PLAYBOOK]], [[SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT]]

Tags: #skxnz/qa #skxnz/wishlist #skxnz/day5

## Routes/files discovered

### Buyer routes

- `/shop` -> `app/shop/page.tsx`
  - Fetches live ACTIVE catalog via `getActiveProductsWithRelations()`.
  - Maps live rows with `mapCatalogProductToBuyerProduct()`.
  - Renders `ShopCatalog` -> `ShopBrowser` -> `ProductGrid` -> `ProductCard`.
  - Product cards show wishlist buttons when `showWishlistAction` is true.
- `/product/[id]` -> `app/product/[id]/page.tsx`
  - Looks up live product by slug first, then id.
  - Uses `mapCatalogProductToBuyerProduct()`.
  - Renders `ProductDetailShell` -> `ProductPurchasePanel`.
  - Detail panel has `Save` / `Saved` button.
- `/cart` -> `app/cart/page.tsx`
  - Renders `CartPreviewTable`.
  - `Save For Later` exists only for non-live cart items today.
- `/wishlist` -> `app/wishlist/page.tsx`
  - Renders `WishlistGrid` inside `AccountShell`.
  - Not login-gated in the page itself.
- `/account/wishlist` -> `app/account/wishlist/page.tsx`
  - Also renders `WishlistGrid` inside `AccountShell`.
  - Not login-gated in the page itself.
- `/login` -> `app/login/page.tsx`
  - Needed only if Claude makes persistent wishlist require auth.
- `/checkout` -> `app/checkout/page.tsx`
  - Checkout review route; should still render after wishlist changes.

### Wishlist / save UI

- `components/wishlist/wishlist-button.tsx`
  - Calls `isInWishlist(productId)` and `toggleWishlist(productId)`.
  - Used by product cards and homepage cards.
- `components/sections/product-card.tsx`
  - Product listing/card save buttons.
  - Product detail links use `/product/${product.slug}`.
- `components/buyer/product-purchase-panel.tsx`
  - Detail-page save button calls `toggleWishlist(product.id)`.
  - Live add-to-cart sends full product snapshot; wishlist save only sends id.
- `components/account/wishlist-grid.tsx`
  - Renders saved products.
  - Supports `Move To Cart`, `View Product`, and `Remove`.
  - Links currently use `/product/${product.id}`.
- `components/buyer/cart-preview-table.tsx`
  - `saveForLater()` calls `addToWishlist(productId)`, then removes the cart line.
  - Save-for-later button is hidden for `item.product.dataSource === "live"`.
- `components/buyer/final-homepage-experience.tsx`
  - Homepage live/demo cards also use `WishlistButton productId={product.id}`.
- `components/brands/brand-page-shell.tsx` and `components/categories/category-page-shell.tsx`
  - Related product grids pass `showWishlistAction`.

### Hooks/provider/local utilities

- `components/marketplace/marketplace-provider.tsx`
  - Local storage keys include `skxnz-marketplace-cart` and `skxnz-marketplace-wishlist`.
  - Wishlist functions: `addToWishlist`, `removeFromWishlist`, `toggleWishlist`, `isInWishlist`, `moveWishlistItemToCart`.
  - Current duplicate behavior: `addToWishlist` is idempotent; `toggleWishlist` removes when already saved.
- `lib/data/wishlist.ts`
  - Exports `guestWishlistStorageKey = "skxnz-marketplace-wishlist"`.
  - Has draft merge helpers for `{ productId, productVariantId, selectedSize, selectedColor }`.
  - `shouldPersistWishlistToDatabase(isAuthenticated)` returns `isAuthenticated`.

### Supabase live product queries

- `lib/catalog/queries.ts`
  - `getActiveProductsWithRelations()`: ACTIVE products + active brands/categories + active variants + images.
  - `getActiveProductBySlug(slug)`: ACTIVE product detail lookup by slug.
  - `getProductById(id)`: ACTIVE product detail lookup by id.
  - `searchActiveProducts(term)`: ACTIVE search suggestions.
- No existing wishlist Supabase table/action was found in the current code scan.
- Do not touch migrations/server actions for this playbook task.

## Snapshot data availability

Live product mapper: `lib/catalog/mappers.ts -> mapCatalogProductToBuyerProduct(product)`.

Available fields in mapped buyer product:

- Product id: `product.id`.
- Slug: `product.slug`.
- Title/name: `product.name`.
- Brand: `brandName`, `brandSlug`, `brandId`.
- Category: `category`, `subcategory`, `categoryId`.
- Price:
  - `price`: whole rupees from `products.price_inr`.
  - `priceCents`: integer paise from `products.price_inr * 100`.
  - `salePrice`: currently `null` for live products.
- Image:
  - `image`, `imageUrl`, `gallery`.
  - Uses sorted `product_images.url`; falls back to `products.image_url`; then `fallbackProductImage`.
- Stock/status:
  - `status: "Active Catalog"`.
  - `stock` and `inventoryCount`: summed active variant `stock_quantity`.
  - `variantCount`: active variant count.
  - `dataSource: "live"`.
- Variant/size/color fields:
  - `sizes`: unique active variant `size`, fallback `["One Size"]`.
  - `colors`: unique active variant `color`, fallback `["Default"]`.
  - Individual variant ids are available in `ProductWithRelations.variants`, but are not carried into the mapped buyer product.

Raw live query fields before mapping:

- `products`: `id`, `seller_id`, `brand_id`, `category_id`, `slug`, `name`, `subtitle`, `description`, `status`, `price_inr`, `compare_at_price_inr`, `currency`, `image_url`, `tags`, `is_featured`, `is_limited`, `created_at`, `updated_at`.
- `product_variants`: `id`, `product_id`, `sku`, `size`, `color`, `price_inr`, `stock_quantity`, `is_active`, `created_at`, `updated_at`.
- `product_images`: `id`, `product_id`, `url`, `alt`, `sort_order`, `created_at`.
- `brands`: `id`, `slug`, `name`, `logo_url`, `hero_image_url`, `description`, `is_active`.
- `categories`: `id`, `slug`, `name`, `parent_id`, `sort_order`, `is_active`.

## Smoke checklist

- Logged-out save behavior:
  - Open `/shop`.
  - Save a live product from a product card.
  - Confirm button changes to `Saved`.
  - Open `/wishlist` and `/account/wishlist`.
  - Confirm saved item renders or an intentional login prompt appears if Claude changes auth behavior.
- Logged-in save behavior:
  - Sign in at `/login`.
  - Save a live product from `/shop`.
  - Open `/account/wishlist`.
  - Confirm saved item persists after refresh.
- Duplicate save behavior:
  - Click card `Save` once.
  - Click the same product save again.
  - Expected current behavior is toggle remove; if Claude changes duplicate handling, ensure no duplicate rows/cards appear.
- Remove saved item:
  - Save an item.
  - Open `/wishlist` or `/account/wishlist`.
  - Click `Remove`.
  - Confirm item disappears and does not come back after refresh.
- Save live product from card:
  - Use `/shop` with live catalog active.
  - Save from product-card heart/button.
  - Confirm saved item renders with title, brand, image, price, size/color badges.
- Save live product from detail page:
  - Open `/product/{live-slug}` from a live product card.
  - Click detail page `Save`.
  - Confirm `/wishlist` renders the same live product snapshot.
- Move cart item to save-for-later if available:
  - Add a demo product to cart and click `Save For Later`.
  - Confirm item leaves cart and appears in wishlist.
  - Add a live product to cart.
  - Current baseline: `Save For Later` is hidden for live cart items. If Claude enables it, confirm the live snapshot survives in wishlist.
- Saved item still renders snapshot fields:
  - After save, refresh `/wishlist`.
  - Confirm image, brand, name, price, category, first color, first size render.
  - Confirm product link opens `/product/{slug-or-id}` and resolves.
- Checkout still works after wishlist changes:
  - Add live product to cart from `/product/{live-slug}`.
  - Open `/cart`.
  - Continue to `/checkout`.
  - Confirm checkout review still renders and no wishlist change breaks cart storage or subtotal.

## Risks to watch

- Live wishlist item disappears because only id was stored and provider catalog does not contain live products.
- Saved live product renders with demo fallback or wrong product because id/slug lookup falls back incorrectly.
- Wishlist product links should prefer slug when available; current wishlist grid uses id.
- Cart live snapshot behavior must not regress; live cart already works because `addToCart` accepts full `product` snapshot.
- `Save For Later` currently hidden for live cart lines; enabling it needs snapshot support.
- Duplicate handling must remain deterministic: no duplicate DB/local rows for same product/variant/size/color.
- If auth persistence is introduced, logged-out local saves need a clear behavior: remain local, prompt login, or merge after login.
- Keep money in integer paise when persisting snapshots; current mapped live product exposes `priceCents`.
- Do not trust client product price for any future order/payment path.

## What Claude should not break

- `/shop` live catalog render and filter flow.
- `/product/[id]` live slug-first detail lookup.
- Product card save buttons and detail page `Save` state.
- Existing local wishlist remove/toggle behavior for demo products.
- Existing cart storage key and live cart snapshot behavior.
- `/cart` quantity update, remove, and checkout review link.
- `/checkout` review page render.
- `WishlistGrid` empty state.
- Auth routes and `?next=` login behavior.
- Supabase RLS/payment safety rules: no raw card data, no client-authoritative payment/order state, no secrets in client code.
