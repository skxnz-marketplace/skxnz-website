# SKXNZ release candidate review — 2026-10-03

## 1. Executive summary

**Decision: not technically ready for preview or production.** One confirmed release blocker must be fixed before either: unescaped catalogue text in newly added JSON-LD scripts permits stored script injection. No findings were fixed during this review.

The release was reviewed as the complete canonical branch, not just Phase 1B. Current branch: `integrate/recover-missing-work`; reviewed HEAD: `63c649aec98484e9a1c33c5f448d769efd2f83e8`. The working tree was clean at the start. This report and the required progress entry are documentation-only, uncommitted additions after the review.

Release findings: **1 BLOCKER, 4 HIGH, 8 MEDIUM, 4 LOW**. The previously reported `public.users` grants are recorded separately as post-release hardening, not included in those counts.

GA4 and consent survive the release. All 22 directly called database tables and all eight called commerce RPC signatures exist in the live API schema; 256 explicit selected-column checks found no missing columns. Public live reads returned six ACTIVE products, eleven brands and six categories. This is strong schema evidence, not a fresh verification of every live policy, function body, storage policy or signed-in mutation.

Typecheck, lint, 208 tests, production build and local production HTTP smoke pass, subject to the limitations in section 16. Passing these checks does not clear the script-injection blocker, visual QA, real Chrome Turnstile verification, private-flow QA or provider configuration verification.

After the blocker is fixed and verified, a non-promoted preview is appropriate for QA. Production approval must refer to the exact revised SHA and resolve or explicitly accept/gate the HIGH findings. The release can only launch catalogue browsing and **unpaid order intents**. Real payment capture remains disabled until atomic stock revalidation and reduction are built and verified at the payment/order boundary.

No push, deployment, branch movement, migration, Supabase change, production-data change, Vercel change, application fix, archive change, safety-bundle change or `ga4-skxnz` access was performed.

## 2. Actual-live versus candidate delta

Actual live baseline supplied by the owner and present in local Git: `06d78d58265b4b11b4bdc83e68da29124cb72c94`, the 2026-09-27 GA4 deployment. It is an ancestor of the candidate.

| Measure | Actual live → candidate |
| --- | ---: |
| Reachable commits added, including merges | 50 |
| Changed files, rename-aware | 346 |
| Text additions | 14,887 |
| Text deletions | 5,364 |

Major changed directories: `components` 119 files, `docs` 67 (plus six root-document moves into docs), `app` 62, `lib` 44, `supabase` 12, `src` 10 and `tests` eight. Root configuration, documentation, project-data and recovered-history changes account for the remainder. File counts include documentation and recovery housekeeping, not just executable code. No changed binary assets appear in the baseline diff.

Production users would see a substantially different homepage and navigation, live catalogue data across browsing surfaces, richer PDP/gallery and taxonomy pages, new Prism `/ai`, reworked AI Stylist access, community surfaces, draft checkout/order/support/return workflows and protected staff catalogue/fulfilment tooling. Seller recruitment disappears. Some visible AI and saved-item flows remain incomplete. Public aliases redirect to their canonical paths. The six-product catalogue replaces demo-backed discovery, but the exceptions in section 9 still matter.

The inventory appendices enumerate routes and both complete changed-file lists. Statistics exclude this newly written audit and progress update.

## 3. Production branch versus candidate delta

Production-branch baseline confirmed locally: `launch-war-july30` at `81d863d3a8ae1c6ed89995994687654b7b550886`. It is also an ancestor of the candidate.

| Measure | Production branch → candidate |
| --- | ---: |
| Reachable commits added, including merges | 52 |
| Changed files, rename-aware | 351 |
| Text additions | 14,999 |
| Text deletions | 5,379 |

The extra history includes `57e3142` (Vercel Web Analytics) and `06d78d5` (GA4). The live GA4 line was merged into the canonical branch in `2f96774`.

Moving the production branch therefore adds analytics commits to that branch's history, while skxnz.com users already have those analytics changes. Comparing only with `81d863d` would wrongly present existing live GA4 as a new user-visible feature. Conversely, a Git branch name is not proof of the currently serving Vercel artifact. This audit uses `06d78d5` for user-visible regression analysis and `81d863d` for branch/deployment mechanics.

## 4. Release change map

Risk is technical deployment/reliability risk, including externally visible broken flows. Multiple status labels describe distinct parts of an area; HIGH does not imply permission to enable gated functionality.

| Area | Status | Risk | Resulting behavior / principal concern |
| --- | --- | --- | --- |
| Homepage | Modified | MEDIUM | Hero/video/layout changes, live Trending and Brand Spotlight; static editorial brand/product representations remain. |
| Shop/catalogue | Modified | MEDIUM | Canonical ACTIVE data and explicit error/empty results; stale route/browser caches remain. |
| PDP | Modified | BLOCKER | Live product/gallery, archived lookup exclusion; unsafe new JSON-LD serialization. |
| Search | Modified | LOW | Live suggestions; `/search` redirects to shop. Empty data and query failure have distinct paths. |
| Brands | Modified | BLOCKER | Live index/detail pages; unsafe detail JSON-LD. |
| Categories | Modified | BLOCKER | Live index/detail pages; unsafe detail JSON-LD. |
| Discovery/navigation | Modified | MEDIUM | Live navigation API; successful browser navigation cache has no expiry. |
| Cart | Modified, unfinished | MEDIUM | Device snapshots and variant selection; historical demo/stale items can persist; no server cart sync. |
| Checkout | Modified, gated, unfinished | MEDIUM | Buyer-authenticated unpaid draft intent; no operational capture; authoritative DB pricing. |
| Authentication | Modified | HIGH | Supabase session/role checks retained; production Turnstile configuration and client mode handling need verification. |
| Account | Modified, unfinished | MEDIUM | Private live views alongside unfinished synchronization and legacy preview features. |
| Wishlist/saved items | Modified, unfinished | MEDIUM | Local wishlist and private DB saved-item reads are separate; no working synchronization writes. |
| Orders | Modified, gated | MEDIUM | Private draft/order views; paid lifecycle tools require legitimate externally established paid state. |
| Returns | Modified, gated | MEDIUM | Delivered-order eligibility and quantity checks; no actual refund execution. |
| Support | Modified | MEDIUM | Buyer-owned tickets/messages and admin replies/status; signed-in browser flow still unverified. |
| Community | New/modified, gated, unfinished | MEDIUM | Published live feed and moderated contributor flow; failed reads can look empty. |
| AI Assistant | Modified | HIGH | Public rule-based assistant reads live products but later filters reject live status; recommendations fail. |
| AI Stylist | Modified, gated, unfinished | HIGH | Public guest access UI reaches APIs intentionally disabled in production. |
| Seller surface | Modified, removed, gated | HIGH | Recruitment `/sell` removed; private product/photo/fulfilment tooling remains; upload transport mismatch. |
| Admin surface | Modified, new, gated | HIGH | Protected catalogue/order/return/community tooling; photo upload transport mismatch. |
| Mobile/responsive | Modified | MEDIUM | Hero crop/scroll, drawers, typography, Prism and component layouts require device QA. |
| SEO / metadata / sitemap / robots / schema | Modified | BLOCKER | Live sitemap and schema; JSON-LD injection is a new regression, not an SEO redesign task. |
| Analytics / GA4 / consent | Unchanged live functionality | LOW | GA4 and consent modules preserved; layout still mounts analytics. |
| Turnstile | Existing integration retained | HIGH | Missing keys select dummy test configuration even in production; real Chrome/provider verification outstanding. |
| Supabase/data layer | Modified | MEDIUM | Required tables/RPCs present; schema existence is not complete privilege or mutation validation. |
| Dependencies/build tooling | Modified | LOW | Four used runtime additions; final build succeeds; clean frozen install could not complete offline. |
| Vercel/runtime configuration | Source largely unchanged | MEDIUM | Provider production branch, env, limits, preview linkage and rollback artifact not independently verified. |

## 5. Dependency and configuration review

### Dependency changes

`package.json` / `pnpm-lock.yaml` add four runtime dependencies: `@fontsource/space-grotesk` 5.3.0, `@fontsource/unbounded` 5.3.0, `ogl` 1.0.11 and `zod` 4.6.5. All four have source usages: fonts, Prism WebGL and validation. No unused new package, new lifecycle script in those four, or existing dependency upgrade was found. The lockfile changes are +32/-0.

Installed environment: Node 24.20.0, Next 15.5.15, React 19.2.5, TypeScript 5.9.3. Project package manager is pinned to pnpm 10.33.0. Typecheck/build establish compatibility for this installed tree; they do not establish a fresh provider install.

Existing root postinstall runs Prisma generation. `@prisma/client` has a postinstall; allowed build packages include `@prisma/client`, `@prisma/engines`, `prisma`, `sharp` and `unrs-resolver`. Legacy Prisma application access is unused in the reviewed runtime and adds installation work. `ffmpeg-static` is a development asset-tool dependency with a binary-install script; no production request depends on it. No runtime-only dependency newly placed in devDependencies was found. Service-role access remains in server modules/actions; no direct client import of the privileged Supabase client was found.

### Source configuration

`next.config.ts` adds four permanent redirects, actually HTTP **308** in Next: `/ai-stylist` → `/ai/stylist`; `/ai-tools/product-description` → `/ai/description-generator`; `/ai-tools/product-title` → `/ai/title-generator`; `/ai-tools/product-video-prompt` → `/ai/video-prompt-generator`. No redirect loop was found.

App `tsconfig` and middleware behavior are unchanged versus live. Test configuration expands verification coverage. Tailwind adds signal/impact fonts; PostCSS selects the explicit relative Tailwind configuration. ESLint excludes non-application archives/tooling as documented. No Vercel-specific deployment configuration or GitHub CI delta was found. Mumbai `bom1` is documented, not verified in the provider account.

The photo action accepts 5 MB but Next's installed default server-action transport is 1 MB; see H02. Remote catalogue images bypass Next optimization where appropriate rather than relying on an absent remote-host allowlist. Missing images use placeholders. Browser image load, intrinsic sizing, remote accessibility and CSP remain QA responsibilities. Hero source assets did not change; the new responsive scroll/crop/preload behavior did.

### Environment-variable contract

No new mandatory production variable was introduced. `NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE` is a new optional developer switch; the implementation additionally requires non-production NODE_ENV, so it cannot activate production catalogue fallback. The example file does not list that optional switch.

Production runtime needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` for the corresponding public/auth and staff operations. Some server modules eagerly require privileged configuration, so missing secret configuration is an operational failure, not a harmless empty result. Turnstile requires real site/secret configuration and matching Supabase CAPTCHA settings for real enforcement. Public origin chooses `NEXT_PUBLIC_APP_URL`, then site URL configuration, then `https://skxnz.com`; verify preview origin configuration before testing auth redirects.

AI provider/model/key settings currently describe provider availability; they do not implement a complete external model workflow. Stripe/Razorpay, seller-application, private-beta, legacy Prisma URL and analytics-ID placeholders are not evidence of working features. GA4 uses its explicit public measurement ID; changing an unrelated analytics-ID placeholder does not reconfigure it.

No secret values are included here. No actionable hardcoded localhost URL, obsolete machine path or old repository path was found in production runtime source. Local smoke redirect URLs naturally use localhost; they are not application hardcoding. Provider env values, production/preview scoping and dashboard flags were not accessible for independent verification.

## 6. Database/application contract

Read-only live PostgREST OpenAPI metadata confirms all **22 directly queried tables** and all **eight directly called RPC signatures**. The exact table inventory is in Appendix B. The storage bucket identifier `product-images` is not counted as a table.

| Contract | Live object evidence / application expectations |
| --- | --- |
| Catalogue | Products, variants, media, brands, categories and seller references exist; ACTIVE filtering and expected selected columns match. |
| Saved items | `saved_items` exists; reads are implemented, synchronization writes are not. |
| Order intent / lines | `create_order_intent_atomic`, orders, order_items and event objects exist; authoritative prices, variant eligibility, ownership and idempotency are expected. |
| Seller fulfilment | `seller_update_line_fulfilment`, `seller_active_return_indicators`, line/event objects exist; SQL contains role and owned-line guards. |
| Admin order changes | `admin_update_order_status_atomic` exists; role, transition and event handling are present in reconciled SQL. |
| Support tickets/messages | `create_support_ticket_idempotent`, `add_support_ticket_message_idempotent` and both tables exist; buyer ownership and staff-role semantics are explicit. |
| Return requests/admin | `create_return_request_idempotent`, `admin_update_return_status_atomic` and request/item/event objects exist; delivered eligibility, net quantities and ownership are explicit. |

Eight RPCs: `create_order_intent_atomic`, `seller_update_line_fulfilment`, `seller_active_return_indicators`, `admin_update_order_status_atomic`, `admin_update_return_status_atomic`, `create_support_ticket_idempotent`, `add_support_ticket_message_idempotent`, `create_return_request_idempotent`. Their published argument names match callers. The metadata also exposes expected authorization helpers, including `is_admin` and seller-owned paid-line checking.

Explicit column verification checked **256 selected-column references with zero missing columns**, including handling nested relationship selects. Public queries returned products 6 / brands 11 / categories 6. Anonymous users/private-table access remained denied in read probes. Private privileged row probes were denied by the available credential/request context; they were not used to infer missing tables.

The owner reports 0019 and 0020 applied and verified; the latest reconciliation document records 0020 at 2026-10-02 20:46 UTC and applied-content fingerprint verification. This review inspected the reconciled SQL and published signatures, not the live SQL bodies or every privilege. It did not execute mutations, even rollback-only smoke.

Introduced/recovered migration files include 0002 and 0016–0020. Recovery of an old numbered file does not mean it should be replayed. 0020 supplies the missing commerce contracts; 0019 fixes public taxonomy reads. Application calls object names and columns, not historical migration-number assumptions. **Do not replay the historical migration chain.** Storage bucket/policies and community policy details rely partly on prior applied verification; freshly exercising them requires approved QA fixtures.

## 7. Commerce readiness

### BUILT AND SAFE within the unpaid-intent scope

Public browsing uses ACTIVE data. Order creation checks buyer identity, owned address, quantity bounds, active product and valid variant; DB-authoritative integer-paise prices and idempotency govern the atomic draft header/lines/events write. Server-side price handling includes the reconciled mixed-variant correction. Product/variant rows are locked and stock is checked, but stock is not reduced for a real captured payment.

Seller fulfilment checks authenticated seller ownership of post-payment lines; admin order/return changes check admin authorization and valid transitions. Seller progression is PENDING → ACCEPTED → PACKED → HANDED_TO_DELIVERY. Admin lifecycle covers legitimate paid orders progressing through fulfilment/shipping/delivery and permitted cancellation; current tools do not provide a normal route to mark an unpaid draft PAID or execute refunds.

Returns require a delivered owned order and eligible quantities after prior non-rejected requests. Support tickets/messages are scoped to the buyer or authorized staff. The reconciled security-definer routines contain auth/role checks and fixed search_path rather than assuming RLS alone encodes role meaning.

### BUILT BUT NOT LAUNCHABLE as complete paid commerce

Paid-order lifecycle screens, fulfilment, delivered-order returns and admin review exist, but a normal new draft cannot reach paid/delivered state through an implemented real payment integration. Browser verification of these screens needs approved fixtures; do not fabricate production paid states. Variant-price display and stale-cart reconciliation remain imperfect (M06/M02). Refund review is not refund execution.

### NOT BUILT / MUST REMAIN DISABLED

Real payment capture, signature-verified gateway-to-paid orchestration, atomic stock revalidation **and reduction** at the payment/order boundary, actual refund execution and complete shipping-provider orchestration are not launchable. Local/demo AI role headers, mock AI jobs and seller recruitment remain disabled. Wishlist/account/cart synchronization is unfinished.

No current operational gateway endpoint or clickable real-charge flow was found. Checkout explicitly creates an unpaid draft and its success text does not promise payment confirmation. Keep that limitation explicit; changing payment UI or environment variables is not enough to make capture safe. Do not enable real-money flow during preview QA.

## 8. Authorization and route review

Appendix A enumerates every source page and route handler, including the protected tree. Public surfaces include homepage, shop/product/taxonomy/discovery, editorial/legal pages, public community, AI landing/tools, auth pages and unpaid cart entry. `/checkout` requires authenticated buyer processing for placement. `/account`, `/orders`, `/wishlist` are middleware-protected; some private reads require a user rather than globally asserting BUYER, while buyer-only writes enforce BUYER in the RPC.

`/admin` and `/seller` are middleware role-protected, with login exceptions. Middleware validates the session using getUser and checks the stored role, not a client role header. New product detail/actions perform corresponding server authorization. Legacy static preview staff pages lean on middleware; no new real private-data leak was found through them. Seller line access does not expose arbitrary buyer addresses or full administrative order data.

APIs independently enforce their intended gates: catalogue navigation/search/public assistant are public; AI buyer/seller/admin job/usage/result endpoints reject the demo-role header in production. Community contribution/moderation uses ownership and contributor/admin semantics. Staff support service-client operations check role before use. SECURITY DEFINER callers also have role enforcement in the reconciled SQL; matching existence does not prove that the live bodies equal the file byte-for-byte today.

`/sell` returns 404; `/seller/apply` aliases that removed page and cannot restore recruitment. Four old AI aliases issue 308 to canonical pages. `/search` issues 307 to shop. Unknown/inactive product lookup returns 404. Local production smoke confirmed anonymous protected redirects and production AI-header rejection without exposing protected payloads.

Private route robots exclusions and auth exist, but noindex is not explicit on every private page, including new staff detail pages. Robots disallow alone is not noindex (L02). Real buyer/seller/admin session, cross-owner and contributor flows still require browser QA; this review did not mutate live accounts or orders.

## 9. Live-data consistency

| Surface | Result |
| --- | --- |
| Homepage Trending / Brand Spotlight | Canonical live public layer; query failure hides/errors the relevant area, not demo fallback. |
| Shop / PDP / Brands / Categories | Live ACTIVE layer; genuine empty and failed query are distinct. Archived lookup excluded. |
| Search / Discovery | Live layer; browser navigation cache can retain previous records. |
| Sitemap / Product schema | Live product/taxonomy source; sitemap excludes non-ACTIVE products. Schema serialization is unsafe until B01 is fixed. |
| AI Assistant | Reads live products; downstream legacy approval-status filter rejects them (H01). It does not silently substitute fake recommendations. |
| AI Stylist | Canonical catalogue is available to source, but production role gating prevents operational guest/signed-in API flow (H03). |
| Community references | Live referenced product resolution excludes unavailable products; read failures can masquerade as an empty feed (M03). |

Six ACTIVE products render without a required catalogue-size threshold. Empty brand/category result sets have empty states. Anonymous ACTIVE read was six and ARCHIVED read returned zero visible rows. The user's earlier QA-product archive verification was not independently repeated with privileged access here. The HTTP smoke used unknown/QA-style unavailable slugs; it must not be mistaken for a fresh privileged verification of the exact archived row.

The claim “all public catalogue surfaces are canonical” needs two qualifications. Homepage `FeaturedLabels` still displays nineteen static luxury-brand names rather than the eleven live marketplace brands; `LuxuryFinds` retains editorial product-like references. CategoryShowcase's fixed six slugs happen to match the current live categories but can drift. Also, browser-stored cart/wishlist normalization can retain historical demo IDs or stale snapshots. These are M04/M02, not a newly reintroduced server query-error fallback. The production demo-catalogue opt-in remains impossible.

## 10. Cache/revalidation behavior

| Layer / surface | Policy | Reliability consequence |
| --- | --- | --- |
| Homepage | Route revalidate 300 seconds | Trending/Spotlight may show recently archived or changed records until regeneration. |
| PDP / brands / categories | Revalidate 300 | Status, price, inventory and taxonomy display can remain stale. |
| Shop | Declares 300, but searchParams make built route dynamic | Declaration alone is not evidence of a five-minute static cache. |
| Catalogue React.cache | Request-level deduplication | Shares metadata/body reads within a render, not a persistent global 300-second cache. |
| Supabase public fetch | No explicit custom TTL in wrapper | Route rendering/cache behavior controls resulting page freshness; do not assume every request is uncached. |
| `/api/catalog/navigation` | Static/revalidate 300 | Server navigation payload can be stale. |
| Browser discovery-menu promise | Successful result retained without TTL until reload | Longer-lived stale category/brand records; failures clear promise for retry. |
| Sitemap | force-dynamic | Fresh live filtered URLs on request; no declared five-minute ISR. |
| Search suggestions / public AI assistant | force-dynamic | No explicit shared recommendation/result TTL; assistant semantic bug remains. |
| Community | Declares 60, but cookie-dependent reads make request dynamic | Do not infer guaranteed 60-second ISR from the declaration. |
| Account/orders/checkout | Session-dependent dynamic | Ownership enforced per session; device snapshots are separate. |
| Device cart/wishlist | localStorage, no expiry | Stale/demo/archived snapshots can persist indefinitely. |

Admin product-status actions revalidate shop and PDP ID/slug, but not all homepage, taxonomy and navigation paths. Placement changes revalidate home/shop; gallery changes do not comprehensively invalidate canonical slug and all listing cards. Manual database changes do not automatically invoke Next path invalidation.

The observed five-minute stale period is consistent with 300-second ISR, but 300 is **not a strict maximum**: stale-while-revalidate, regeneration failures and browser caches can extend exposure. Archived product cards, old prices, old stock and stale taxonomy can remain visible. Order RPC eligibility/pricing checks reject stale invalid intent and prevent stale UI from authorizing payment; payment is disabled. Accept M01 explicitly or make a minimal targeted fix. No cache redesign was made.

## 11. Mobile and manual browser QA

Required viewport matrix: desktop **1440 and 1280**; mobile **320, 360, 375, 390, 412 and 430**; tablet **768**. Test each public flow at every width, with keyboard/zoom and touch where applicable. Automated source checks, 200 responses and SSR H1 counts cannot establish visual correctness, hydration, touch interaction, video timing or provider challenge rendering.

| Flow | Manual checks |
| --- | --- |
| Homepage hero / scroll video | Text and CTA clipping, sticky scroll duration, portrait/landscape crop, preload, orientation resize, reduced motion, slow network, low-memory phone, final-section transition. |
| Navigation/drawer/discovery | Menu overlays, focus/escape, scroll locking, touch targets, viewport overflow, live brand/category destinations, sparse results and reload freshness. |
| Shop | Six-product layout, empty filters, sorting, image aspect ratios, cards, prices, unavailable items and error states. |
| PDP | Media/gallery controls, variant stock/selection, quantity, cart snapshot, price agreement, unknown/archived 404, breadcrumb and escaped JSON-LD after fix. |
| Search | Typing/debounce, suggestion focus, no-result versus unavailable backend, clear/submit/navigation. |
| Prism `/ai` | Canvas/WebGL unavailable, context loss, reduced motion, FPS/heat, overlay legibility, cleanup on navigation, touch and narrow screens. |
| AI Stylist | Honest gating; guest/signed-in flow must not present an operational form that returns production 403. Test revised access behavior after H03 resolution. |
| Cart / checkout | Returning-browser stale entries, variant price override, quantity limits, ownership, address selection, duplicate submission/idempotency, explicit unpaid result, no gateway capture. |
| Account / wishlist | Sign-in/out, auth redirects, local versus account saved state, addresses, multi-tab state, empty data, cross-user isolation. |
| Orders / returns / support | Private deep links, ownership, lifecycle labels, permitted/rejected transitions, delivered eligibility/net quantities, staff reply/status and understandable failure recovery. |
| Community | Empty/error distinction, existing product references, contributor gating, moderation, reports and responsive cards. |
| Seller/admin | Correct role denial, own-line access, pending catalogue review, photo size/error recovery, archived detail behavior and protected direct URLs. |

Use ordinary Chrome for real Turnstile: production keys, approved hostname/preview allowlist, challenge completion, expiry/retry, missing/invalid token rejection, login/signup/reset/confirmation and post-auth destination. Source review alone does not confirm browser challenges work.

For GA4, verify no collection before consent, collection after analytics opt-in, once-per-SPA-navigation behavior, withdrawal and persisted opt-out. Preview collection is intentionally disabled by production-host filtering; do not count the absence of preview GA4 traffic as a regression. Validate actual production collection after an approved launch or use an authorized matching-host test arrangement.

Private-flow tests and staff/product/order mutations must use an approved isolated QA database and disposable fixtures, or require separate explicit approval if preview still targets production. Do not create live paid orders, products, returns or support tickets as part of this review. No manual browser QA was performed here.

## 12. SEO/indexability regression review

No SEO redesign was started. Sitemap smoke produced **36 URLs: 13 static, 11 brands, six categories and six ACTIVE products**. It excludes private routes, removed seller recruitment, old AI aliases and draft legal pages. Legal drafts have noindex. Product and breadcrumb schema use live records; root Organization/WebSite schema remains. Product offers are intentionally not advertised as operational paid checkout. Four old aliases redirect once to canonical pages; no redirect loops were found.

The new schema rendering introduces B01. `JSON.stringify` alone is not safe inside an HTML script element; Next's own guidance recommends escaping `<` in serialized JSON. See [Next.js JSON-LD guidance](https://nextjs.org/docs/app/guides/json-ld).

Root-canonical inheritance on some routes, including shop/brands, is pre-existing baseline debt, not a new release SEO regression. Explicit noindex is missing on new staff detail pages even though authentication and robots exclusions exist (L02). Server HTTP H1 inspection cannot prove hydrated headings or all responsive layouts. No demo-product sitemap entries were found; freshly archived entries may remain in cached HTML cards as described in section 10.

## 13. GA4 and consent preservation

**GA4 survives.** `components/consent/*` and `lib/consent/*` are byte-identical versus `06d78d5`; there is no diff in those modules. Root layout still mounts ConsentManager, GoogleAnalytics and Vercel Analytics. Cookie-page changes do not remove consent behavior.

GA4 remains production-host constrained (`skxnz.com` / `www.skxnz.com`), initially denied until consent, with withdrawal/opt-out handling. Enhanced Measurement handles SPA history tracking; no second custom navigation listener was introduced. The separate GA4 history is preserved through merge `2f96774`. Auth/trust tests cover the analytics/consent helpers.

No missing GA4 file/commit was identified, so the user's mandatory stop-on-loss condition does not apply. The separate `ga4-skxnz` worktree/repository was not touched. Real hosted GA4 requests and account reporting were not inspected in this session.

## 14. Turnstile status

`lib/security/turnstile.ts` selects dummy configuration when keys are missing without restricting that fallback to local development. `components/auth/access-form.tsx` calls test-mode logic that considers an unprefixed server secret from client code; that secret is not available to the browser, so mode labeling can incorrectly report test mode even with a real public key. No secret exposure was found.

Authentication forwards `captchaToken` to Supabase auth. Supabase CAPTCHA configuration is therefore the authoritative verification boundary for these auth flows. The standalone server verification helper is not evidence that every login calls it; double-spending a token through two verifiers would also be wrong. With CAPTCHA disabled, a rendered widget is not proof of enforcement; with enabled CAPTCHA and mismatched/missing keys, authentication may fail.

This behavior is retained from the live baseline, not a newly introduced regression, but remains H04 for production readiness. Verify actual provider settings and normal Chrome behavior. Production should fail closed/clearly on absent required configuration; public mode computation must not depend on browser access to a secret.

## 15. Security/privilege notes

B01 is a release-specific stored-script-injection finding. Seller-entered product name/description is validated for ordinary form requirements but not escaped for the JSON-LD HTML context; admin approval changes publication status, not output encoding. It is incorrect to treat moderation as a substitute for encoding.

No practical release-specific privilege increase was established through the known `public.users` grants: anon TRUNCATE/TRIGGER/REFERENCES, authenticated TRUNCATE. Record these as **separate post-release hardening**. The application does not expose a corresponding truncate/DDL endpoint. This does not endorse those grants or claim all possible external database access paths were audited. No DB privilege change was made.

Server authorization is required alongside RLS and is present on reviewed commerce/staff paths. Production AI rejects spoofed local role headers. Complete live RLS, column-grant, function-body and cross-account behavior was not freshly exercised; do not infer those checks from a successful anonymous catalogue read.

## 16. Automated release gates

| Gate | Result | Evidence / limit |
| --- | --- | --- |
| Baseline identity/ancestry | PASS | Exact three SHAs and both ancestor relations confirmed locally. |
| Type generation + app typecheck | PASS | Next typegen; TypeScript `--noEmit --incremental false`. |
| Test TypeScript compilation | PASS | `tsc -p tests/tsconfig.json`. |
| Commerce/catalogue/rate-limit/retry/auth tests | PASS | 208 passed, zero failed; commerce group 173, auth group 35. Mock/isolated tests, no live writes. |
| Lint | PASS with warnings | Zero errors, eight existing informational warnings. |
| Production build | PASS | 82 generated pages with live catalogue reads; no catalogue errors in final build. |
| Route/API smoke | PASS | 108 local production HTTP probes: 60×200, 33×307, 4×308, 8×403, 3×404; no unexpected results. Includes six product, eleven brand and six category detail URLs. |
| Sitemap | PASS | 36 live filtered URLs, no private/alias/demo entries. |
| Live schema/select contract | PASS, scoped | 22 tables, eight signatures, 256 explicit columns; privileged row/policy/mutation checks not repeated. |
| Injection reproduction | CONFIRMED FAILURE | Isolated React server rendering of closing-script payload produces an executable sibling script. No payload was written to DB. |
| Assistant reproduction | CONFIRMED FAILURE | Identical in-stock synthetic item: demo-approved status yields one recommendation; live status yields zero. No production row changes. |
| Frozen install | INCOMPLETE | Offline pinned pnpm attempts lacked package/supply-chain metadata, including font package metadata. Existing lockfile/node_modules build succeeds; no tracked dependency changes. |
| Browser/hosted/private QA | NOT RUN | No visual Chrome, real Turnstile, actual collection, signed-in mutation or provider configuration proof. |
| Diff whitespace | PASS | `git diff --check`. |

Package-manager wrapper behavior required running the installed Node tool entry points equivalent to project scripts: Next typegen, TypeScript, ESLint, Node test runner, `scripts/build-next.mjs` and `scripts/fix-next-vendor-chunks.mjs`. Vendor-chunk fix reported a normal skip when its target directory was absent.

The first local Node fetch/build used an incomplete certificate trust context (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) and could exit zero while catalogue errors appeared. It was **not** counted as valid live-data build evidence. The final build used Node's trusted system certificate store (`NODE_OPTIONS=--use-system-ca`) and generated 82 pages without catalogue errors. Certificate verification was not disabled. This was a local environment correction, not an application edit.

Lint warnings concern unused `_brands`/`_categories` and existing logo-loop hook/image warnings. No code was changed to silence them. Additional live commerce smoke was not run because it would write production data, even if rolled back; the owner's prior verified smoke remains historical evidence.

## 17. Classified findings

### BLOCKER — B01: unescaped JSON-LD permits stored script injection

- **Exact paths:** `app/product/[id]/page.tsx:175` and `:179`; `app/brands/[slug]/page.tsx:112`; `app/categories/[slug]/page.tsx:125`.
- **Behavior:** raw `JSON.stringify(...)` is inserted with dangerouslySetInnerHTML. A catalogue name/description containing `</script><script>window.__rc_jsonld_probe=1</script>` terminates the JSON-LD element and creates an executable script. Product name/description can originate in seller submission (`app/seller/products/new/actions.ts`) and later be approved unchanged. Taxonomy fields share the unsafe sink, though their input is more privileged.
- **Why it blocks:** newly introduced stored browser script execution on public catalogue pages compromises visitors and their session context. Approval/authentication of writers is not output-context protection. Isolated React SSR reproduction confirmed the breakout; no live record was altered.
- **Minimum safe fix:** escape `<` as the literal Unicode escape `\u003c` after JSON serialization at all dynamic JSON-LD sinks, consistently including breadcrumb data. Add a focused malicious-text rendering check and verify isolated browser parsing. No SEO redesign or dependency is necessary. **Fix before preview and production.**

### HIGH — H01: public assistant filters out canonical live products

`src/lib/skxnzAssistant.ts:888` and `:904` still use `isApprovedProduct`, which accepts legacy `Approved Preview`, whereas the live mapper supplies `Active Catalog`. The earlier recommendable predicate accepts live products, then these downstream constraints/ranking reject them. An isolated equal-stock/equal-price reproduction returns one demo recommendation and zero live recommendations; local public API returns an honest unavailable recommendation response, not fake products. Minimum fix: apply the live-aware eligibility predicate consistently in constraints/ranking and test canonical live status.

### HIGH — H02: product photo size contract exceeds action transport

`lib/catalog/upload-actions.ts:25` accepts 5 MB and `components/catalog/product-gallery-manager.tsx:90` advertises it; `next.config.ts` leaves Next's server-action default 1 MB unchanged. Files between approximately 1 and 5 MB can be rejected before validation; the transition also lacks robust thrown transport-error recovery. Installed Next action-handler source confirms the default. No live upload was attempted. Minimum fix: agree UI/action/file maximum with the transport including multipart overhead, or use an appropriate upload mechanism and verify provider payload limits. Do not assume a 5 MB configuration alone satisfies Vercel limits.

### HIGH — H03: public AI Stylist access promises a production-disabled flow

`components/ai/stylist-access-gate.tsx` opens the studio by choosing a guest demo role; `src/lib/ai/safety.ts:20` makes demo-role authorization null in production. Buyer-assistant/outfit/job APIs therefore return 403 even for the advertised guest entry; real Supabase login is not the authorization source for these APIs. Production HTTP probes confirmed rejection of spoofed role headers. The API safety gate predates this release, but the reworked public flow still exposes non-working actions. Minimum fix: truthfully gate the studio/action UI for launch, or implement real server-session role authorization. Never restore production header trust.

### HIGH — H04: production Turnstile configuration is not fail-closed or verified

`lib/security/turnstile.ts:28`/`:33` and `components/auth/access-form.tsx` use fallback/mode semantics described in section 14. Missing production keys do not produce a clear configuration failure, and browser mode logic cannot read the server secret. This is an existing live issue, not proof of a newly broken deployment. Minimum fix/closure: correct public mode computation, prohibit dummy production fallback, and verify actual Supabase CAPTCHA/key/hostname enforcement in ordinary Chrome. Provider configuration was unavailable; do not report enforcement as proven.

### MEDIUM — M01: incomplete catalogue invalidation and long-lived navigation cache

Catalogue status/placement/gallery actions in `lib/catalog` do not invalidate every affected homepage/taxonomy/navigation/canonical-slug path; discovery menu retains a successful client result without TTL. Archived records, stock and prices may remain visible beyond nominal ISR. Minimum safe acceptance: document stale-display scope and maintain authoritative checkout rejection; any fix should be targeted to affected paths, not a cache redesign.

### MEDIUM — M02: returning-browser demo/stale cart and wishlist snapshots

`components/providers/marketplace-provider.tsx` and legacy normalization can retain fixture IDs/stored product snapshots. Canonical fresh catalogue queries do not use production fallback, but existing device state can display stale or historical demo products. Server intent validation prevents unavailable items being ordered. Minimum fix if not accepted: prune/reconcile stored entries against canonical eligibility and provide an unavailable-item state; preserve user intent without silently inventing catalogue data.

### MEDIUM — M03: community query failure appears as an empty successful feed

`lib/community` read helpers warn on some post/styleboard/report errors then return empty results with backend readiness still true. Missing-table handling is not the same as arbitrary query failure. Minimum fix: propagate explicit unavailable/error state for those branches. No fake catalogue fallback was observed.

### MEDIUM — M04: static homepage editorial references do not match live catalogue

Homepage `FeaturedLabels`, `LuxuryFinds` and fixed `CategoryShowcase` references retain brand/product-like editorial content. Nineteen static luxury labels differ from eleven live brands; six fixed category links currently match but can drift. Minimum fix/acceptance: distinguish honest editorial content from actual available inventory or hide unsupported marketplace claims; avoid an opportunistic homepage redesign.

### MEDIUM — M05: saved-items schema does not make wishlist sync operational

Marketplace local wishlist writes and `getSavedItems()` account reads are separate; former saved-item action implementation was removed and no corresponding synchronization write path is wired. Users can save locally and see a different/empty account view. Minimum safe acceptance: label local-only state truthfully and keep sync promises gated; build synchronization separately.

### MEDIUM — M06: displayed base price can differ from authoritative variant price

PDP/cart snapshot paths display product base price while the order RPC uses a variant override where present. The DB calculation is safe, but visible reconciliation/price-change notice is incomplete. Minimum fix before enabling payments: display/reconfirm authoritative selected-variant totals. For unpaid intents only, this can ship if explicitly accepted and explained.

### MEDIUM — M07: Prism renderer lacks a resilient WebGL-unavailable fallback

The Prism OGL component constructs its renderer without guarding initialization failure. Reduced-motion/FPS/device adjustments do not cover unavailable WebGL or lost context. Older/constrained devices can show an error/blank island. Minimum fix: guard initialization and provide a static visual fallback; verify context-loss and reduced-motion paths in browser QA.

### MEDIUM — M08: error boundaries falsely guarantee no submission

`app/error.tsx:35`/`:36` and `app/global-error.tsx:69`/`:70` say nothing was charged or submitted. A draft may commit before a subsequent render/navigation fails. Payment is disabled, but the submission guarantee is still false. Minimum fix: neutral recovery text instructing users to check order state; do not imply a transaction was rolled back.

### LOW — L01: unused legacy Prisma/build burden

Legacy Prisma dependencies/generation remain without an active runtime importer. This is not a new package incompatibility and the build passed. Review removal separately; do not refactor during this audit.

### LOW — L02: explicit private noindex omissions

New `app/admin/products/[id]/page.tsx` and `app/seller/products/[id]/page.tsx` lack explicit noindex, relying on auth and robots exclusion. Baseline canonical inheritance debt is separate and unchanged. Add minimal private metadata when authorized; no SEO project is required.

### LOW — L03: legacy staff login copy and internal alias hops

Some staff-login copy still says demo auth is not connected despite real session/role gates. Internal links still using `/ai-stylist` make a harmless 308 hop. Correct copy/links separately; no loop or protected-data leak was found.

### LOW — L04: eight informational lint warnings

Unused props and logo-loop hooks/image warning remain. They do not fail lint/build and were not changed for cosmetic gate output.

## 18. Preview deployment plan — future only

1. Fix B01 under a separate instruction, run its focused verification and repeat affected release gates. Freeze the exact new candidate SHA and account for any other authorized fixes.
2. Restore normal write access for the authenticated GitHub identity `ipcplindia` to `skxnz-marketplace/skxnz-website`. The user's reported access block was not re-tested by pushing. Do not change remotes or force push.
3. Before any push, verify the Vercel project/team, configured production branch `launch-war-july30`, environment scoping, Git integration and preview database linkage. An integration-branch push must produce only a preview.
4. Once access and deployment behavior are verified and the authorized release step is approved, push normally: `git push origin integrate/recover-missing-work`.
5. Allow preview deployment; verify deployed source SHA/build/environment. **Do not promote preview.** Run section 11 browser QA and the revised smoke/schema/sitemap checks against the actual artifact.
6. Keep payments, production demo headers, mock jobs and unfinished flows disabled/gated. Do not mutate production data merely because the preview points at it.

No step above was executed. Passing a local build is not approval to push an integration branch with an unverified deployment trigger.

## 19. Production deployment plan — after exact-SHA approval only

Production is **not approved or ready now**. After B01 is fixed, HIGH findings resolved or explicitly accepted/gated, preview QA passes, frozen clean install/provider build succeeds and rollback checks pass, obtain approval for the exact candidate SHA.

Refresh remote branch state at that future stage and confirm the production branch has no divergent work. Move candidate to production only through a normal fast-forward workflow, for example the approved push `git push origin integrate/recover-missing-work:launch-war-july30` after verifying ancestry and the approved SHA. Never force push; stop if history has diverged. The production branch name alone must not substitute for artifact identity.

Verify the resulting Vercel artifact and skxnz.com domain mapping. Smoke public catalogue, private auth redirects, six-product sitemap, GA4/consent, real Chrome Turnstile and unpaid checkout behavior. Observe errors/cache regeneration. Do not replay migrations; 0019/0020 are already reported applied. Real paid commerce remains disabled until stock/capture integration is separately completed and approved.

## 20. Rollback plan

Previously identified rollback artifact: **`dpl_3jcbgTobUaMQTmTfzmX5SeZHnkHB`**. Intended application baseline: **`06d78d5`**, the actual live GA4 deployment, not merely branch head `81d863d`.

Before relying on it, confirm in the correct Vercel project/team that the deployment exists, is READY/retained/reachable, resolves to source `06d78d5`, serves the expected GA4/consent artifact, has appropriate runtime environment and can receive the production aliases. Check compatibility with the now-additive live 0019/0020 schema and inspect provider rollback permissions. Verify the current live artifact/domain mapping immediately before deployment and record it.

This review could not independently access the provider artifact/configuration, so the supplied rollback ID is a **target requiring verification**, not a freshly certified usable deployment. No rollback was executed.

Rolling back a Vercel alias restores an application artifact; it does not revert Git history, database migrations or production rows. Keep the reconciled additive schema unless a separately reviewed DB operation is explicitly authorized. Do not use `81d863d` as an automatic rollback substitute: it predates the live analytics work.

## Evidence and verification boundaries

The accompanying sanitized evidence file records baseline statistics, route inventory, table/RPC/column checks, HTTP smoke, dependency lifecycle inspection and isolated reproductions. Scratch build/test logs remain outside the application repository. No secret values or private customer rows were exported.

Not independently verified: actual current Vercel artifact/domain metadata; provider production-branch/environment/runtime limits; rollback artifact availability; a fresh clean frozen install; live function bodies/grants/storage policies; real Chrome visuals/Turnstile; actual GA4 collection; signed-in ownership/role flows and mutations. The owner's previously verified migration/smoke results are attributed as historical evidence, not represented as new executions.

## Appendix A — complete source route inventory

Route groups are normalized in the inventory. Authorization is determined by middleware, layouts, server helpers and handlers together; a missing inline guard in a page is not by itself evidence of public access. Dynamic parameter routes are expanded in smoke where current public records exist.

| Route | Source | Boundary |
| --- | --- | --- |
| `/about` | `app/about/page.tsx` | Public / page-specific |
| `/account/addresses` | `app/account/addresses/page.tsx` | Session middleware / private helpers |
| `/account/cart-sync` | `app/account/cart-sync/page.tsx` | Session middleware / private helpers |
| `/account/orders` | `app/account/orders/page.tsx` | Session middleware / private helpers |
| `/account` | `app/account/page.tsx` | Session middleware / private helpers |
| `/account/profile` | `app/account/profile/page.tsx` | Session middleware / private helpers |
| `/account/returns` | `app/account/returns/page.tsx` | Session middleware / private helpers |
| `/account/support/[id]` | `app/account/support/[id]/page.tsx` | Session middleware / private helpers |
| `/account/support` | `app/account/support/page.tsx` | Session middleware / private helpers |
| `/account/wishlist` | `app/account/wishlist/page.tsx` | Session middleware / private helpers |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | Staff role middleware; login exception |
| `/admin/community` | `app/admin/community/page.tsx` | Staff role middleware; login exception |
| `/admin/content` | `app/admin/content/page.tsx` | Staff role middleware; login exception |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | Staff role middleware; login exception |
| `/admin/login` | `app/admin/login/page.tsx` | Staff role middleware; login exception |
| `/admin/operations` | `app/admin/operations/page.tsx` | Staff role middleware; login exception |
| `/admin/orders/[id]` | `app/admin/orders/[id]/page.tsx` | Staff role middleware; login exception |
| `/admin/orders` | `app/admin/orders/page.tsx` | Staff role middleware; login exception |
| `/admin` | `app/admin/page.tsx` | Staff role middleware; login exception |
| `/admin/products/[id]` | `app/admin/products/[id]/page.tsx` | Staff role middleware; login exception |
| `/admin/products` | `app/admin/products/page.tsx` | Staff role middleware; login exception |
| `/admin/returns/[id]` | `app/admin/returns/[id]/page.tsx` | Staff role middleware; login exception |
| `/admin/returns` | `app/admin/returns/page.tsx` | Staff role middleware; login exception |
| `/admin/sellers` | `app/admin/sellers/page.tsx` | Staff role middleware; login exception |
| `/admin/support/[id]` | `app/admin/support/[id]/page.tsx` | Staff role middleware; login exception |
| `/admin/support` | `app/admin/support/page.tsx` | Staff role middleware; login exception |
| `/admin/users` | `app/admin/users/page.tsx` | Staff role middleware; login exception |
| `/ai/description-generator` | `app/ai/description-generator/page.tsx` | Public / page-specific |
| `/ai` | `app/ai/page.tsx` | Public / page-specific |
| `/ai/stylist` | `app/ai/stylist/page.tsx` | Public / page-specific |
| `/ai/title-generator` | `app/ai/title-generator/page.tsx` | Public / page-specific |
| `/ai/video-prompt-generator` | `app/ai/video-prompt-generator/page.tsx` | Public / page-specific |
| `/api/ai-assistant` | `app/api/ai-assistant/route.ts` | Handler-specific (see section 8) |
| `/api/ai/audit-logs` | `app/api/ai/audit-logs/route.ts` | Handler-specific (see section 8) |
| `/api/ai/buyer-assistant` | `app/api/ai/buyer-assistant/route.ts` | Handler-specific (see section 8) |
| `/api/ai/outfit-builder` | `app/api/ai/outfit-builder/route.ts` | Handler-specific (see section 8) |
| `/api/ai/outfit-results/[id]` | `app/api/ai/outfit-results/[id]/route.ts` | Handler-specific (see section 8) |
| `/api/ai/seller-product-check` | `app/api/ai/seller-product-check/route.ts` | Handler-specific (see section 8) |
| `/api/ai/try-on/jobs/[id]` | `app/api/ai/try-on/jobs/[id]/route.ts` | Handler-specific (see section 8) |
| `/api/ai/try-on/jobs` | `app/api/ai/try-on/jobs/route.ts` | Handler-specific (see section 8) |
| `/api/ai/usage` | `app/api/ai/usage/route.ts` | Handler-specific (see section 8) |
| `/api/catalog/navigation` | `app/api/catalog/navigation/route.ts` | Handler-specific (see section 8) |
| `/api/search/suggestions` | `app/api/search/suggestions/route.ts` | Handler-specific (see section 8) |
| `/auth/callback` | `app/auth/callback/route.ts` | Public / page-specific |
| `/authenticity` | `app/authenticity/page.tsx` | Public / page-specific |
| `/brands/[slug]` | `app/brands/[slug]/page.tsx` | Public / page-specific |
| `/brands` | `app/brands/page.tsx` | Public / page-specific |
| `/cart` | `app/cart/page.tsx` | Public / page-specific |
| `/categories/[slug]` | `app/categories/[slug]/page.tsx` | Public / page-specific |
| `/checkout` | `app/checkout/page.tsx` | Authenticated placement |
| `/checkout/success` | `app/checkout/success/page.tsx` | Public / page-specific |
| `/community-guidelines` | `app/community-guidelines/page.tsx` | Public / page-specific |
| `/community` | `app/community/page.tsx` | Public / page-specific |
| `/contact` | `app/contact/page.tsx` | Public / page-specific |
| `/cookies` | `app/cookies/page.tsx` | Public / page-specific |
| `/faq` | `app/faq/page.tsx` | Public / page-specific |
| `/forgot-password` | `app/forgot-password/page.tsx` | Public / page-specific |
| `/llms.txt` | `app/llms.txt/route.ts` | Public / page-specific |
| `/login` | `app/login/page.tsx` | Public / page-specific |
| `/orders/[id]` | `app/orders/[id]/page.tsx` | Session middleware / private helpers |
| `/orders` | `app/orders/page.tsx` | Session middleware / private helpers |
| `/` | `app/page.tsx` | Public / page-specific |
| `/privacy` | `app/privacy/page.tsx` | Public / page-specific |
| `/product/[id]` | `app/product/[id]/page.tsx` | Public / page-specific |
| `/reset-password` | `app/reset-password/page.tsx` | Public / page-specific |
| `/returns` | `app/returns/page.tsx` | Public / page-specific |
| `/search` | `app/search/page.tsx` | Public / page-specific |
| `/sell` | `app/sell/page.tsx` | Removed / 404 |
| `/seller-terms` | `app/seller-terms/page.tsx` | Public / page-specific |
| `/seller/analytics` | `app/seller/analytics/page.tsx` | Staff role middleware; login exception |
| `/seller/apply` | `app/seller/apply/page.tsx` | Removed / 404 |
| `/seller/dashboard` | `app/seller/dashboard/page.tsx` | Staff role middleware; login exception |
| `/seller/inventory` | `app/seller/inventory/page.tsx` | Staff role middleware; login exception |
| `/seller/login` | `app/seller/login/page.tsx` | Staff role middleware; login exception |
| `/seller/orders/[id]` | `app/seller/orders/[id]/page.tsx` | Staff role middleware; login exception |
| `/seller/orders` | `app/seller/orders/page.tsx` | Staff role middleware; login exception |
| `/seller` | `app/seller/page.tsx` | Staff role middleware; login exception |
| `/seller/products/[id]` | `app/seller/products/[id]/page.tsx` | Staff role middleware; login exception |
| `/seller/products/new` | `app/seller/products/new/page.tsx` | Staff role middleware; login exception |
| `/seller/products` | `app/seller/products/page.tsx` | Staff role middleware; login exception |
| `/seller/tools` | `app/seller/tools/page.tsx` | Staff role middleware; login exception |
| `/shipping` | `app/shipping/page.tsx` | Public / page-specific |
| `/shop` | `app/shop/page.tsx` | Public / page-specific |
| `/signup` | `app/signup/page.tsx` | Public / page-specific |
| `/support` | `app/support/page.tsx` | Public / page-specific |
| `/terms` | `app/terms/page.tsx` | Public / page-specific |
| `/waitlist` | `app/waitlist/page.tsx` | Public / page-specific |
| `/wishlist` | `app/wishlist/page.tsx` | Session middleware / private helpers |

Also reviewed generated metadata routes: `/sitemap.xml`, `/robots.txt`; Next redirects are listed in section 5. These are not inferred from browser links alone.

## Appendix B — direct table and RPC contract inventory

| Direct table | Present in live OpenAPI |
| --- | --- |
| `addresses` | Yes |
| `brands` | Yes |
| `categories` | Yes |
| `community_likes` | Yes |
| `community_poster_grants` | Yes |
| `community_posts` | Yes |
| `community_reports` | Yes |
| `community_saves` | Yes |
| `order_events` | Yes |
| `order_item_events` | Yes |
| `order_items` | Yes |
| `orders` | Yes |
| `product_images` | Yes |
| `product_variants` | Yes |
| `products` | Yes |
| `return_request_items` | Yes |
| `return_requests` | Yes |
| `saved_items` | Yes |
| `style_boards` | Yes |
| `support_ticket_messages` | Yes |
| `support_tickets` | Yes |
| `users` | Yes |

| RPC | Published argument names | Present |
| --- | --- | --- |
| `add_support_ticket_message_idempotent` | `p_idempotency_key`, `p_message`, `p_sender_role`, `p_ticket_id` | Yes |
| `admin_update_order_status_atomic` | `p_next_status`, `p_note`, `p_order_id` | Yes |
| `admin_update_return_status_atomic` | `p_next_status`, `p_note`, `p_request_id` | Yes |
| `create_order_intent_atomic` | `p_idempotency_key`, `p_items`, `p_note`, `p_shipping_address_id` | Yes |
| `create_return_request_idempotent` | `p_idempotency_key`, `p_items`, `p_note`, `p_order_id`, `p_reason` | Yes |
| `create_support_ticket_idempotent` | `p_category`, `p_idempotency_key`, `p_message`, `p_order_id`, `p_subject` | Yes |
| `seller_active_return_indicators` | `p_order_item_ids` | Yes |
| `seller_update_line_fulfilment` | `p_action`, `p_next_status`, `p_note`, `p_order_item_id` | Yes |

Environment inventory below lists names and source usage only, never values. Optional/unused placeholders are not production requirements.

```json
{
  "NEXT_PUBLIC_SUPABASE_URL": [
    "app/account/page.tsx",
    "lib/supabase/admin.ts",
    "lib/supabase/client.ts",
    "lib/supabase/public-catalog.ts",
    "lib/supabase/server.ts"
  ],
  "NEXT_PUBLIC_APP_URL": [
    "app/layout.tsx",
    "lib/site.ts"
  ],
  "NEXT_PUBLIC_SITE_URL": [
    "app/layout.tsx",
    "lib/site.ts"
  ],
  "NODE_ENV": [
    "lib/catalog/demo-fallback.ts",
    "lib/prisma.ts",
    "src/lib/ai/safety.ts"
  ],
  "NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE": [
    "lib/catalog/demo-fallback.ts"
  ],
  "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY": [
    "lib/security/turnstile.ts",
    "lib/security/turnstile.ts"
  ],
  "CLOUDFLARE_TURNSTILE_SECRET_KEY": [
    "lib/security/turnstile.ts",
    "lib/security/turnstile.ts"
  ],
  "NEXT_PUBLIC_APP_NAME": [
    "lib/site.ts"
  ],
  "NEXT_PUBLIC_WAITLIST_URL": [
    "lib/site.ts"
  ],
  "SUPABASE_SECRET_KEY": [
    "lib/supabase/admin.ts"
  ],
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": [
    "lib/supabase/client.ts",
    "lib/supabase/public-catalog.ts",
    "lib/supabase/server.ts"
  ],
  "OPENAI_API_KEY": [
    "src/lib/ai/provider.ts"
  ],
  "AI_PROVIDER": [
    "src/lib/ai/provider.ts"
  ],
  "OPENAI_MODEL": [
    "src/lib/ai/provider.ts"
  ]
}
```

## Appendix C — complete actual-live commit delta

Counts include merge commits.

```text
9e6fe8d chore(build): improve production readiness
1a1b794 fix(commerce): harden buyer idempotency
5f48be9 feat(security): add centralized rate-limit framework
2543a08 feat(ui): launch polish and production readiness
c68ec8a feat(ui): improve marketplace catalog readiness
b17cb37 feat(ui): apply luxury storefront polish
7f1f76c perf(rsc): dedupe per-request catalog fetches and drop dead fonts
e201ea5 chore(db): recover canonical 0002 catalog layer migration, seed and verification
ba5db1f fix(build): point Tailwind at its config explicitly
be887e0 feat(home): give the scroll film a portrait framing on phones
b13e66f fix(ai): keep the floating assistant clear of content on phones
47c6226 feat(ui): mobile responsive pass across buyer surfaces
a5993b2 fix(nav): point AI Stylist links at /ai/stylist; loosen order totals on phones
84229d7 fix(ui): 16px phone selects and rotation-safe hero/assistant sizing
556cfb2 merge: integrate mobile responsive pass
14b04b0 feat(home): restore React Bits Prism experience
c8dedf7 feat(home): replace empty scaffold sections with real content
b14e52a feat(home): 3 new sections, replace category strip, fix trust-bar copy
21c6765 SEO infra: dynamic sitemap, robots, llms.txt, canonical AI routes
47fdce0 SEO metadata, structured data, and one-H1 semantic pass
8ecf283 Fix brand-title double-suffix and llms.txt draft-policy links
2e129bd Remove seller surface from the buyer-facing website
5f053dd Draft SKXNZ Community v1 schema (migration, not yet applied)
b2775ca Apply 0017 to Supabase; sync local file with advisor fixes
cd7ffeb Wire SKXNZ Community to the real Supabase backend
e48d504 Add admin UI for Style Boards create/publish/delete
98d4f5b Real catalogue photo upload + homepage placement
d53edc7 Add zod runtime validation to community server actions
f504420 Retry transient connection failures for Supabase and Turnstile
ad73c1e Point mislabelled trending product images at the fallback
ec1525f Add inline SKXNZ assistant chat and Prism/typography polish
0a4e020 Limit automatic fetch retries to reads
2f96774 Merge GA4 production line (06d78d5) into integrate/recover-missing-work
41b9ddd Repo hygiene: ignore local-only files, scope lint to app source, drop broken gitlinks
bd6ff7d Document sources of truth, deployment state and repo layout; archive stale docs
9e68236 Allow the CommonJS require in postcss.config.js
ebe271f docs: finalize SKXNZ workspace normalization
08e62f1 docs: point sheet importer notes at repo-relative scripts
b315d66 docs: Phase 1A live data architecture audit
6f5fc1a db: 0019 fix anonymous brand/category reads (not yet applied)
0cc3f0a catalog: add canonical public catalogue layer with explicit error semantics
c999a16 test: cover public catalogue error semantics and demo boundary
844278a docs: add DATA_ARCHITECTURE and Phase 1B audit addendum
a99f936 catalog: move buyer surfaces onto the public catalogue layer
a3d70f9 docs: record 0019 application and QA product archive
e62ab62 docs: record launch-war-july30 as the production branch
839ce5a db: 0020 forward-only catch-up of missing commerce objects (not applied)
cbf688a docs: record commerce DB reconciliation and 0020 test evidence
a836095 db: harden 0020 buyer support/return RPCs after review (not applied)
63c649a docs: record production application and verification of 0020
```

## Appendix D — complete changed-file deltas

These are Git name/status inventories; archived paths are listed as history deltas, not modified or opened by this review.

### Actual live `06d78d5` → reviewed candidate

```text
M	.env.example
M	.gitignore
M	AGENTS.md
M	CLAUDE.md
M	PROGRESS.md
M	README.md
D	SKXNZ_SKILL_EXPORTS/_upstream/impeccable
D	SKXNZ_SKILL_EXPORTS/_upstream/obsidian-skills
D	SKXNZ_SKILL_EXPORTS/_upstream/taste-skill
M	app/about/page.tsx
M	app/account/addresses/page.tsx
M	app/account/page.tsx
M	app/account/returns/page.tsx
M	app/account/support/[id]/page.tsx
M	app/account/support/page.tsx
M	app/admin/community/page.tsx
M	app/admin/login/page.tsx
A	app/admin/products/[id]/page.tsx
M	app/admin/sellers/page.tsx
D	app/ai-stylist/page.tsx
D	app/ai-tools/product-description/page.tsx
D	app/ai-tools/product-title/page.tsx
D	app/ai-tools/product-video-prompt/page.tsx
M	app/ai/description-generator/page.tsx
A	app/ai/page.tsx
M	app/ai/stylist/page.tsx
M	app/ai/title-generator/page.tsx
M	app/ai/video-prompt-generator/page.tsx
M	app/api/ai-assistant/route.ts
M	app/api/ai/buyer-assistant/route.ts
M	app/api/ai/outfit-builder/route.ts
M	app/api/ai/seller-product-check/route.ts
M	app/api/ai/try-on/jobs/route.ts
A	app/api/catalog/navigation/route.ts
M	app/api/search/suggestions/route.ts
M	app/authenticity/page.tsx
M	app/brands/[slug]/page.tsx
M	app/brands/page.tsx
M	app/cart/page.tsx
M	app/categories/[slug]/page.tsx
M	app/checkout/success/page.tsx
M	app/community-guidelines/page.tsx
M	app/community/page.tsx
M	app/contact/page.tsx
M	app/cookies/page.tsx
A	app/error.tsx
A	app/global-error.tsx
M	app/globals.css
M	app/layout.tsx
A	app/llms.txt/route.ts
M	app/not-found.tsx
M	app/orders/[id]/page.tsx
M	app/orders/page.tsx
M	app/page.tsx
M	app/privacy/page.tsx
M	app/product/[id]/page.tsx
M	app/robots.ts
M	app/sell/page.tsx
M	app/seller-terms/page.tsx
M	app/seller/dashboard/page.tsx
M	app/seller/login/page.tsx
M	app/seller/page.tsx
A	app/seller/products/[id]/page.tsx
M	app/seller/products/new/actions.ts
M	app/seller/products/new/page.tsx
M	app/shipping/page.tsx
M	app/shop/page.tsx
M	app/sitemap.ts
M	app/support/page.tsx
M	app/terms/page.tsx
M	app/waitlist/page.tsx
M	components/account/account-saved-items.tsx
M	components/account/account-shell.tsx
M	components/account/address-book-live.tsx
M	components/account/address-book.tsx
M	components/account/address-form.tsx
M	components/account/cart-sync-status.tsx
M	components/account/demo-order-card.tsx
M	components/account/order-detail-demo.tsx
D	components/account/order-history-demo.tsx
M	components/account/profile-card.tsx
M	components/account/style-preferences.tsx
M	components/account/wishlist-grid.tsx
A	components/admin/admin-product-placement-panel.tsx
M	components/admin/admin-product-review-panel.tsx
M	components/admin/admin-seller-review-panel.tsx
M	components/admin/community-moderation-table.tsx
A	components/admin/community-poster-grants-panel.tsx
A	components/admin/community-style-boards-panel.tsx
M	components/ai/ai-outfit-builder-panel.tsx
M	components/ai/ai-stylist-demo.tsx
M	components/ai/buyer-ai-assistant-panel.tsx
M	components/ai/floating-skxnz-assistant-loader.tsx
M	components/ai/floating-skxnz-assistant.tsx
M	components/ai/product-description-demo.tsx
M	components/ai/product-title-demo.tsx
M	components/ai/product-video-prompt-demo.tsx
A	components/ai/skxnz-assistant-inline-chat.tsx
M	components/ai/stylist-access-gate.tsx
M	components/auth/auth-card.tsx
D	components/auth/demo-login-panel.tsx
M	components/auth/demo-role-gate.tsx
M	components/brands/brand-page-shell.tsx
M	components/brands/brands-index-shell.tsx
M	components/brands/shop-by-brand-section.tsx
M	components/brands/top-brands-toolbar.tsx
M	components/buyer/cart-preview-table.tsx
D	components/buyer/final-homepage-experience.tsx
D	components/buyer/home-category-grid.tsx
D	components/buyer/home-hero-carousel.tsx
D	components/buyer/home-limited-drops-banner.tsx
D	components/buyer/home-shop-by-brand-section.tsx
D	components/buyer/home-top-brands-toolbar.tsx
M	components/buyer/home-trending-grid.tsx
M	components/buyer/product-detail-shell.tsx
M	components/buyer/product-purchase-panel.tsx
M	components/buyer/shop-browser.tsx
M	components/buyer/shop-catalog.tsx
A	components/catalog/product-gallery-manager.tsx
M	components/categories/category-page-shell.tsx
M	components/checkout/checkout-draft-flow.tsx
M	components/checkout/checkout-next-steps.tsx
M	components/checkout/place-draft-order.tsx
M	components/community/community-empty-state.tsx
M	components/community/community-feed.tsx
M	components/community/community-hero.tsx
A	components/community/community-not-wired.tsx
M	components/community/community-post-card.tsx
M	components/community/create-post-modal.tsx
M	components/community/report-post-modal.tsx
M	components/community/style-board-preview.tsx
M	components/community/tagged-products-strip.tsx
M	components/community/trending-signals.tsx
M	components/forms/product-upload-form.tsx
A	components/home/ai-signal-panel.tsx
M	components/home/ai-stylist-banner.tsx
A	components/home/authenticity-showcase.tsx
A	components/home/brand-spotlight.tsx
A	components/home/category-showcase.tsx
M	components/home/category-strip.tsx
M	components/home/featured-labels.tsx
M	components/home/hero-carousel.tsx
M	components/home/hero-scroll-video.tsx
M	components/home/homepage-section-frame.tsx
M	components/home/luxury-finds.tsx
M	components/home/mosaic-section.tsx
M	components/home/product-row.tsx
A	components/home/signal-cta.tsx
A	components/home/signal-room-teaser.tsx
M	components/home/trust-bar.tsx
M	components/layout/brand-mark.tsx
M	components/layout/mock-notice.tsx
D	components/layout/site-footer.tsx
M	components/layout/site-header.tsx
M	components/legal/policy-section.tsx
M	components/orders/order-readiness-panel.tsx
M	components/orders/order-return-panel.tsx
A	components/reactbits/dot-field.tsx
A	components/reactbits/prism.tsx
D	components/returns/return-request-workspace.tsx
D	components/sections/admin-metric-card.tsx
M	components/sections/data-table.tsx
D	components/sections/feature-strip.tsx
D	components/sections/metric-card.tsx
M	components/sections/page-intro.tsx
M	components/sections/product-card.tsx
M	components/sections/section-heading.tsx
M	components/seller/seller-ai-tools-preview.tsx
D	components/seller/seller-onboarding-status-card.tsx
M	components/seller/seller-product-table.tsx
D	components/seller/seller-product-upload-demo.tsx
D	components/seller/seller-product-workspace.tsx
M	components/shared/dashboard-shell.tsx
M	components/shared/discovery-menu.tsx
M	components/shared/empty-state.tsx
M	components/shared/footer.tsx
M	components/shared/navbar.tsx
M	components/shared/product-grid.tsx
M	components/shared/sidebar.tsx
M	components/shared/site-opening-loader.tsx
M	components/shared/site-search-bar.tsx
M	components/shared/stat-card.tsx
M	components/support/buyer-support-form.tsx
M	components/support/contact-form-demo.tsx
M	components/support/ticket-reply-form.tsx
M	components/tables/admin-approval-table.tsx
M	components/trust/trust-badges.tsx
M	components/ui/badge.tsx
M	components/ui/button.tsx
M	components/ui/card-stack.tsx
R100	CHANGELOG.md	docs/archive/2026-06-initial-snapshot/CHANGELOG.md
R100	LAUNCH_READINESS.md	docs/archive/2026-06-initial-snapshot/LAUNCH_READINESS.md
R100	SKXNZ_CURRENT_STATUS.md	docs/archive/2026-06-initial-snapshot/SKXNZ_CURRENT_STATUS.md
R100	SKXNZ_MASTER_CONTROL.md	docs/archive/2026-06-initial-snapshot/SKXNZ_MASTER_CONTROL.md
R100	SKXNZ_MVP_STATUS.md	docs/archive/2026-06-initial-snapshot/SKXNZ_MVP_STATUS.md
R100	SKXNZ_NEXT_BUILD_QUEUE.md	docs/archive/2026-06-initial-snapshot/SKXNZ_NEXT_BUILD_QUEUE.md
A	docs/archive/README.md
R100	docs/SKXNZ_D2_5_CONTROL_PACK.md	docs/archive/reports/SKXNZ_D2_5_CONTROL_PACK.md
R100	docs/SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md	docs/archive/reports/SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md
R100	docs/SKXNZ_DAY4_COMMERCE_BACKEND_SPRINT_REPORT.md	docs/archive/reports/SKXNZ_DAY4_COMMERCE_BACKEND_SPRINT_REPORT.md
R100	docs/SKXNZ_DAY5_ADDRESS_CHECKOUT_READINESS_REPORT.md	docs/archive/reports/SKXNZ_DAY5_ADDRESS_CHECKOUT_READINESS_REPORT.md
R100	docs/SKXNZ_DAY5_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_DAY5_CLOSE_REPORT.md
R100	docs/SKXNZ_DAY5_SELLER_OWNERSHIP_CLEANUP_REPORT.md	docs/archive/reports/SKXNZ_DAY5_SELLER_OWNERSHIP_CLEANUP_REPORT.md
R100	docs/SKXNZ_DAY5_SUPPORT_RETURNS_THREAD_REPORT.md	docs/archive/reports/SKXNZ_DAY5_SUPPORT_RETURNS_THREAD_REPORT.md
R100	docs/SKXNZ_DAY5_SUPPORT_RETURNS_UI_REPORT.md	docs/archive/reports/SKXNZ_DAY5_SUPPORT_RETURNS_UI_REPORT.md
R100	docs/SKXNZ_DAY5_WISHLIST_SAVE_FOR_LATER_REPORT.md	docs/archive/reports/SKXNZ_DAY5_WISHLIST_SAVE_FOR_LATER_REPORT.md
R100	docs/SKXNZ_FINAL_BUG_FIX_REPORT.md	docs/archive/reports/SKXNZ_FINAL_BUG_FIX_REPORT.md
R100	docs/SKXNZ_FRONTEND_POLISH_REPORT.md	docs/archive/reports/SKXNZ_FRONTEND_POLISH_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_D10_A_BROWSER_QA.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D10_A_BROWSER_QA.md
R100	docs/SKXNZ_LAUNCH_WAR_D10_B_VISUAL_QA.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D10_B_VISUAL_QA.md
R100	docs/SKXNZ_LAUNCH_WAR_D10_C_BUYER_RECOVERY.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D10_C_BUYER_RECOVERY.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D10_D_BUYER_VISUAL_POLISH.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D11_A_MARKETPLACE_READINESS.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D11_B_PRODUCTION_READINESS.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D11_C_LUXURY_POLISH.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D12_A_GLOBAL_IDEMPOTENCY.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D12_B_RATE_LIMITING.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D13_A_PERFORMANCE_FOUNDATION.md
R100	docs/SKXNZ_LAUNCH_WAR_D13_B_FRONTEND_PERFORMANCE_RUNTIME.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D13_B_FRONTEND_PERFORMANCE_RUNTIME.md
R100	docs/SKXNZ_LAUNCH_WAR_D1_A_COMMERCE_RETURNS_SUPPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D1_A_COMMERCE_RETURNS_SUPPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_D1_B_CODEX_HARDENING.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D1_B_CODEX_HARDENING.md
R100	docs/SKXNZ_LAUNCH_WAR_D2_A_BUYER_JOURNEY.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D2_A_BUYER_JOURNEY.md
R100	docs/SKXNZ_LAUNCH_WAR_D2_B_BUYER_HARDENING.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D2_B_BUYER_HARDENING.md
R100	docs/SKXNZ_LAUNCH_WAR_D3_A_SELLER_ORDER_OPERATIONS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D3_A_SELLER_ORDER_OPERATIONS.md
R100	docs/SKXNZ_LAUNCH_WAR_D3_B_SELLER_HARDENING.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D3_B_SELLER_HARDENING.md
R100	docs/SKXNZ_LAUNCH_WAR_D4_A_ADMIN_COMMERCE_OPERATIONS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D4_A_ADMIN_COMMERCE_OPERATIONS.md
R100	docs/SKXNZ_LAUNCH_WAR_D4_B_ADMIN_HARDENING.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D4_B_ADMIN_HARDENING.md
R100	docs/SKXNZ_LAUNCH_WAR_D5_A_DATABASE_READINESS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D5_A_DATABASE_READINESS.md
R100	docs/SKXNZ_LAUNCH_WAR_D5_B_CHECKOUT_PAYMENT_READINESS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D5_B_CHECKOUT_PAYMENT_READINESS.md
R100	docs/SKXNZ_LAUNCH_WAR_D6_A_CATALOG_RECOVERY_AND_QA_READINESS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D6_A_CATALOG_RECOVERY_AND_QA_READINESS.md
R100	docs/SKXNZ_LAUNCH_WAR_D6_B_COMMERCE_UI_POLISH.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D6_B_COMMERCE_UI_POLISH.md
R100	docs/SKXNZ_LAUNCH_WAR_D7_A_SUPABASE_CATALOG_RECOVERY.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D7_A_SUPABASE_CATALOG_RECOVERY.md
R100	docs/SKXNZ_LAUNCH_WAR_D7_B_ACCOUNT_ORDER_TRUTH_POLISH.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D7_B_ACCOUNT_ORDER_TRUTH_POLISH.md
R100	docs/SKXNZ_LAUNCH_WAR_D7_C_SELLER_ADMIN_UI_POLISH.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D7_C_SELLER_ADMIN_UI_POLISH.md
R100	docs/SKXNZ_LAUNCH_WAR_D8_A_BUILD_ROUTE_READINESS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D8_A_BUILD_ROUTE_READINESS.md
R100	docs/SKXNZ_LAUNCH_WAR_D8_B_PREMIUM_VISUAL_POLISH.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D8_B_PREMIUM_VISUAL_POLISH.md
R100	docs/SKXNZ_LAUNCH_WAR_D9_A_BUILD_PROOF_AND_LAUNCH_GATE.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D9_A_BUILD_PROOF_AND_LAUNCH_GATE.md
R100	docs/SKXNZ_LAUNCH_WAR_D9_B_BUYER_FIRST_IMPRESSION.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D9_B_BUYER_FIRST_IMPRESSION.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY1_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY1_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY2_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY2_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY3_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY3_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY4_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY4_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY7_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY7_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY9_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY9_CLOSE_REPORT.md
R100	docs/SKXNZ_PHASE_0_EXECUTION_PLAN.md	docs/archive/reports/SKXNZ_PHASE_0_EXECUTION_PLAN.md
R100	docs/SKXNZ_PHASE_11D_FRONTEND_CORRECTION_SCOPE.md	docs/archive/reports/SKXNZ_PHASE_11D_FRONTEND_CORRECTION_SCOPE.md
R100	docs/SKXNZ_PHASE_11D_MAJOR_FRONTEND_CORRECTION_REPORT.md	docs/archive/reports/SKXNZ_PHASE_11D_MAJOR_FRONTEND_CORRECTION_REPORT.md
R100	docs/SKXNZ_PHASE_12A_PRIVATE_BETA_PREP_REPORT.md	docs/archive/reports/SKXNZ_PHASE_12A_PRIVATE_BETA_PREP_REPORT.md
R100	docs/SKXNZ_PHASE_1_HANDOFF.md	docs/archive/reports/SKXNZ_PHASE_1_HANDOFF.md
R100	docs/SKXNZ_PRIVATE_BETA_DEPLOYMENT_CHECKLIST.md	docs/archive/reports/SKXNZ_PRIVATE_BETA_DEPLOYMENT_CHECKLIST.md
R100	docs/SKXNZ_PRIVATE_BETA_LIMITATIONS.md	docs/archive/reports/SKXNZ_PRIVATE_BETA_LIMITATIONS.md
R100	docs/SKXNZ_PRIVATE_BETA_QA_REPORT.md	docs/archive/reports/SKXNZ_PRIVATE_BETA_QA_REPORT.md
R100	docs/SKXNZ_PRIVATE_BETA_TEST_SCRIPT.md	docs/archive/reports/SKXNZ_PRIVATE_BETA_TEST_SCRIPT.md
A	docs/engineering/ARCHITECTURE.md
A	docs/engineering/ASSET_AUDIT_2026-10-01.md
A	docs/engineering/DATA_ARCHITECTURE.md
A	docs/engineering/DATA_ARCHITECTURE_AUDIT_2026-10-01.md
A	docs/engineering/DB_RECONCILIATION_2026-10-01.md
A	docs/engineering/DEPLOYMENT.md
A	docs/engineering/LOCAL_SETUP.md
A	docs/engineering/REPOSITORY_MAP.md
A	docs/engineering/SOURCE_OF_TRUTH.md
A	docs/engineering/WORKTREES.md
M	eslint.config.mjs
D	lib/ai/catalog-assistant.ts
D	lib/ai/catalog-query.ts
A	lib/catalog/admin-placement-actions.ts
A	lib/catalog/demo-fallback.ts
M	lib/catalog/mappers.ts
A	lib/catalog/public-catalog.ts
M	lib/catalog/queries.ts
M	lib/catalog/types.ts
A	lib/catalog/upload-actions.ts
M	lib/checkout/order-attempt.ts
A	lib/community/admin-community-actions.ts
A	lib/community/admin-read-community.ts
A	lib/community/community-actions.ts
A	lib/community/format.ts
A	lib/community/read-community.ts
M	lib/data/address-actions.ts
M	lib/data/community.ts
M	lib/home-data.ts
A	lib/net/fetch-with-retry.ts
M	lib/orders/admin-update-order-status.ts
M	lib/orders/create-order-intent.ts
M	lib/orders/seller-update-line-fulfilment.ts
A	lib/reactbits-config.ts
M	lib/returns/admin-update-return-status.ts
M	lib/returns/create-return-request.ts
M	lib/returns/return-requests.ts
D	lib/saved/save-actions.ts
M	lib/saved/saved-items.ts
A	lib/security/rate-limit/adapters/index.ts
A	lib/security/rate-limit/adapters/memory-store.ts
A	lib/security/rate-limit/helpers.ts
A	lib/security/rate-limit/keys.ts
A	lib/security/rate-limit/limiter.ts
A	lib/security/rate-limit/policies.ts
A	lib/security/rate-limit/rate-limit.ts
A	lib/security/rate-limit/types.ts
M	lib/site.ts
M	lib/supabase/public-catalog.ts
M	lib/supabase/server.ts
M	lib/support/add-support-ticket-message.ts
M	lib/support/admin-support-actions.ts
M	lib/support/create-support-ticket.ts
M	lib/support/support-requests.ts
M	lib/types/community.ts
M	next.config.ts
M	package.json
M	pnpm-lock.yaml
M	postcss.config.js
M	project-data/README.md
M	project-data/readme/SHEET_IMPORTER.md
M	scripts/import-sheet-data.py
A	src/data/README.md
M	src/data/brandPageHeroes.ts
M	src/data/products.ts
M	src/lib/ai/catalog.ts
M	src/lib/ai/engines.ts
A	src/lib/ai/live-catalog.ts
D	src/lib/ai/prompt-library.ts
M	src/lib/ai/service.ts
M	src/lib/assets.ts
M	src/lib/skxnzAssistant.ts
A	supabase/migrations/0002_catalog_layer.sql
A	supabase/migrations/0016_global_idempotency_hardening.sql
A	supabase/migrations/0017_community_layer.sql
A	supabase/migrations/0018_catalogue_upload_and_placement.sql
A	supabase/migrations/0019_fix_brand_category_public_reads.sql
A	supabase/migrations/0020_reconcile_missing_commerce_objects.sql
A	supabase/seeds/0002_catalog_seed.sql
A	supabase/verification/0002_catalog_verify.sql
A	supabase/verification/0017_community_layer_verify.sql
A	supabase/verification/0018_catalogue_upload_and_placement_verify.sql
A	supabase/verification/0019_brand_category_public_reads_verify.sql
A	supabase/verification/0020_forced_rollback_test.sql
M	tailwind.config.ts
M	tests/bootstrap.cjs
A	tests/catalog-public.test.cjs
M	tests/commerce-actions.test.cjs
A	tests/fetch-with-retry.test.cjs
M	tests/mocks/next-stubs.cjs
A	tests/mocks/supabase-public-catalog.cjs
A	tests/rate-limit.test.cjs
M	tests/tsconfig.json
```

### Production branch `81d863d` → reviewed candidate

```text
M	.env.example
M	.gitignore
M	AGENTS.md
M	CLAUDE.md
M	PROGRESS.md
M	README.md
D	SKXNZ_SKILL_EXPORTS/_upstream/impeccable
D	SKXNZ_SKILL_EXPORTS/_upstream/obsidian-skills
D	SKXNZ_SKILL_EXPORTS/_upstream/taste-skill
M	app/about/page.tsx
M	app/account/addresses/page.tsx
M	app/account/page.tsx
M	app/account/returns/page.tsx
M	app/account/support/[id]/page.tsx
M	app/account/support/page.tsx
M	app/admin/community/page.tsx
M	app/admin/login/page.tsx
A	app/admin/products/[id]/page.tsx
M	app/admin/sellers/page.tsx
D	app/ai-stylist/page.tsx
D	app/ai-tools/product-description/page.tsx
D	app/ai-tools/product-title/page.tsx
D	app/ai-tools/product-video-prompt/page.tsx
M	app/ai/description-generator/page.tsx
A	app/ai/page.tsx
M	app/ai/stylist/page.tsx
M	app/ai/title-generator/page.tsx
M	app/ai/video-prompt-generator/page.tsx
M	app/api/ai-assistant/route.ts
M	app/api/ai/buyer-assistant/route.ts
M	app/api/ai/outfit-builder/route.ts
M	app/api/ai/seller-product-check/route.ts
M	app/api/ai/try-on/jobs/route.ts
A	app/api/catalog/navigation/route.ts
M	app/api/search/suggestions/route.ts
M	app/authenticity/page.tsx
M	app/brands/[slug]/page.tsx
M	app/brands/page.tsx
M	app/cart/page.tsx
M	app/categories/[slug]/page.tsx
M	app/checkout/success/page.tsx
M	app/community-guidelines/page.tsx
M	app/community/page.tsx
M	app/contact/page.tsx
M	app/cookies/page.tsx
A	app/error.tsx
A	app/global-error.tsx
M	app/globals.css
M	app/layout.tsx
A	app/llms.txt/route.ts
M	app/not-found.tsx
M	app/orders/[id]/page.tsx
M	app/orders/page.tsx
M	app/page.tsx
M	app/privacy/page.tsx
M	app/product/[id]/page.tsx
M	app/robots.ts
M	app/sell/page.tsx
M	app/seller-terms/page.tsx
M	app/seller/dashboard/page.tsx
M	app/seller/login/page.tsx
M	app/seller/page.tsx
A	app/seller/products/[id]/page.tsx
M	app/seller/products/new/actions.ts
M	app/seller/products/new/page.tsx
M	app/shipping/page.tsx
M	app/shop/page.tsx
M	app/sitemap.ts
M	app/support/page.tsx
M	app/terms/page.tsx
M	app/waitlist/page.tsx
M	components/account/account-saved-items.tsx
M	components/account/account-shell.tsx
M	components/account/address-book-live.tsx
M	components/account/address-book.tsx
M	components/account/address-form.tsx
M	components/account/cart-sync-status.tsx
M	components/account/demo-order-card.tsx
M	components/account/order-detail-demo.tsx
D	components/account/order-history-demo.tsx
M	components/account/profile-card.tsx
M	components/account/style-preferences.tsx
M	components/account/wishlist-grid.tsx
A	components/admin/admin-product-placement-panel.tsx
M	components/admin/admin-product-review-panel.tsx
M	components/admin/admin-seller-review-panel.tsx
M	components/admin/community-moderation-table.tsx
A	components/admin/community-poster-grants-panel.tsx
A	components/admin/community-style-boards-panel.tsx
M	components/ai/ai-outfit-builder-panel.tsx
M	components/ai/ai-stylist-demo.tsx
M	components/ai/buyer-ai-assistant-panel.tsx
M	components/ai/floating-skxnz-assistant-loader.tsx
M	components/ai/floating-skxnz-assistant.tsx
M	components/ai/product-description-demo.tsx
M	components/ai/product-title-demo.tsx
M	components/ai/product-video-prompt-demo.tsx
A	components/ai/skxnz-assistant-inline-chat.tsx
M	components/ai/stylist-access-gate.tsx
M	components/auth/auth-card.tsx
D	components/auth/demo-login-panel.tsx
M	components/auth/demo-role-gate.tsx
M	components/brands/brand-page-shell.tsx
M	components/brands/brands-index-shell.tsx
M	components/brands/shop-by-brand-section.tsx
M	components/brands/top-brands-toolbar.tsx
M	components/buyer/cart-preview-table.tsx
D	components/buyer/final-homepage-experience.tsx
D	components/buyer/home-category-grid.tsx
D	components/buyer/home-hero-carousel.tsx
D	components/buyer/home-limited-drops-banner.tsx
D	components/buyer/home-shop-by-brand-section.tsx
D	components/buyer/home-top-brands-toolbar.tsx
M	components/buyer/home-trending-grid.tsx
M	components/buyer/product-detail-shell.tsx
M	components/buyer/product-purchase-panel.tsx
M	components/buyer/shop-browser.tsx
M	components/buyer/shop-catalog.tsx
A	components/catalog/product-gallery-manager.tsx
M	components/categories/category-page-shell.tsx
M	components/checkout/checkout-draft-flow.tsx
M	components/checkout/checkout-next-steps.tsx
M	components/checkout/place-draft-order.tsx
M	components/community/community-empty-state.tsx
M	components/community/community-feed.tsx
M	components/community/community-hero.tsx
A	components/community/community-not-wired.tsx
M	components/community/community-post-card.tsx
M	components/community/create-post-modal.tsx
M	components/community/report-post-modal.tsx
M	components/community/style-board-preview.tsx
M	components/community/tagged-products-strip.tsx
M	components/community/trending-signals.tsx
M	components/consent/consent-manager.tsx
A	components/consent/google-analytics.tsx
M	components/forms/product-upload-form.tsx
A	components/home/ai-signal-panel.tsx
M	components/home/ai-stylist-banner.tsx
A	components/home/authenticity-showcase.tsx
A	components/home/brand-spotlight.tsx
A	components/home/category-showcase.tsx
M	components/home/category-strip.tsx
M	components/home/featured-labels.tsx
M	components/home/hero-carousel.tsx
M	components/home/hero-scroll-video.tsx
M	components/home/homepage-section-frame.tsx
M	components/home/luxury-finds.tsx
M	components/home/mosaic-section.tsx
M	components/home/product-row.tsx
A	components/home/signal-cta.tsx
A	components/home/signal-room-teaser.tsx
M	components/home/trust-bar.tsx
M	components/layout/brand-mark.tsx
M	components/layout/mock-notice.tsx
D	components/layout/site-footer.tsx
M	components/layout/site-header.tsx
M	components/legal/policy-section.tsx
M	components/orders/order-readiness-panel.tsx
M	components/orders/order-return-panel.tsx
A	components/reactbits/dot-field.tsx
A	components/reactbits/prism.tsx
D	components/returns/return-request-workspace.tsx
D	components/sections/admin-metric-card.tsx
M	components/sections/data-table.tsx
D	components/sections/feature-strip.tsx
D	components/sections/metric-card.tsx
M	components/sections/page-intro.tsx
M	components/sections/product-card.tsx
M	components/sections/section-heading.tsx
M	components/seller/seller-ai-tools-preview.tsx
D	components/seller/seller-onboarding-status-card.tsx
M	components/seller/seller-product-table.tsx
D	components/seller/seller-product-upload-demo.tsx
D	components/seller/seller-product-workspace.tsx
M	components/shared/dashboard-shell.tsx
M	components/shared/discovery-menu.tsx
M	components/shared/empty-state.tsx
M	components/shared/footer.tsx
M	components/shared/navbar.tsx
M	components/shared/product-grid.tsx
M	components/shared/sidebar.tsx
M	components/shared/site-opening-loader.tsx
M	components/shared/site-search-bar.tsx
M	components/shared/stat-card.tsx
M	components/support/buyer-support-form.tsx
M	components/support/contact-form-demo.tsx
M	components/support/ticket-reply-form.tsx
M	components/tables/admin-approval-table.tsx
M	components/trust/trust-badges.tsx
M	components/ui/badge.tsx
M	components/ui/button.tsx
M	components/ui/card-stack.tsx
R100	CHANGELOG.md	docs/archive/2026-06-initial-snapshot/CHANGELOG.md
R100	LAUNCH_READINESS.md	docs/archive/2026-06-initial-snapshot/LAUNCH_READINESS.md
R100	SKXNZ_CURRENT_STATUS.md	docs/archive/2026-06-initial-snapshot/SKXNZ_CURRENT_STATUS.md
R100	SKXNZ_MASTER_CONTROL.md	docs/archive/2026-06-initial-snapshot/SKXNZ_MASTER_CONTROL.md
R100	SKXNZ_MVP_STATUS.md	docs/archive/2026-06-initial-snapshot/SKXNZ_MVP_STATUS.md
R100	SKXNZ_NEXT_BUILD_QUEUE.md	docs/archive/2026-06-initial-snapshot/SKXNZ_NEXT_BUILD_QUEUE.md
A	docs/archive/README.md
R100	docs/SKXNZ_D2_5_CONTROL_PACK.md	docs/archive/reports/SKXNZ_D2_5_CONTROL_PACK.md
R100	docs/SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md	docs/archive/reports/SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md
R100	docs/SKXNZ_DAY4_COMMERCE_BACKEND_SPRINT_REPORT.md	docs/archive/reports/SKXNZ_DAY4_COMMERCE_BACKEND_SPRINT_REPORT.md
R100	docs/SKXNZ_DAY5_ADDRESS_CHECKOUT_READINESS_REPORT.md	docs/archive/reports/SKXNZ_DAY5_ADDRESS_CHECKOUT_READINESS_REPORT.md
R100	docs/SKXNZ_DAY5_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_DAY5_CLOSE_REPORT.md
R100	docs/SKXNZ_DAY5_SELLER_OWNERSHIP_CLEANUP_REPORT.md	docs/archive/reports/SKXNZ_DAY5_SELLER_OWNERSHIP_CLEANUP_REPORT.md
R100	docs/SKXNZ_DAY5_SUPPORT_RETURNS_THREAD_REPORT.md	docs/archive/reports/SKXNZ_DAY5_SUPPORT_RETURNS_THREAD_REPORT.md
R100	docs/SKXNZ_DAY5_SUPPORT_RETURNS_UI_REPORT.md	docs/archive/reports/SKXNZ_DAY5_SUPPORT_RETURNS_UI_REPORT.md
R100	docs/SKXNZ_DAY5_WISHLIST_SAVE_FOR_LATER_REPORT.md	docs/archive/reports/SKXNZ_DAY5_WISHLIST_SAVE_FOR_LATER_REPORT.md
R100	docs/SKXNZ_FINAL_BUG_FIX_REPORT.md	docs/archive/reports/SKXNZ_FINAL_BUG_FIX_REPORT.md
R100	docs/SKXNZ_FRONTEND_POLISH_REPORT.md	docs/archive/reports/SKXNZ_FRONTEND_POLISH_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_D10_A_BROWSER_QA.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D10_A_BROWSER_QA.md
R100	docs/SKXNZ_LAUNCH_WAR_D10_B_VISUAL_QA.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D10_B_VISUAL_QA.md
R100	docs/SKXNZ_LAUNCH_WAR_D10_C_BUYER_RECOVERY.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D10_C_BUYER_RECOVERY.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D10_D_BUYER_VISUAL_POLISH.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D11_A_MARKETPLACE_READINESS.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D11_B_PRODUCTION_READINESS.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D11_C_LUXURY_POLISH.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D12_A_GLOBAL_IDEMPOTENCY.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D12_B_RATE_LIMITING.md
A	docs/archive/reports/SKXNZ_LAUNCH_WAR_D13_A_PERFORMANCE_FOUNDATION.md
R100	docs/SKXNZ_LAUNCH_WAR_D13_B_FRONTEND_PERFORMANCE_RUNTIME.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D13_B_FRONTEND_PERFORMANCE_RUNTIME.md
R100	docs/SKXNZ_LAUNCH_WAR_D1_A_COMMERCE_RETURNS_SUPPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D1_A_COMMERCE_RETURNS_SUPPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_D1_B_CODEX_HARDENING.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D1_B_CODEX_HARDENING.md
R100	docs/SKXNZ_LAUNCH_WAR_D2_A_BUYER_JOURNEY.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D2_A_BUYER_JOURNEY.md
R100	docs/SKXNZ_LAUNCH_WAR_D2_B_BUYER_HARDENING.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D2_B_BUYER_HARDENING.md
R100	docs/SKXNZ_LAUNCH_WAR_D3_A_SELLER_ORDER_OPERATIONS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D3_A_SELLER_ORDER_OPERATIONS.md
R100	docs/SKXNZ_LAUNCH_WAR_D3_B_SELLER_HARDENING.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D3_B_SELLER_HARDENING.md
R100	docs/SKXNZ_LAUNCH_WAR_D4_A_ADMIN_COMMERCE_OPERATIONS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D4_A_ADMIN_COMMERCE_OPERATIONS.md
R100	docs/SKXNZ_LAUNCH_WAR_D4_B_ADMIN_HARDENING.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D4_B_ADMIN_HARDENING.md
R100	docs/SKXNZ_LAUNCH_WAR_D5_A_DATABASE_READINESS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D5_A_DATABASE_READINESS.md
R100	docs/SKXNZ_LAUNCH_WAR_D5_B_CHECKOUT_PAYMENT_READINESS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D5_B_CHECKOUT_PAYMENT_READINESS.md
R100	docs/SKXNZ_LAUNCH_WAR_D6_A_CATALOG_RECOVERY_AND_QA_READINESS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D6_A_CATALOG_RECOVERY_AND_QA_READINESS.md
R100	docs/SKXNZ_LAUNCH_WAR_D6_B_COMMERCE_UI_POLISH.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D6_B_COMMERCE_UI_POLISH.md
R100	docs/SKXNZ_LAUNCH_WAR_D7_A_SUPABASE_CATALOG_RECOVERY.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D7_A_SUPABASE_CATALOG_RECOVERY.md
R100	docs/SKXNZ_LAUNCH_WAR_D7_B_ACCOUNT_ORDER_TRUTH_POLISH.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D7_B_ACCOUNT_ORDER_TRUTH_POLISH.md
R100	docs/SKXNZ_LAUNCH_WAR_D7_C_SELLER_ADMIN_UI_POLISH.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D7_C_SELLER_ADMIN_UI_POLISH.md
R100	docs/SKXNZ_LAUNCH_WAR_D8_A_BUILD_ROUTE_READINESS.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D8_A_BUILD_ROUTE_READINESS.md
R100	docs/SKXNZ_LAUNCH_WAR_D8_B_PREMIUM_VISUAL_POLISH.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D8_B_PREMIUM_VISUAL_POLISH.md
R100	docs/SKXNZ_LAUNCH_WAR_D9_A_BUILD_PROOF_AND_LAUNCH_GATE.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D9_A_BUILD_PROOF_AND_LAUNCH_GATE.md
R100	docs/SKXNZ_LAUNCH_WAR_D9_B_BUYER_FIRST_IMPRESSION.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_D9_B_BUYER_FIRST_IMPRESSION.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY1_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY1_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY2_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY2_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY3_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY3_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY4_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY4_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY7_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY7_CLOSE_REPORT.md
R100	docs/SKXNZ_LAUNCH_WAR_DAY9_CLOSE_REPORT.md	docs/archive/reports/SKXNZ_LAUNCH_WAR_DAY9_CLOSE_REPORT.md
R100	docs/SKXNZ_PHASE_0_EXECUTION_PLAN.md	docs/archive/reports/SKXNZ_PHASE_0_EXECUTION_PLAN.md
R100	docs/SKXNZ_PHASE_11D_FRONTEND_CORRECTION_SCOPE.md	docs/archive/reports/SKXNZ_PHASE_11D_FRONTEND_CORRECTION_SCOPE.md
R100	docs/SKXNZ_PHASE_11D_MAJOR_FRONTEND_CORRECTION_REPORT.md	docs/archive/reports/SKXNZ_PHASE_11D_MAJOR_FRONTEND_CORRECTION_REPORT.md
R100	docs/SKXNZ_PHASE_12A_PRIVATE_BETA_PREP_REPORT.md	docs/archive/reports/SKXNZ_PHASE_12A_PRIVATE_BETA_PREP_REPORT.md
R100	docs/SKXNZ_PHASE_1_HANDOFF.md	docs/archive/reports/SKXNZ_PHASE_1_HANDOFF.md
R100	docs/SKXNZ_PRIVATE_BETA_DEPLOYMENT_CHECKLIST.md	docs/archive/reports/SKXNZ_PRIVATE_BETA_DEPLOYMENT_CHECKLIST.md
R100	docs/SKXNZ_PRIVATE_BETA_LIMITATIONS.md	docs/archive/reports/SKXNZ_PRIVATE_BETA_LIMITATIONS.md
R100	docs/SKXNZ_PRIVATE_BETA_QA_REPORT.md	docs/archive/reports/SKXNZ_PRIVATE_BETA_QA_REPORT.md
R100	docs/SKXNZ_PRIVATE_BETA_TEST_SCRIPT.md	docs/archive/reports/SKXNZ_PRIVATE_BETA_TEST_SCRIPT.md
A	docs/engineering/ARCHITECTURE.md
A	docs/engineering/ASSET_AUDIT_2026-10-01.md
A	docs/engineering/DATA_ARCHITECTURE.md
A	docs/engineering/DATA_ARCHITECTURE_AUDIT_2026-10-01.md
A	docs/engineering/DB_RECONCILIATION_2026-10-01.md
A	docs/engineering/DEPLOYMENT.md
A	docs/engineering/LOCAL_SETUP.md
A	docs/engineering/REPOSITORY_MAP.md
A	docs/engineering/SOURCE_OF_TRUTH.md
A	docs/engineering/WORKTREES.md
M	eslint.config.mjs
D	lib/ai/catalog-assistant.ts
D	lib/ai/catalog-query.ts
A	lib/catalog/admin-placement-actions.ts
A	lib/catalog/demo-fallback.ts
M	lib/catalog/mappers.ts
A	lib/catalog/public-catalog.ts
M	lib/catalog/queries.ts
M	lib/catalog/types.ts
A	lib/catalog/upload-actions.ts
M	lib/checkout/order-attempt.ts
A	lib/community/admin-community-actions.ts
A	lib/community/admin-read-community.ts
A	lib/community/community-actions.ts
A	lib/community/format.ts
A	lib/community/read-community.ts
A	lib/consent/google-analytics.ts
M	lib/consent/script-gate.ts
M	lib/data/address-actions.ts
M	lib/data/community.ts
M	lib/home-data.ts
A	lib/net/fetch-with-retry.ts
M	lib/orders/admin-update-order-status.ts
M	lib/orders/create-order-intent.ts
M	lib/orders/seller-update-line-fulfilment.ts
A	lib/reactbits-config.ts
M	lib/returns/admin-update-return-status.ts
M	lib/returns/create-return-request.ts
M	lib/returns/return-requests.ts
D	lib/saved/save-actions.ts
M	lib/saved/saved-items.ts
A	lib/security/rate-limit/adapters/index.ts
A	lib/security/rate-limit/adapters/memory-store.ts
A	lib/security/rate-limit/helpers.ts
A	lib/security/rate-limit/keys.ts
A	lib/security/rate-limit/limiter.ts
A	lib/security/rate-limit/policies.ts
A	lib/security/rate-limit/rate-limit.ts
A	lib/security/rate-limit/types.ts
M	lib/site.ts
M	lib/supabase/public-catalog.ts
M	lib/supabase/server.ts
M	lib/support/add-support-ticket-message.ts
M	lib/support/admin-support-actions.ts
M	lib/support/create-support-ticket.ts
M	lib/support/support-requests.ts
M	lib/types/community.ts
M	next.config.ts
M	package.json
M	pnpm-lock.yaml
M	postcss.config.js
M	project-data/README.md
M	project-data/readme/SHEET_IMPORTER.md
M	scripts/import-sheet-data.py
A	src/data/README.md
M	src/data/brandPageHeroes.ts
M	src/data/products.ts
M	src/lib/ai/catalog.ts
M	src/lib/ai/engines.ts
A	src/lib/ai/live-catalog.ts
D	src/lib/ai/prompt-library.ts
M	src/lib/ai/service.ts
M	src/lib/assets.ts
M	src/lib/skxnzAssistant.ts
A	supabase/migrations/0002_catalog_layer.sql
A	supabase/migrations/0016_global_idempotency_hardening.sql
A	supabase/migrations/0017_community_layer.sql
A	supabase/migrations/0018_catalogue_upload_and_placement.sql
A	supabase/migrations/0019_fix_brand_category_public_reads.sql
A	supabase/migrations/0020_reconcile_missing_commerce_objects.sql
A	supabase/seeds/0002_catalog_seed.sql
A	supabase/verification/0002_catalog_verify.sql
A	supabase/verification/0017_community_layer_verify.sql
A	supabase/verification/0018_catalogue_upload_and_placement_verify.sql
A	supabase/verification/0019_brand_category_public_reads_verify.sql
A	supabase/verification/0020_forced_rollback_test.sql
M	tailwind.config.ts
M	tests/auth-trust.test.cjs
M	tests/bootstrap.cjs
A	tests/catalog-public.test.cjs
M	tests/commerce-actions.test.cjs
A	tests/fetch-with-retry.test.cjs
M	tests/mocks/next-stubs.cjs
A	tests/mocks/supabase-public-catalog.cjs
A	tests/rate-limit.test.cjs
M	tests/tsconfig.json
```

## Resolution addendum — B01 and H01–H04 fix pass, 2026-10-03

This addendum supersedes the original readiness decision **only for the five authorized findings**. The original audit text and findings above are retained as the historical review of `63c649a`. No MEDIUM or LOW finding was fixed, no schema/data/provider configuration was changed, and no push or deployment occurred. The user expressly authorized local commits after validation; only the current canonical branch advances through those commits. Production branch `launch-war-july30` remains at `81d863d` and actual live baseline remains `06d78d5`.

### Resolution summary

| Finding | Original problem | Exact fix | Status / remaining verification |
| --- | --- | --- | --- |
| B01 | Catalogue JSON could terminate its JSON-LD script. | `lib/security/json-ld.ts` serializes JSON then escapes every literal `<` as `\u003c`; product, product breadcrumb, brand/category breadcrumb and root Organization/WebSite scripts all use it. | **Resolved.** All six runtime sinks covered, malicious text stays in one script, values round-trip unchanged. Browser/preview structured-data checks remain QA. |
| H01 | Legacy demo approval predicate rejected mapped ACTIVE live products during constraints/ranking. | `src/lib/skxnzAssistant.ts` uses one recommendable predicate in initial eligibility, constraints and ranking. Live items require `Active Catalog`; approved legacy fixtures remain intentionally supported. Positive finite price, positive integer stock and nonempty identity/name are checked. | **Resolved.** Actual mapper fixture produces a recommendation; inactive/archived/unavailable/invalid examples are excluded. Production demo fallback remains impossible. Preview real-stock recommendation QA remains. |
| H02 | UI/action accepted 5 MB despite default 1 MiB action transport. | Shared `lib/catalog/image-upload-contract.ts` limits JPEG/PNG/WebP to **768 KiB = 786,432 bytes**. UI and server use the same validator/label; browser sends only productId/file with bounded filename and catches thrown transport errors. | **Resolved in source/local tests.** Hosted upload/error behavior still needs authorized preview QA; provider limits were not inferred or changed. |
| H03 | Public Stylist guest/sign-in path opened controls whose APIs always reject production demo roles. | `/ai/stylist` returns `StylistUnavailable` in NODE_ENV production before constructing the studio/gate subtree; production metadata truthfully describes unavailability. Only catalogue browsing is offered. | **Resolved by gating.** No guest entry, Stylist sign-in CTA or generation controls in production. API production header rejection remains unchanged. This also applies to Vercel production-mode preview builds. |
| H04 | Missing production keys fell back to dummy credentials; client mode inspected a server secret. | Browser-safe public config moved into `turnstile-public.ts`. Dummy fallback is restricted to explicit development/test. Missing/dummy production public key disables auth submission and shows a clear error. Existing verifier is server-only and rejects absent/dummy required server config before network. | **Partially resolved: source semantics resolved; provider/browser enforcement remains unverified.** Real Chrome, Supabase CAPTCHA and hostname/key checks remain mandatory. |

### B01 verification and scope

The runtime search covered `application/ld+json`, dangerouslySetInnerHTML and JSON.stringify script construction across app/components/lib/src, not just the original three page paths. Six dynamic sinks were found and converted, including both root layout schemas. The unrelated constant intro script and GA4/consent implementation were preserved. No ordinary HTML encoder was used and no schema removed.

Seven focused B01 checks cover all six schema contexts plus source-sink coverage and an unsafe positive control. Inputs include the requested `</script><script>window.__skxnz_probe=1</script>`, mixed-case closing tags, script/comment parser forms, malicious object keys and ordinary Unicode/quotes/ampersands. JSON.parse returns the original object exactly; React SSR contains one opening and one closing script tag and no literal `<` in the serialized data. The isolated reproduction result is **breakout = false; scriptElements = 1; roundTrip = true**. The unsafe control produces two script openings, demonstrating that the check detects the original defect.

The security fix skill's independent source-boundary investigation and fresh read-only candidate bypass/regression review found no surviving concrete route through these sinks or legitimate schema regression. No live payload was inserted. This is source/SSR verification, not a claim that a hosted browser was tested.

### H01 verification

The regression invokes the actual `mapCatalogProductToBuyerProduct` on an ACTIVE record with an in-stock variant, then the actual assistant with a matching hoodie/budget request. It returns the mapped live product. The original isolated comparison now yields **live 1 / approved demo 1 / archived 0 recommendations**, instead of live 0. Separate tests reject inactive/pending/legacy-status live items, zero/negative/invalid stock, invalid price and empty identity/name. Existing canonical public-layer tests continue proving ACTIVE filtering and no production demo fallback; the API still chooses the live catalogue and never invents products when it is empty.

### H02 transport and safety contract

Current path remains browser FormData → Next server action → authenticated owner/admin check → authorized Supabase Storage upload → product_images insert, with existing failure cleanup. Direct browser Storage upload was not already a complete authorized attach workflow; adding upload/attach/orphan lifecycle would broaden this pass, so the minimum safe option B was selected.

The unchanged installed Next default is 1 MiB. A 768 KiB file leaves 256 KiB nominal headroom for multipart/action metadata. The bounded normal multipart fixture is below 800 KiB; actual React action framing and hosted limits still require preview verification. No claim is made about an unverified Vercel payload ceiling. The live bucket's larger 5 MB cap is unchanged and is not the app's advertised contract.

Tests accept exactly 786,432 bytes, reject the next byte, disallowed MIME and empty files, and prove invalid actions return before any auth/DB/Storage call. Actual component-handler execution with a mocked throwing action verifies recoverable error text and unchanged gallery state. Client oversize validation makes zero action calls. Owner/admin checks, rate limiting, bucket/path policy, max image count and cleanup remain unchanged. No live file or product row was changed.

### H03 exact production UX

`/ai/stylist` remains available and shows “The styling workspace is unavailable.” It states that outfit generation and guest previews are not enabled for this release and offers **Browse the Catalogue** linking to `/shop`. The production branch of the page applies regardless of signed-in user or stored demo role; it does not open studio controls. Developer/test behavior remains behind the non-production branch. No new promise of a working AI integration was introduced.

The production page test executes the actual page with isolated module doubles, verifies the unavailable component is selected, and checks its rendered panel has no form/button/sign-in/guest control. Built HTTP HTML independently confirms unavailable copy and absence of “Enter Guest Preview”. Existing production APIs still return 403 to forged demo-role headers, verified by smoke.

### H04 configuration boundary and limits of proof

The access form imports only `turnstile-public.ts`; neither that module nor its client import path references the server secret. The server verifier imports `server-only`. Generated client chunks contain neither the server secret variable name nor the dummy secret constant. Public mode is computed only from NODE_ENV and the public site key; a real-looking production public key is treated as non-test even without a server secret in the browser.

Development/test may use dummy fallback. Undefined/production mode does not. Missing or configured dummy production site keys return an unavailable state: no challenge widget, disabled login/signup/recovery submission and an explanatory error. Password reset inside an existing recovery session retains its existing no-challenge behavior. Missing/dummy server credentials for the standalone server verifier return `configuration-error` without network access.

Supabase auth still receives captchaToken once and is the actual auth verification boundary. The standalone verifier was not wired into login/signup/reset requests, so no competing Siteverify/double-token-spend path was added. The application server secret is relevant only to callers of that verifier; auth enforcement uses the provider's own configured CAPTCHA secret. Source changes do **not** prove Supabase Bot Protection is enabled or correctly configured. Do not claim provider enforcement from the widget, a real-looking string or these unit tests.

### Final automated gates

| Gate | Fix-pass result |
| --- | --- |
| Next typegen + application typecheck | PASS |
| Test TypeScript compilation | PASS |
| All existing tests plus new focused suite | **240 passed, zero failed**: 208 existing + 32 focused |
| Lint | PASS: zero errors, eight unchanged warnings |
| Production build | PASS: 82 generated pages, successful live catalogue reads using trusted system certificate store |
| Production route/API smoke | PASS: 108 probes, all statuses match expected prior smoke; 60×200, 33×307, 4×308, 8×403, 3×404 |
| Sitemap | PASS: 36 URLs including six products; prior exclusions preserved |
| Missing-key auth production HTTP smoke | PASS: login/signup/forgot-password show configuration error and disabled submit with absent local production keys |
| Isolated malicious JSON-LD reproduction | PASS: breakout false, one script, data preserved |
| Isolated live assistant reproduction | PASS: live eligible product produces one recommendation |
| Client secret boundary | PASS: server-only verifier and no secret reference/dummy secret in client chunks |
| git diff --check / scope review | PASS; no migrations, catalogue data, Next config, lockfile, GA4/consent, archive or production-ref changes |

Commands used installed Node entry points: Next typegen; TypeScript --noEmit --incremental false and -p tests/tsconfig.json; ESLint; Node --test all six test files; scripts/build-next.mjs and scripts/fix-next-vendor-chunks.mjs; local next start for HTTP probes. `pnpm test:release-hardening` is now the committed repeatable focused-suite entry point. No dependency/version/lock change was needed. Clean hosted installation remains a preview gate; the original offline-install limitation was not represented as newly resolved.

### Readiness and exact next manual checks

**Technically ready for a non-promoted PREVIEW for verification**, with fail-closed missing-key auth understood. Before testing auth successfully, preview must have valid public Turnstile configuration and matching provider CAPTCHA/hostname configuration. GitHub access restoration and verification that an integration push cannot trigger production still apply. No push/deploy was performed or implied by this readiness statement.

**Not ready for PRODUCTION approval.** Run the original full section 11 viewport matrix (1440/1280, 768, 320/360/375/390/412/430) and its public/private-flow checklist against the exact committed artifact. Specifically:

1. Confirm valid structured-data JSON on product/breadcrumb/brand/category/root schemas; use only isolated malicious fixtures, never production catalogue payloads.
2. Confirm real available catalogue items can be recommended for matching queries; out-of-stock/archived/empty/error behavior must remain honest.
3. With approved isolated QA credentials/data, upload valid JPEG/PNG/WebP at and below 768 KiB, reject 786,433 bytes/disallowed MIME before mutation, verify owner/admin isolation, cancellation/network/transport errors and retry. Check hosted payload limits without changing provider settings in this pass.
4. Check Stylist stays unavailable for guests and signed-in users, has only working catalogue navigation, and rejects forged production role headers.
5. In ordinary Chrome, verify real Turnstile rendering, configured hostnames/preview allowlist, Supabase Bot Protection, valid/missing/invalid/expired token behavior and login/signup/recovery. Verify missing/dummy production configuration stays clearly closed; verify real keys do not display test mode.
6. Complete original GA4/consent, hero/video/Prism, navigation, mobile, private ownership and unpaid commerce QA. Hosted preview GA4 remains intentionally off by hostname gating; production collection verification remains an approved release check.

Eight MEDIUM and four LOW audit findings remain unchanged and require the original acceptance/documentation decisions. Payments, mock-role AI APIs and other unfinished launch features remain disabled. Verify provider environment, production branch and rollback artifact before production reliance. No new production recommendation or approval is inferred from the local commit.
