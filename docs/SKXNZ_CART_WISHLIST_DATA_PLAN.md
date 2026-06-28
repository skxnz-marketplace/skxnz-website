# SKXNZ Cart And Wishlist Data Plan

## Current MVP State

The current SKXNZ cart and wishlist are browser-local MVP systems.

- Guest cart storage key: `skxnz-marketplace-cart`.
- Wishlist storage key: `skxnz-marketplace-wishlist`.
- Demo checkout order storage key: `skxnz-demo-checkout-order`.
- State owner: `components/marketplace/marketplace-provider.tsx`.

This lets SKXNZ test the buyer flow without enabling real account persistence,
payments, fulfillment, or private database writes.

## Guest Cart Strategy

Guest cart remains in `localStorage` until real auth is connected.

Guest cart item shape should include:

- product ID.
- selected size.
- selected color.
- quantity.
- unit price snapshot.
- product image for UI fallback.

Guest cart limitations:

- It is browser/device-specific.
- It can be cleared by the user or browser.
- It is not an order.
- It does not reserve inventory.

## Logged-In Cart Strategy Later

After real auth:

- Store logged-in cart rows in `cart_items`.
- Link carts to buyer profiles.
- Keep one active cart per buyer unless there is a reason to support multiple.
- Sync guest cart into database after login.
- Merge duplicate rows by product, variant, selected size, and selected color.
- Keep unit price snapshots for checkout review.

## Wishlist Strategy

MVP:

- Wishlist can stay in localStorage as a demo saved-products feature.

Later:

- Wishlist requires login for real persistence.
- Store rows in `wishlist_items`.
- Use `wishlists` if multiple named lists are needed later.
- Saved products should never imply availability or reserved stock.

## Save For Later

Current demo cart can move an item into wishlist. Later this should:

1. Add or update `wishlist_items`.
2. Remove the matching `cart_items` row.
3. Preserve selected size/color only when available.

## Demo Checkout Storage

Current demo checkout stores an internal test order in localStorage only.

It should not:

- Process live payment.
- Reserve inventory.
- Trigger delivery.
- Create seller payout.
- Send production emails.

Later real checkout should create:

- `orders`
- `order_items`
- `payments`
- `shipments` when delivery is connected

## Sync Rules After Login Later

When a guest logs in:

1. Read local guest cart.
2. Validate product IDs against current approved catalog.
3. Drop unavailable products safely.
4. Merge quantities with existing database cart rows.
5. Clear local guest cart only after database write succeeds.
6. Keep a visible sync result message for the buyer.

Wishlist sync should follow the same cautious pattern.

## Privacy And Safety

- Do not store private payment details in cart or wishlist.
- Do not store real customer data in Google Sheets.
- Do not claim live checkout until payment and order workflows are connected.
- Keep demo checkout language visible wherever the checkout flow appears.

