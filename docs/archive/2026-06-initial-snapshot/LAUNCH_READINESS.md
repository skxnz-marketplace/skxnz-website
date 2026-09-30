# SKXNZ Launch Readiness

## Public Pages Ready

- Home
- Shop
- Sell on SKXNZ
- About
- Contact
- Waitlist and early access flow

## Private Demo Pages

- `/login`
- `/seller`
- `/admin`
- `/account`
- `/orders`
- `/returns`
- `/support`
- AI placeholder pages

## Not Live Yet

- Real payments
- Real refunds
- Real delivery tracking
- Real AI integrations
- Real authentication
- Real seller payouts
- Real production database-backed UI writes

## Launch Blockers After Public MVP

- Connect a real authentication system
- Replace browser-local state with database-backed mutations
- Connect staging payment and refund workflows safely
- Add real shipment and delivery integrations
- Add audit logging for admin actions
- Add production operations tooling for support, sellers, and approvals

## Recommended Next Steps After Launch

1. Keep the public website live for discovery and seller applications.
2. Use private testing routes through `/login` for internal operations review.
3. Connect read-only Prisma data to public catalogue and admin dashboards first.
4. Add database-backed seller, product, support, order, and return mutations next.
5. Introduce authentication before enabling any real customer account workflow.
