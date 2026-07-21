# SKXNZ LAUNCH WAR — DAY 10-B: CONFIGURED LOCALHOST VISUAL QA

Date: 2026-07-21
Branch: `claude/d10b-visual-qa` (worktree, base `189c558`)
Localhost: http://localhost:3002 (dev server started by QA run from this worktree; `.env.local` copied from main repo, values never opened/printed)

## Method note
Browser-pane screenshots timed out consistently in this environment, so evidence is DOM/text-based: rendered page text, anchor/image audits via in-page JS, SSR HTML checks via curl, console error reads, and 390px viewport overflow probes. No screenshots captured — screenshot paths are therefore absent from route results.

## Static gates (before and after docs)
- `pnpm run test:commerce` — **124 tests, 124 pass, 0 fail**
- `tsc --noEmit --incremental false` — clean (exit 0)
- `git diff --check` — clean

## Headline findings
1. **P1 — Homepage product cards are fallback fiction.** "Trending Now" / "New In" / "Luxury Finds" cards (VANTA, AXIS, HALO…) do not exist in the live catalog; every card links to generic `/shop` (91 anchors to `/shop` on the homepage, zero `/product/...` anchors). Buyer clicks a specific product and lands on an unrelated grid.
2. **P1 — Catalog is effectively imageless.** Homepage renders 2 `<img>` total (both brand logos); `/shop` SSR has 1 `<img>`; product detail 1 `<img>`. All product cards are text/gradient placeholders — the core "felt worse" driver.
3. **P1 — `/ai-stylist` exposes internal demo gate.** Public buyers see "DEMO ACCESS REQUIRED" with "CONTINUE AS BUYER / SELLER / ADMIN" role switcher; SSR h1 is "Checking saved demo role."
4. **P1 — Demo copy leaks on `/shop`.** Brand rail shows "DEMO ATELIER", "Demo premium fashion label used for marketplace testing", "curated demo brand stack".
5. **P2 — Currency mismatch.** `/shop` price filter uses `$150/$250/$350` bands while all prices render in ₹.
6. **P3 — Title template duplication.** `/checkout` → "Checkout Review | SKXNZ | SKXNZ", same double suffix on `/support`, `/returns`.

Full details: `docs/launch-war/day10/visual-qa/`.

## Route summary
All 15 audited routes return 200 or a correct 307 auth redirect to `/login?next=...`. No 404/500 after env fix (worktree initially 500'd because untracked `.env.local` was absent — copied from main repo, contents unread). No console red errors observed on inspected pages.

## Fixes made
None to source. Doc-only run: the obvious candidates (demo gate copy, metadata title template, homepage fallback catalog) are cross-file/data-layer changes, out of micro-fix scope. See `DAY10C_BUYER_UI_RECOVERY_PLAN.md`.

## Verdict
Structure and truthfulness are solid; the buyer-facing regression is presentation: imageless cards, fictional homepage products, and demo-mode copy leaking into public surfaces. Recovery is a Day 10-C task, evidence-driven, no full rebuild required.
