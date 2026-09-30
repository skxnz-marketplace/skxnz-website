# SKXNZ Private Beta QA Report

Date: 2026-05-18

Checkpoint target: `checkpoint: SKXNZ phase 11A full site QA private beta hardening`

## Scope

Phase 11A focused on private beta hardening only. No major features, payment
connections, live auth, production admin security, AI try-on, AI video
generation, or public launch behavior were added.

## Routes Tested

Static and client routes smoke-tested with local HTTP and headless browser checks:

- `/`
- `/search`
- `/shop`
- `/shop?q=streetwear`
- `/shop?q=zzzz-no-signal`
- `/categories/men`
- `/categories/woman`
- `/categories/women`
- `/categories/streetwear`
- `/categories/accessories`
- `/categories/perfume`
- `/categories/new-season`
- `/categories/ai-stylised`
- `/categories/ai-styled`
- `/categories/limited-edition`
- `/categories/not-real-category`
- `/brands`
- `/brands/skxnz`
- `/brands/demo-atelier`
- `/brands/signal-studio`
- `/brands/chrome-district`
- `/brands/not-real-brand`
- `/product/obsidian-signal-oversized-tee`
- `/product/chrome-trace-hoodie`
- `/product/not-real-product`
- `/cart`
- `/checkout`
- `/checkout/success`
- `/account`
- `/account/profile`
- `/account/wishlist`
- `/account/addresses`
- `/account/orders`
- `/account/cart-sync`
- `/login`
- `/signup`
- `/sell`
- `/seller/apply`
- `/seller`
- `/seller/dashboard`
- `/seller/products`
- `/seller/products/new`
- `/seller/orders`
- `/seller/analytics`
- `/seller/tools`
- `/seller/inventory`
- `/community`
- `/admin`
- `/admin/dashboard`
- `/admin/products`
- `/admin/sellers`
- `/admin/orders`
- `/admin/users`
- `/admin/community`
- `/admin/support`
- `/admin/content`
- `/admin/analytics`
- `/admin/returns`
- `/about`
- `/contact`
- `/support`
- `/faq`
- `/terms`
- `/privacy`
- `/returns`
- `/shipping`
- `/authenticity`
- `/seller-terms`
- `/community-guidelines`
- `/wishlist`
- `/orders`
- `/orders/demo-order-not-real`
- `/waitlist`

Result: all audited routes returned non-500 responses. Invalid category, brand,
product, and order slugs render safe not-found/demo states instead of crashing.

## Navigation And Link QA

Internal links were extracted from representative pages and checked:

- Homepage
- Shop
- Category page
- Brands index
- Brand detail
- Product detail
- Cart
- Checkout
- Account
- Seller
- Signal Community
- Admin
- About
- Support

Result: 101 internal links returned OK responses. Footer legal/support links are
present and route correctly.

## Bugs Found

1. `/search` was not a real route even though it is a common search URL testers
   may try. The implemented search results live at `/shop?q=...`.
2. Pressing Enter in the header search input was not reliable in the headless
   input test. Suggestions worked, but Enter did not navigate consistently.
3. Browser icon metadata was missing, causing a generic 404 resource request on
   the homepage.
4. Master context wording still referenced `verified seller onboarding`, which
   could be misread as a current verification claim.

## Bugs Fixed

1. Added `/search` compatibility route that redirects safely to `/shop` while
   preserving `q`.
2. Added explicit Enter handling to the existing `SiteSearchBar` so keyboard
   search opens `/shop?q=...`.
3. Added metadata icons pointing to the existing SKXNZ transparent mark asset.
4. Changed master context wording from `verified seller onboarding` to `seller
   review onboarding`.

## Buyer Journey QA

Tested with headless browser interaction:

- Product detail page loads a real catalog product.
- Add to cart works.
- Cart localStorage is populated.
- Cart page shows correct product, size area, and demo checkout wording.
- Checkout is blocked when cart is empty.
- Shipping form accepts demo data.
- Demo payment selection works.
- Review step works.
- Success page is reached.
- Demo order is stored locally.
- Cart clears after creating the internal test order.

Result: buyer journey passed.

## Account QA

Tested with Buyer demo role:

- Account routes load.
- Address book loads.
- Demo address can be added locally.
- Demo address can be removed locally.
- Local/demo wording is visible.

Result: account foundation passed for Phase 11A.

## Seller QA

Tested with headless browser interaction:

- Seller application page loads.
- Empty Step 1 validation appears.
- Multi-step seller application flow progresses.
- Verification preview checkboxes work.
- Review step appears.
- Submit creates success state with internal-review wording.

Seller dashboard/routes were smoke-tested and continue to use beta/demo copy.

Result: seller foundation passed for Phase 11A.

## Community QA

Tested with headless browser interaction:

- Signal Community page loads.
- Feed renders.
- Product-tagged links route correctly in link QA.
- Like and save controls update UI/local demo state.
- Create Post modal opens.
- Demo post submission works with local-only public posting warning.
- Report modal opens.
- Report demo submission works.

Result: community MVP passed for Phase 11A.

## Admin QA

Tested with Admin demo role:

- Admin protected/gated behavior appears before selecting admin role.
- Admin community moderation loads after entering Admin demo mode.
- Hide Demo action updates moderation UI locally.
- Admin products route loads.
- Internal/demo/review wording remains visible.

Result: admin foundation passed for Phase 11A. Production role-based access is
still a required blocker before public launch.

## AI Assistant QA

Local API checks:

- `Show me black streetwear under 5000` returns catalog-only product
  recommendations.
- `who is the prime minister of India` is blocked with the SKXNZ-only refusal
  and no product cards.
- No external/general answer path was observed in the tested blocked query.

Result: AI catalog/refusal logic passed for Phase 11A.

## Legal And Trust Wording QA

Checked for unsafe wording across `app`, `components`, `lib`, `src`, and docs.

Safe wording remains in place:

- Draft for review
- Beta
- Demo
- Internal review
- Coming later
- Prepared for future release
- Saved locally for now
- Payment integration coming later

No current public-facing claims were added for:

- Official brand partnerships
- Guaranteed authenticity
- Verified sellers as a live process
- Same-day delivery
- Free returns
- Live payments
- Live AI try-on
- Live AI video generation
- Production-secured admin

Result: wording passed for private beta hardening.

## Mobile And Responsive QA

Headless browser breakpoint sweep:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1440px

Representative pages checked:

- `/`
- `/shop`
- `/categories/men`
- `/brands`
- `/product/obsidian-signal-oversized-tee`
- `/cart`
- `/checkout`
- `/account`
- `/seller`
- `/community`
- `/admin`
- `/support`

Result: 84 route/width combinations checked. No horizontal overflow, app-error
screen, or runtime blocker was detected after the icon metadata fix.

## Build And Console QA

Commands run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test --if-present`

Headless browser checks found no page-level runtime blockers after fixes.

Known non-blocking warning:

- Next build warns that `experimental.useWasmBinary` is ignored on
  `darwin/arm64`. This is existing environment behavior and not a site blocker.

## Remaining Risks

1. Legal/policy pages are still drafts and require legal review before public
   launch.
2. Real auth is not connected. Demo role gates are not production security.
3. Live payments, delivery tracking, refunds, payouts, and order fulfillment are
   not connected.
4. Admin routes are internal/demo foundations and require production
   role-based access before public launch.
5. Signal Community uploads are demo/local only. Public posting needs auth,
   storage, moderation, report queues, and takedown operations first.
6. Seller applications and seller dashboard flows are local/demo foundations.
   Real seller verification and secure document handling are still future work.
7. AI assistant is catalog-aware beta logic only. AI try-on and AI video tools
   are not live.

## Private Beta Readiness Score

Score: 92 / 100

Reason: the private web MVP is route-stable, link-stable, mobile-stable across
the audited breakpoints, and safe-worded for internal/private beta testing. The
remaining eight points are held back for production auth, legal review, payment
integration, admin security, real moderation, and operational readiness.

## Remaining Blockers Before Phase 11B

No Phase 11A hard blockers remain.

Recommended next step: Phase 11B frontend polish and UX refinement, focused on
visual consistency, small spacing issues, accessibility pass, and sharper
private-beta presentation without adding new systems.
