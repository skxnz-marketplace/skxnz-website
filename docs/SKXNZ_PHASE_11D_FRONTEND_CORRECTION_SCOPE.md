# SKXNZ Phase 11D Frontend Correction Scope

Status: Preparation document only. Do not implement in this phase.

## Goal

Phase 11D will be a focused major frontend design correction sprint for the
existing SKXNZ private beta UI. It should improve clarity, motion, spacing,
shopping hierarchy, and mobile usability without rebuilding the site from
scratch or changing the approved brand system.

## Upcoming Work Scope

1. Header duplicate menu button removal.
2. Search/Discover overlap fix.
3. Hero carousel sliding animation.
4. Hero carousel one-image-per-slide correction.
5. Category strip swipe buttons.
6. Right-side half-cut category tile fix.
7. Reduce over-boxed rounded rectangle feeling.
8. Homepage length expansion.
9. Abstract category discovery area.
10. Brand bar empty space fix.
11. Product quick-view/image preview options.
12. Product name/price metadata improvement.
13. Seller application step circle visibility.
14. Sidebar top brands repositioning.
15. Sidebar white box removal.
16. Signal Community chat/update hub direction.
17. Seller promoted visibility inquiry area.
18. AI promoted visibility foundation with disclosure.
19. AI page colour inversion only on AI page.
20. Typography/text simplification.
21. Mobile QA requirements.

## What Not To Change

- Do not redesign the full website from scratch.
- Do not change the approved SKXNZ colour system globally.
- Do not remove existing buyer, seller, admin, AI, community, account, cart, or
  checkout functionality.
- Do not connect live payments.
- Do not make the website public.
- Do not claim live AI try-on, AI product video generation, verified sellers,
  official brand partnerships, guaranteed authenticity, same-day delivery, free
  returns, or full production security.
- Do not replace working components with static mockups or screenshots.
- Do not add random external copyrighted assets.

## What Must Be Preserved

- Premium futuristic SKXNZ brand direction.
- Luxury off-white buyer background and dark maroon glass navigation language.
- Current routing structure.
- Working search.
- Working mega/discovery menu behavior, adjusted only where needed.
- Product data and product card links.
- Product detail pages.
- Cart and demo checkout.
- Account, wishlist, addresses, and demo orders.
- Seller application and seller dashboard foundations.
- Brand and category pages.
- Signal Community MVP.
- Admin back office foundation.
- Floating AI assistant and catalog-aware guardrails.
- Legal/support pages and beta-safe wording.
- Opening loader behavior.

## Testing After Implementation

- Header at desktop, tablet, and mobile widths.
- Search/discover interactions.
- Hero carousel motion, controls, and one-image-per-slide behavior.
- Category strip swipe controls and right-edge clipping.
- Homepage scrolling length and visual hierarchy.
- Brand bar spacing.
- Product quick-view/image preview behavior if implemented.
- Product metadata readability and no price/title clipping.
- Seller application step circles.
- Sidebar top brands and sidebar white-box removal.
- Signal Community layout and chat/update hub direction if implemented.
- Promoted visibility areas with clear disclosure.
- AI page colour inversion limited only to AI page.
- Typography and copy simplification.
- Mobile widths: 320px, 375px, 390px, 430px, 768px, 1024px.
- No horizontal overflow.
- No broken links.
- No console blockers.
- `npm run lint`, `npm run typecheck`, and `npm run build` after the actual
  implementation.

## Later Checkpoint Name

Use this checkpoint after Phase 11D implementation and successful checks:

```text
checkpoint: SKXNZ phase 11D major frontend design correction sprint
```
