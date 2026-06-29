# SKXNZ — Progress Tracker

Single source of truth for status. Every session: read this first, update it last.

## Current state
- Frontend live at https://skxnz.com (Next.js + TS + Tailwind, deployed via Vercel / bom1).
- Homepage fully built (all 9 sections, responsive, per spec). No backend yet.
- Backend not yet started (no Supabase, payments, or shipping yet).

## How we work
- Planning: discussed with ChatGPT + Claude, then turned into a precise task.
- Building: Claude Code (desktop Code tab) owns this repo.
- Codex: only for specific, isolated tasks when asked.
- This repo is the single source of truth. CLAUDE.md = rules. PROGRESS.md = status.

## Key decisions
- Stack: Next.js + TS + Tailwind, Supabase, Vercel, Razorpay, Shiprocket, Claude API.
- Multi-seller marketplace (buyers, sellers, admin).
- Compliance baked in from the start: DPDP (India) + RBI card rules (see CLAUDE.md).
- Homepage content in lib/home-data.ts (typed, Supabase-ready to swap later).
- All product images are CSS placeholder gradients — real photos drop in via the `image` field.

## Roadmap
- Phase 0 — Foundation: Supabase project; full schema + RLS on every table; Auth (email/phone/Google) + roles (buyer/seller/admin); shared TS types.
- Phase 1 — Core commerce: catalog (products/variants/inventory); cart; checkout; Razorpay (server + webhooks); orders; basic seller onboarding; Shiprocket push + tracking.
- Phase 2 — Trust & compliance: privacy notice + consent + withdrawal; DSAR (view/export/delete); Grievance Officer + policy pages; audit logs; backups + restore test; security hardening.
- Phase 3 — Growth: reviews/wishlists; automations; AI search/recommendations/styling; analytics; seller payouts (Razorpay Route).

## Next up (immediate)
- [ ] Phase 0: create Supabase project and connect it to the app.

## Done this session
- Added CLAUDE.md + PROGRESS.md (project context + rules).
- Built full homepage: HeroCarousel, CategoryStrip, FeaturedLabels (marquee), ProductRow (reusable ×3), MosaicSection, AiStylistBanner, TrustBar.
- All content typed in lib/home-data.ts — zero hardcoded JSX content.
- Updated Navbar (New In / Sneakers / Streetwear / Watches / Brands / AI Stylist with cyan dot).
- Rebuilt buyer Footer with 4 columns (Shop / Company / Support / Sellers) + newsletter.
- Added Space Grotesk font via next/font; marquee keyframe animation in globals.css.
- Responsive: desktop 5–6 product cols, mobile 2-col grid, all sections collapse cleanly.
