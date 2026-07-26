# SKXNZ Launch War — Day 11-C: Luxury UI & Launch Polish

- **Worktree:** `skxnz-claude-d11c-luxury-polish`
- **Branch:** `claude/d11c-luxury-polish`
- **Base:** `6532a4c` (matches expected HEAD)
- **Scope:** buyer-facing presentation only. No redesign, no navigation change, no page rebuild, no backend, no SQL, no migrations, no feature additions. Seller and admin surfaces deliberately excluded.

---

## 1. The headline finding: the type scale was the problem

The storefront did not read as unfinished because of layout — it read that way because **most of its labels were physically too small to read comfortably**.

Body text is 15px on mobile and 16px from 640px up. Against that base, the codebase contained **437 arbitrary font sizes below `0.70rem`** across buyer surfaces:

| Token | Rendered size | Occurrences |
| --- | --- | --- |
| `text-[0.5rem]` | **8.0px** | 24 rendered on the homepage alone |
| `text-[0.55rem]` – `text-[0.58rem]` | 8.3–8.7px | 14 |
| `text-[0.62rem]` – `text-[0.66rem]` | 9.3–9.9px | 194 |
| `text-[0.68rem]` | 10.2px | 220 |

Luxury fashion retail does use small tracked capitals — at 11–13px, never at 8px. Uppercase text with wide letter-spacing at 8px is the single loudest "unfinished prototype" signal a storefront can send.

### The new micro-type scale

A scripted, reviewable mapping raised every tier while preserving the existing three-level hierarchy, applied only to buyer surfaces:

| Before | After | Rendered (mobile / ≥640px) |
| --- | --- | --- |
| `0.5` / `0.55` / `0.56` / `0.58` | **`0.75rem`** | 11.3px / 12px |
| `0.6` / `0.62` / `0.64` / `0.65` / `0.66` | **`0.78rem`** | 11.7px / 12.5px |
| `0.68` / `0.7` | **`0.8rem`** | 12px / 12.8px |

**Measured result on the homepage (live, computed styles):**

| Metric | Before | After |
| --- | --- | --- |
| Smallest rendered text | **8.0px** | **11.52px** |
| Elements under 11px | 25 | **0** |
| Section headings (`h2`) | 20px | **30px** |

The first sweep used a two-decimal pattern and missed single-decimal tokens (`text-[0.5rem]`), which browser measurement caught — 24 elements were still rendering at 8px. A second pass closed them. Worth recording: the static sweep alone would have shipped the worst offender untouched.

---

## 2. Controls: buttons and badges

Buttons were the other half of the problem — a **"large" CTA rendered its label at 12px**.

| Size | Before | After |
| --- | --- | --- |
| `sm` | `px-3 py-1.5`, 11.5px label | `min-h-[36px] px-3.5 py-2`, **12.5px** |
| `md` | `px-4 py-2`, 12px label | `min-h-[44px] px-5 py-2.5`, **13.4px** |
| `lg` | `px-5 py-2.5`, 12px label | `min-h-[48px] px-7 py-3`, **14.4px** |

`md` and `lg` now clear the 44px touch-target minimum by construction, everywhere they are used.

Badges went from 9.9px in a `px-2.5 py-1` pill to **12px in `px-3 py-1.5`**, with tracking relaxed from `0.08em` to `0.06em` (wide tracking on larger text no longer needs the extra separation).

---

## 3. Cards

**Product card (`components/sections/product-card.tsx`)**

- **Image crop is now a fixed `aspect-[4/5]`.** It was a fixed pixel height (`h-44 sm:h-48`), so cards cropped inconsistently against the `3/4` and `4/3` ratios used elsewhere. Verified live: every card image now reports a 0.798 ratio.
- **Hover moved to the container.** `hover:scale-[1.02]` sat on the image element itself; it is now `group-hover:scale-[1.03]` driven by the card, so it triggers reliably from anywhere on the card.
- **Added a lift**: `hover:-translate-y-0.5` with a softened shadow, mirrored on `focus-within:` so keyboard users get the same feedback. Both are disabled under `motion-reduce`.
- **Price now outranks the title** (`text-base sm:text-lg`, tighter tracking) instead of matching it. Struck-through original moved from `text-xs` to `0.8rem`.
- **Removed a duplicated CTA.** Each card rendered the save action twice — a heart on the image *and* a labelled "Save" button below — so every card presented two competing CTAs. The heart remains (enlarged to a 40px target); the labelled duplicate is gone. Same action, one affordance.

**Homepage product card (`components/home/product-row.tsx`)**

- **Removed a control that did nothing.** The heart button announced `aria-label="Add to wishlist"` but was wired only to local `useState` — it reddened on click and never touched the real wishlist that `/wishlist` reads. Announcing an action to assistive technology and then not performing it is worse than not offering it. Removed, along with its now-unused `HeartIcon` and `useState` import.
- **Fixed inverted type hierarchy.** The product name rendered at 11.4px *below* a brand label at 11.7px. Name is now `0.95rem` semibold, brand drops to a quieter `0.75rem` at 70% opacity, price rises to `1rem` bold.
- Card lift deepened to `-translate-y-1` with a 44px-blur shadow, mirrored on focus, `motion-reduce` safe.

---

## 4. Spacing and visual rhythm

Homepage section padding was ad-hoc — `pt-8 pb-3`, `pt-2 pb-10`, `py-8`, `py-12`, `py-7 sm:py-8`. Sections had no shared rhythm, which reads as accidental rather than composed.

| Section | Before | After |
| --- | --- | --- |
| Top Brands | `pb-3 pt-8` | `py-14 sm:py-20` |
| Product rows (staggered) | `pb-10 pt-2` | `pb-14 pt-10 sm:pb-20 sm:pt-14` |
| Product rows (standard) | `py-8` | `py-14 sm:py-20` |
| Shop The Edit | `py-12` | `py-14 sm:py-20` |
| Trust bar | `py-7 sm:py-8` | `py-12 sm:py-16` |

**Measured result:** homepage section padding is now a clean `80/80, 56/80, 80/80, 64/64` rhythm, where it was previously a mix as tight as 8px.

Section heading margins moved to a uniform `mb-8`, headings to `text-2xl sm:text-3xl` with `tracking-[-0.015em]`. Grid gaps opened from `gap-3/gap-4` to `gap-4/gap-5/gap-6`.

Hero: subline raised from a `clamp` floor of 0.9rem to 1rem and lightened from 65% to 75% opacity for contrast; CTA row spacing opened; both CTAs are now 52px tall.

---

## 5. Motion

Everything added is opacity, transform, or colour — no flashy effects, and every one respects reduced motion.

- Card lift + image scale on hover **and** focus-within, `duration-300 ease-out`, all with `motion-reduce:transform-none motion-reduce:transition-none`.
- Category tile and mosaic CTA colour transitions extended 200ms → 300ms and given `motion-reduce` guards.
- Hero CTA hovers given explicit `duration-300 ease-out` and a `motion-reduce` guard.
- The existing hero autoplay already honoured `prefers-reduced-motion` and was left alone.

---

## 6. Mobile

Verified at **390px**, **768px**, and desktop.

- **No horizontal overflow at any width** — `document.scrollWidth === window.innerWidth` at 390px on `/` and `/shop`. (The LogoLoop marquee measures wider than the viewport by design and is clipped by `overflow-hidden`; it does not scroll the page.)
- **Hero dots were 3px tall.** They now sit inside `h-11 w-8` padded hit areas — the visible bar stays thin, the target is 44px. Also gained `aria-current`.
- **"View All" section links were 18px tall.** Now `min-h-[44px]` inline-flex with horizontal padding, on both product rows and the brands strip.
- Wishlist heart on product cards: 32px → 40px.
- Desktop scroll arrows: 32px → 40px.
- Filter selects measured at 48px — already compliant, unchanged.

**Deliberately not changed:** the remaining sub-40px targets at 390px are navigation menu links inside `components/shared/discovery-menu.tsx` and `navbar.tsx`. The brief says do not change navigation, so they were left and are recorded as debt below.

---

## 7. Buyer trust

- Removed the fake wishlist control described in §3 — a button that claimed an action it never performed was the clearest trust defect on the homepage.
- Removed the duplicated save CTA so each card states its actions once.
- No empty state, disclosure, or availability claim was altered. The truthful "checkout is not live yet" messaging established in earlier days is untouched, and **no functionality was invented** — every change is presentational or removes something that was already misleading.

---

## 8. Accessibility

- Card hover states mirrored on `focus-within`, so keyboard navigation gets the same affordance as the mouse.
- Hero dots: real 44px targets plus `aria-current` to expose the active slide.
- Removed the control whose `aria-label` promised an action it did not perform.
- Raising the floor from 8px to 11.5px is itself the largest accessibility win in this pass.
- The existing global `:focus-visible` outline rule in `globals.css` was verified intact and unchanged.

---

## 9. Validation

| Check | Result |
| --- | --- |
| `pnpm.cmd run test:commerce` | **129 pass / 0 fail** |
| `pnpm.cmd exec tsc --noEmit --incremental false` | **EXIT 0** |
| Targeted ESLint (home, sections, ui, shared, buyer, brands, account) | **EXIT 0** |
| `git diff --check` | clean |

Routes smoke-tested: `/`, `/shop`, `/brands`, `/cart`, `/checkout`, `/community`, `/faq`, `/product/[slug]` — all 200.

### One thing worth flagging honestly

During QA the homepage intermittently returned 500 with `TypeError: __webpack_modules__[moduleId] is not a function`. This was investigated rather than assumed:

- Stashing the changes made it pass; restoring them made it pass too — the same code produced both outcomes.
- After a clean `.next` wipe and server restart, the **first** request returned 500 and the **second** returned 200.

It is a cold-compile race in this repo's Windows dev setup (the same vendor-chunk class of problem `scripts/fix-next-vendor-chunks.mjs` exists to work around), **not** a defect introduced here. Every other route compiled first time. This is a dev-server observation only — no claim is made about production behaviour, and a production build was not run in this worktree.

---

## 10. Remaining visual debt

1. **Navigation touch targets.** Menu links in `discovery-menu.tsx` and `navbar.tsx` measure 18–36px at 390px. Out of scope by instruction; needs its own pass.
2. **Seller and admin surfaces still carry the old type scale** — 36 files with sub-0.70rem tokens were deliberately excluded. They will look visibly different from the buyer storefront until swept.
3. **`text-xs` (12px) is still used directly** in places rather than the new scale; harmless today but it bypasses the tiers.
4. **Three different card image ratios coexist** across the site (`4/5` product cards, `3/4` homepage cards, `4/3` brand cards). Each is internally consistent, but a single system would be tighter.
5. **The `.glass-panel` treatment is applied uniformly** — there is no depth hierarchy distinguishing a primary surface from a nested one.
6. **Screenshots could not be captured** (the browser pane was not displayed in this environment); all visual verification was done through computed-style and geometry measurement rather than by eye. A human visual pass is still worth doing.

---

## 11. Guarantees

- Worktree created at `6532a4c`; no push, no merge, no deployment.
- No SQL, no migrations, no backend, no database code, no seller or admin files touched.
- No page rebuilt, no navigation changed, no feature added.
- **No fake UI.** The only removals were a button that performed no action and a duplicated copy of an existing one.
- A local `.env.local` was copied in to run the dev server and **deleted before commit**; `.next` build output was removed.
