# SKXNZ Database Schema Draft

## Current Schema Status

The repo already has Prisma and a PostgreSQL schema draft in
`prisma/schema.prisma`.

This Phase 3C pass keeps that direction and extends the draft for:

- saved brands
- style preferences
- future Signal Community posts
- future community product tags
- future community likes
- future community saves
- future reports/moderation

No production database was connected in this phase.

## Core Account Models

### User

Primary account identity row connected to real auth provider identity later.

Important rule: SKXNZ should not manually store raw passwords.

### Profile

Implemented as `UserProfile` in Prisma.

Stores general user profile fields such as avatar, phone, city, state, country,
style preference, preferred fit, and budget range.

### Buyer Profile

Stores buyer-specific marketplace relationships:

- carts
- wishlists
- orders
- returns
- addresses
- saved brands

### Seller Profile

Stores seller-specific marketplace relationships:

- store name
- application status
- GST and shipping readiness
- products
- inventory
- seller product validations
- order items

## Product Models

### Product

Central marketplace product record. Supports:

- brand
- category
- seller
- slug
- status
- price
- sale price
- sizes
- colors
- tags
- stock status
- demo seed marker

### ProductImage

Stores product image URLs and alt text.

### ProductVariant

Stores SKU, size, color, material, stock, and price overrides.

### Brand

Stores SKXNZ-safe brand data and demo/real status.

### Category

Stores marketplace category navigation and search metadata.

## Cart And Wishlist Models

### CartItem

Future database row for logged-in buyer carts. Guest cart stays in localStorage
until login sync exists.

### WishlistItem

Future persisted wishlist item. MVP wishlist can remain localStorage only.

### SavedBrand

Future persisted buyer saved-brand relationship.

## Address And Order Models

### Address

Stores saved shipping addresses for authenticated users.

### Order

Stores real order header later. Current demo checkout does not create production
orders.

### OrderItem

Stores item snapshots for each order.

Payment note: store only provider reference, amount, currency, and status. Never
store raw card numbers or CVV.

## Seller Application Model

Current Prisma schema uses `SellerProfile` for seller application status. If the
workflow becomes more complex, add a dedicated `SellerApplication` table later
with:

- store name
- owner name
- phone/email
- product category
- product count
- GST status
- shipping readiness
- review checklist
- admin decision

The TypeScript data contract includes `SellerApplication` so the UI can migrate
without changing component assumptions.

## Style Preference Model

`StylePreference` supports:

- preferred fit
- budget range
- color families
- style tags
- occasion tags
- size profile JSON
- AI consent flag

This prepares account and AI styling features without claiming live
personalization.

## Future Signal Community Models

### CommunityPost

Stores user style posts. Default status should be `PENDING_REVIEW` until
moderation exists.

### CommunityPostProduct

Links community posts to SKXNZ products.

### CommunityLike

Stores post likes.

### CommunitySave

Stores saved community posts.

### Report

Stores reports for moderation review. Public community posting must not launch
without this workflow.

## Security Notes

- Use real auth provider later.
- Keep `.env` private.
- Do not store real payment credentials.
- Do not store private user data in Google Sheets or Excel.
- Do not store user photos for AI try-on without consent and deletion systems.
- Keep all admin actions auditable.

