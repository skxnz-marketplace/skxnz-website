# D10-A buyer visual bug list

Fresh browser evidence was unavailable. The entries below distinguish founder feedback and previously documented D9-B debt from D10-A static observations. They are candidates for visual verification, not newly proven screenshots.

| Priority | Route | Issue / evidence | Likely area | Owner | Day 10-B scope |
| --- | --- | --- | --- | --- | --- |
| P0 | All | Configured runtime is unavailable in this worktree: middleware returns HTTP 500 before rendering. | Runtime QA configuration / `middleware.ts` boundary | Codex + operator | Restore approved public QA configuration outside source; rerun smoke before UI edits. |
| P1 | `/`, buyer journey | Founder reports buyer-facing visual quality feels worse than before; D10-A could not obtain new visual evidence. | Homepage and shared buyer shell | Claude | Capture approved desktop/mobile references, then plan a focused recovery rather than rebuild blindly. |
| P1 | `/` and catalog cards | D9-B records gradient placeholders when catalog images are missing, weakening first impression. | Homepage/product media components | Claude | Verify with configured runtime; replace only confirmed weak fallback presentation. |
| P1 | `/shop`, brand/category | D9-B records fictional fallback brand content until live catalog depth is sufficient. | Catalog fallback/data presentation | Claude + Codex | Separate content/data remediation from layout changes; preserve truthful preview labeling. |
| P2 | `/shop` | D9-B records that the sidebar may need to collapse on mobile for a tighter first fold. | `app/shop/page.tsx` | Claude | Validate at 390px and 768px, then implement a bounded filter/drawer adjustment if confirmed. |
| P2 | `/`, product cards | Card density, image crops, CTA crowding, and text clipping could not be rechecked. | Homepage/product-card components | Claude | Screenshot grid at desktop/tablet/mobile before choosing spacing or typography changes. |
| P3 | `/` | Wishlist heart is documented as local visual state rather than persisted account behavior. | Homepage product row / wishlist boundary | Codex | Keep copy/affordance honest; persistence work is separate from visual recovery. |
| P3 | `/faq`, `/support`, `/returns`, `/ai`, `/community` | No fresh visual defects proven; runtime and browser policy blocked inspection. | Corresponding route pages | Claude | Manual visual sweep only; avoid speculative redesign. |

`/ai` additionally lacks an index page while `/ai-stylist` and `/ai/stylist` exist. Day 10-B should decide the intended canonical entry before adding a redirect or page; D10-A does not invent one.
