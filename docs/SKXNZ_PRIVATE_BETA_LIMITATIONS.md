# SKXNZ Private Beta Limitations

Status: Honest limitations for private beta testers and internal planning.

## Not Public Launch

This build is prepared for private beta testing only. It should not be treated
as the public launch of SKXNZ and should not receive public marketing traffic
until owner approval, legal review, production operations, and security controls
are complete.

## Payments

Real payments are not live. Checkout is a demo/internal test flow. No card, UPI,
Razorpay, Stripe, refund, tax, payout, or settlement workflow is production
enabled.

## Backend And Database

The repo has Prisma/PostgreSQL foundations, but many UI flows still use
static/demo data and browser-local storage. Real database persistence must be
connected and audited before production customer data is stored.

## Authentication

Real production authentication may not be connected. Demo role switching and
beta account pages are not production account security. Admin and seller access
need real auth and role-based permissions before public launch.

## Seller Verification

Seller applications and seller dashboards are beta/demo foundations. Seller
verification, secure document collection, product approval workflows, and seller
payouts are not production-live.

## Product Data

Catalog products may be demo/internal data. Product availability, prices,
inventory, delivery promises, and seller status must be verified before public
commerce launch.

## AI Features

The AI assistant is catalog-aware beta logic. It should recommend only current
SKXNZ catalog items. AI try-on and AI product video generation are not live
unless a later phase explicitly implements and verifies them.

## Admin Back Office

Admin pages are internal/demo foundations. Production role-based access,
server-side authorization, audit logging, and operational review must be added
before any public admin use.

## Signal Community

Signal Community is beta/demo. Public uploads should not go live until auth,
storage, moderation, reporting, takedown, and admin review workflows are ready.

## Policies And Legal

Terms, privacy, returns, shipping, authenticity, seller terms, and community
guidelines are drafts for review. They are not final legal approvals.

## Delivery And Returns

Delivery tracking, courier integrations, real return windows, refund handling,
same-day delivery, and free returns are not confirmed or production-live.

## Media And Private Data

Do not collect or store sensitive documents, personal photos, AI try-on photos,
or private customer data until secure storage, consent, retention, deletion, and
privacy policies are implemented.
