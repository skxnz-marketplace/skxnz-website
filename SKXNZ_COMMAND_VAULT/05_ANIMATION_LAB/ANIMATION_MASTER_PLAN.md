---
tags: [skxnz, animation]
---
# ANIMATION MASTER PLAN

SKXNZ motion language. Planning only — no motion code yet.

## Motion language
- **Premium** — restrained, intentional, expensive feel.
- **Smooth** — clean easing, no jerk.
- **Fast** — short durations (120–320ms typical); never laggy.
- **Glass-shine** — subtle light sweep across surfaces.
- **Chrome pulse** — soft metallic glow on key accents.
- **No childish bouncing.** No over-animation. No cheap neon overload.

## Easing + timing defaults
- Micro (hover/tap): 120–180ms, ease-out.
- Entrance: 240–320ms, ease-out / spring (low bounce).
- Page transition: 200–300ms, fade + slight rise.
- Respect `prefers-reduced-motion`: disable non-essential motion.

## Priorities (build order)
1. **Loading screen** → [[LOADING_SCREEN_MOTION]]
2. **Hero carousel** → [[HERO_CAROUSEL_MOTION]]
3. **Menu drawer** → [[MENU_MOTION]]
4. **Product cards** → [[PRODUCT_CARD_MOTION]]
5. **Top brand bar**
6. **Search suggestions**
7. **Page transitions**

## Guardrails
Every motion checked against [[MOTION_DO_NOT_DO]]. Directed by [[SKXNZ_ANIMATION_DIRECTOR]].

Related: [[HOMEPAGE_MOTION_SYSTEM]] · [[UI_UX_MEMORY]] · [[BRAND_MEMORY]]
