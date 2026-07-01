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


## Done this session (2026-06-30)
- Installed @supabase/supabase-js + @supabase/ssr 0.12.0.
- lib/supabase/client.ts → createBrowserClient (SSR-aware cookie client).
- lib/supabase/server.ts → createServerClient + await cookies(), anon key only (NOT service role).
- lib/supabase/admin.ts (new) — service-role admin client, server-only, autoRefresh off.
- middleware.ts (new) — session token refresh via getUser() on every request.
- components/auth/auth-provider.tsx (new) — real AuthProvider; session from Supabase, role from public.users downcased (BUYER→buyer); guests keep localStorage demo override; context shape identical to old DemoRoleProvider.
- components/auth/demo-role-provider.tsx → 1-line shim, re-exports AuthProvider as DemoRoleProvider + useDemoRole. All 35+ existing imports unchanged.
- components/auth/auth-card.tsx → real email/password forms; signUp uses emailRedirectTo = window.location.origin + /auth/callback; try/catch/finally so spinner always clears.
- app/auth/callback/route.ts (new) — PKCE code exchange (exchangeCodeForSession via SSR cookie client); redirects to / on success, /login?error=... on failure or missing code.
- app/actions/auth.ts (new) — signoutAction() server action (not yet wired to UI).
- app/login/page.tsx → async, awaits searchParams, shows sangria error banner when ?error= param present.
- Wrote supabase/migrations/0001_user_layer.sql — Slice 1a user layer SQL ready to run manually.
  Tables: public.users, public.user_profiles, public.addresses + user_role enum.
  Includes: auto-provision trigger (on auth.users insert), updated_at trigger, RLS on all 3 tables.
- Audited all 57 Claude skill folders in website/.agents/skills/.
  Report written to .agents/SKILLS_AUDIT_REPORT.md.
  Key finding: seo/hooks/hooks.json contains a PostToolUse hook that auto-runs on every Edit/Write — DO NOT register it.
  15 skills recommended ACTIVE immediately, 34 parked, 4 recommended for deletion.

## Next up (immediate)
- [ ] Run 0001_user_layer.sql in Supabase SQL Editor. Verify all 3 tables appear with RLS ON.
- [ ] Test auth end-to-end: signup → confirm email → login → verify public.users row + BUYER role.
- [ ] Wire signoutAction to Navbar logout button.
- [ ] Add getClaims()-based route protection to middleware for /account, /orders, /seller, /admin.

## Done previous session
- Added CLAUDE.md + PROGRESS.md (project context + rules).
- Built full homepage: HeroCarousel, CategoryStrip, FeaturedLabels (marquee), ProductRow (reusable ×3), MosaicSection, AiStylistBanner, TrustBar.
- All content typed in lib/home-data.ts — zero hardcoded JSX content.
- Updated Navbar (New In / Sneakers / Streetwear / Watches / Brands / AI Stylist with cyan dot).
- Rebuilt buyer Footer with 4 columns (Shop / Company / Support / Sellers) + newsletter.
- Added Space Grotesk font via next/font; marquee keyframe animation in globals.css.
- Responsive: desktop 5–6 product cols, mobile 2-col grid, all sections collapse cleanly.
