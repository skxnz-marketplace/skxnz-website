# SKXNZ MVP Status

## Built Now

- Buyer foundation:
  homepage, shop, product detail, cart, wishlist, orders, returns, account, support, waitlist
- Seller foundation:
  seller application, onboarding status, product workspace, inventory, orders
- Admin foundation:
  dashboard, seller approvals, product approvals, order operations, returns review, support queue
- AI placeholders:
  title generator, description generator, video prompt generator, stylist
- Database foundation:
  Prisma schema, seed script, `.env.example`, and `docs/DATABASE_SETUP.md`

## Current MVP Readiness Summary

SKXNZ is now ready for controlled private testing as a web MVP foundation. Buyer, seller, admin, and AI placeholder routes are implemented, navigation is role-aware, lint passes, and the production build passes.

Reference docs:

- [Database setup](./docs/DATABASE_SETUP.md)
- [Private testing checklist](./docs/PRIVATE_TESTING_CHECKLIST.md)
- [Route audit](./docs/ROUTE_AUDIT.md)

## Mock/Placeholder Now

- Demo authentication and role switching
- Seller onboarding submission and approval actions
- Product upload and product approval actions
- Buyer cart, wishlist, orders, and returns local state
- Support ticket creation and admin support queue
- AI tool outputs
- Refund actions
- Delivery status tracking

## Not Built Yet

- Real authentication provider
- Real PostgreSQL-backed UI writes
- Real payment gateway integration
- Real refund processing
- Real delivery or carrier API integration
- Real seller payouts
- Real AI API integration
- Public launch hardening

## Next Technical Priorities

1. Connect read-only Prisma data loading for buyer, seller, and admin pages.
2. Replace browser-local seller, support, order, and return state with database-backed mutations.
3. Add real authentication and role-based access control.
4. Add audit-log writes for approvals, returns, and admin actions.
5. Add safe staging-only payment and shipment integration work after the private ops flow is approved.

## Private Testing Checklist

- Verify demo role switching across buyer, seller, and admin routes.
- Verify seller application submission appears in admin seller review.
- Verify seller product submission appears in admin product review.
- Verify approved products appear in `/shop`.
- Verify add-to-cart, wishlist, orders, and returns flows work in browser-local state.
- Verify admin orders and admin returns views show consistent mock lifecycle data.
- Verify all placeholder labels clearly say what is not live.
- Verify no real payment, refund, delivery, or AI claims are shown.

## Production Launch Blockers

- Payments are not live.
- Refund processing is not live.
- Delivery API is not connected.
- Seller payouts are not live.
- Authentication is demo or MVP only.
- Real AI is not connected.
- UI write flows are not yet backed by a real database.
- Real customer payment data must not be used yet.

## Biggest Remaining Blockers

- Real authentication and access control
- Database-backed UI mutations instead of browser-local state
- Real payment, refund, and payout systems
- Real delivery and shipment integrations
- Final moderation, support, and audit workflows on Prisma data
