# FINAL PREVIEW GATE — bfe8469

Review date: 2026-10-18; signed-in continuation: 2026-10-20 (section 14). Application candidate: integrate/recover-missing-work at bfe8469e6c18fd0e04fa09b364969aa09e379299. This addendum supersedes earlier readiness statements only where new evidence is recorded. Historical tests against 4ed351f are not passes for this artifact.

**Production recommendation: NO.** A new HIGH mobile Assistant defect was reproduced. Signed-in and complete ordinary-Chrome auth gates remain unverified. The rollback discrepancy is explained by a pre-commit deployment, but exact uploaded-tree equivalence and full compatibility are not certified. No production deployment, production ref movement, provider configuration change, application fix, migration, production-data mutation, payment/refund/courier enablement or rollback occurred.

## 1. Push verification

Pre-push branch and full HEAD matched the requested candidate; working tree was clean. Origin remained https://github.com/skxnz-marketplace/skxnz-website.git. Fetch succeeded. Remote integration was 4ed351f80fc04f8b5856a6fdbf77f54838a9f708; remote/local left-right count was 0/1 and remote was an ancestor of local HEAD. Both local and remote launch-war-july30 were 81d863d3a8ae1c6ed89995994687654b7b550886.

The first push waited at Git Credential Manager's account chooser and was cancelled without pushing. A command-local credential.username=skxnz-marketplace selected the intended existing identity. Normal push succeeded: 4ed351f..bfe8469, integration branch only, no force. Remote integration was subsequently verified at the exact candidate; remote production remained 81d863d.

GitHub reference: https://github.com/skxnz-marketplace/skxnz-website/commit/bfe8469e6c18fd0e04fa09b364969aa09e379299

Documentation is committed separately after this QA record. That local documentation commit is not the hosted application SHA and must not be mistaken for another application deployment. No documentation push is authorized or performed in this pass.

## 2. Preview deployment identity and scope

Before push, Vercel Settings showed Production branch tracking launch-war-july30 and Preview tracking all unassigned branches. Preview had no custom domains. skxnz.com remained assigned to Production. Integration-specific Preview overrides were present for the Supabase URL, publishable key, secret key, Turnstile public key and secret. Only the public URL was revealed: the isolated QA project uktgghekyeolkppdujjj. Secret values were not printed or copied. Public catalogue pages independently showed the intended QA taxonomy and two fixtures. No production Supabase project was used for mutations.

| Artifact | Identity | Result |
| --- | --- | --- |
| Git-triggered Preview | dpl_JAfD8EakYobcNLcjrjQ6p19ku1bT | READY; bfe8469; Preview; 1m27s; existing cache restored |
| Clean rebuild of identical source | dpl_2Jaf5VDESpkfUAW55kRUf2AN5wDp | READY; bfe8469; Preview; 1m54s; build cache disabled |
| Initial immutable hostname | skxnz-website-ek7rapyak-sethbeharilalpoddar-1313s-projects.vercel.app | Initial public/four-fix checks |
| Clean immutable hostname | skxnz-website-b9w1dquw1-sethbeharilalpoddar-1313s-projects.vercel.app | Raw hosted SEO checks |
| Stable integration alias | skxnz-website-git-int-9d8429-sethbeharilalpoddar-1313s-projects.vercel.app | Followed clean rebuild; later public/consent/responsive checks |

Both deployment cards linked the full requested candidate and integration branch. Only vercel.app aliases were listed; Assigning Custom Domains was Skipped. No skxnz.com or www.skxnz.com assignment or promotion was performed. The stable hostname is the QA Turnstile-authorized hostname; arbitrary immutable hostnames are not substitutes for auth testing.

## 3. Hosted clean build and installation

The first build succeeded but restored the previous build cache, so it did not close the clean-install gate. An explicitly Preview-only redeployment of the same source was then created with Use existing Build Cache unchecked.

Clean log: Washington, D.C., USA (East), iad1; 2 cores/8GB; Vercel CLI 64.0.2; pnpm 10.33.0; lockfile up to date; Skipping build cache, deployment was triggered without cache; 420 packages, reused 0; dependency installation completed in 18.3s; Next 15.5.15; Build Completed in /vercel/output; Deployment completed. Final state READY. Installation and build PASS. This is the build region, not a newly certified function-execution region.

Five warning entries were shown. They were not opportunistically fixed. Full-log clipboard export returned empty and is not evidence; saved log excerpts and the READY card establish installation/build completion. The existing 265 local tests, typecheck, eight lint warnings and route smoke remain prior fix-pass evidence, not a newly executed hosted test suite.

## 4. Four-fix hosted QA

| Fix | New hosted evidence | Disposition |
| --- | --- | --- |
| QA02 Returns contrast | Ordinary Chrome at measured 1440/1280/390/320. Notice foreground rgb(255,254,250), restrained translucent panel, wrapping and full-page screenshots inspected; no page overflow or notice clipping | PASS for requested contrast/readability scope |
| QA03 Support Read FAQ | Same four widths: readable normal/visited, visible keyboard focus, Shift+Tab/Tab then Enter reaches /faq. Actual pointer hover produces cream background and rgb(16,0,6) text. Screenshots inspected at 1280/390; 1440 and 320 hover state observed directly. Destination and layout retained | PASS |
| M06 variant pricing | Initial unselected PDP shows base3999; M3999; L4299; M→L→M→L updates. L quantity2 gives cart price4299/subtotal8598; checkout review shows L/Black/Qty2 and8598, payment disabled. Additional M/L and quantity controls exercised at all nine widths | PARTIAL: authoritative newly stored unpaid order line NOT verified |
| M09 wishlist variant | L cart Save for Later removed the selected line from local cart. Opening /wishlist required sign-in. No stored selection was read by bypassing auth | UNVERIFIED: L/M reload→wishlist→cart, stale/inactive/legacy/plain-product and network retry cases remain |

The QA catalogue currently has M priced3999 explicitly; the hosted null-price fallback was not independently exercised. The prior local focused suite covers null/undefined fallback, but that is not hosted fixture proof. No pricing mismatch was observed in the completed public steps. No new unpaid draft was submitted in this pass.

## 5. Ordinary Chrome auth and Turnstile

Ordinary Google Chrome was launched and connected; this was not only the in-app browser. The stable integration login rendered a real Cloudflare widget showing Success; screenshot retained. This closes challenge rendering only.

The existing QA account passwords are not available. Buyer sign-in was requested through a private browser handoff; no completion was received during this pass. No password was guessed, account password reset by an administrator, or provider protection weakened. Supabase provider sign-in also required a fresh login. Browser control intermittently timed out/detached; affected steps are not passes.

| Required auth step | Result |
| --- | --- |
| Ordinary Chrome real challenge renders | PASS, automatic Success observed |
| Valid login / wrong password | UNVERIFIED |
| Missing/invalid/expired token in ordinary Chrome | UNVERIFIED |
| Signup and confirmation email | UNVERIFIED |
| Recovery email/callback/reset/re-login | UNVERIFIED; new password entry requires user handoff |
| Logout/re-login/protected destination/session redirects | UNVERIFIED for this candidate |
| Fresh provider proof of hostname/key pairing and Supabase enforcement | UNVERIFIED; prior isolated QA setup evidence is historical |

H04 source was unchanged by the four UX fixes and prior local fail-closed regressions passed. That does not close the required hosted/Chrome enforcement gate.

## 6. Responsive interaction matrix

P means the explicitly named interaction passed, F means an observed failure, and U means unverified. These are scoped checks, not whole-page visual approvals.

| Flow / scope |1440|1280|768|430|412|390|375|360|320|
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home slide keyboard controls, measured width/no page overflow |P|P|P|P|P|P|P|P|P|
| Complete hero/video scroll/crop/CTA visual sequence |U|U|U|U|U|U|U|U|U|
| Navigation open, body scroll lock, Escape close |P|P|P|P|P|P|P|P|P|
| Drawer focus return/trap, real touch/portrait device behavior |U|U|U|U|U|U|U|U|U|
| Shop size/price filtering, empty result, reset, no page overflow |P|P|P|P|P|P|P|P|P|
| Six-production-product layout / query-error simulation / sorting |U|U|U|U|U|U|U|U|U|
| PDP M/L prices, quantity increment/decrement, no page overflow |P|P|P|P|P|P|P|P|P|
| PDP gallery, complete wishlist and stale-stock interactions |U|U|U|U|U|U|U|U|U|
| L×2 cart and unpaid checkout displayed price/subtotal |U|U|U|U|U|U|U|U|P|
| Search suggestions/keyboard/no-result/navigation |U|U|U|U|U|U|U|U|U|
| Prism input keyboard/focus and input hit-test/no page overflow |P|P|P|P|P|P|P|P|P|
| Prism settled canvas appearance/context-loss/navigation cleanup |U|U|U|U|U|U|U|U|U|
| Floating Assistant pointer Send |U|U|U|U|U|U|U|U|F|
| Stylist truthful unavailable content, no generation actions |U|U|U|U|U|U|U|U|P|
| Returns notice readability |P|P|U|U|U|P|U|U|P|
| Support FAQ normal/visited/hover/keyboard/destination |P|P|U|U|U|P|U|U|P|
| Full auth layouts/signup/recovery interaction |U|U|U|U|U|U|U|U|U|
| Account/addresses/wishlist/orders/eligible returns |U|U|U|U|U|U|U|U|U|
| Ticket creation/reply/community interactions |U|U|U|U|U|U|U|U|U|
| Seller/admin authorized isolated operations |U|U|U|U|U|U|U|U|U|

Shop uses two isolated ACTIVE fixtures: filtering L leaves the jacket only, combining Under2000 produces the honest no-match state, resetting restores two products. This is not a six-product production catalogue proof. No sort control was present in the inspected filter panel.

Prism visibly rendered at390 and its text input was unobstructed at every measured width. Rapid consecutive resizes left some canvas measurements from the preceding frame, so the saved canvas matrix is explicitly not settled visual correctness. Unsupported-WebGL fallback, touch gestures and cleanup remain unverified. Home media had readyState4/no media error and was paused; that is not video-scroll sequence proof. An early homepage loop targeted a different active tab and was discarded; the saved replacement matrix guards actual widths.

## 7. Upload boundary

Current-artifact result: UNVERIFIED. The exact 786431/786432/786433-byte PNG fixtures and unsupported text file remain available outside the repository. No uploads were made during this pass because authenticated isolated seller/admin access was not established.

Historical 4ed351f results: below/at accepted, above/text rejected, two accepted images persisted in the unpublished QA product with correct ownership. Do not relabel that as bfe8469 hosted proof. Client rejection is also not an independent forged oversized server-action test. Retest success persistence, recoverable failure/retry, owner and cross-seller/admin behavior at exactly786432 bytes maximum.

## 8. Buyer, seller and admin isolated QA

Current artifact: signed-in flows UNVERIFIED. Public pricing/cart/checkout review and the protected wishlist login boundary were observed. Buyer stored draft price4299, address/account/order/return/ticket flows, seller uploads/fulfilment/cross-owner denial and admin return/support operations were not repeated.

Previous five-account fixtures and the October10 buyer/seller/admin evidence remain historical. No persistent QA DB records were created or modified in this pass, and no production data was mutated. Do not enable payment, refunds or shipping to exercise these flows.

## 9. Hosted raw sitemap, robots, llms and JSON-LD

Authenticated ordinary Chrome opened the clean immutable deployment's raw files, not local generated copies:

| Path | Browser document type | Body result | Independently observed application HTTP status |
| --- | --- | --- | --- |
| /sitemap.xml | application/xml | Accessible;17URLs =13static+1QAbrand+1QAcategory+2QAproducts | UNVERIFIED |
| /robots.txt | text/plain | Accessible; private route exclusions and canonical sitemap present | UNVERIFIED |
| /llms.txt | text/plain | Accessible; canonical host and private-preview limitations present | UNVERIFIED |

All sitemap loc references use https://skxnz.com. The two product URLs are qa-plain-tee and qa-signal-jacket, intentionally ACTIVE isolated fixtures. Archived QA, unpublished upload product, demo and private URLs are absent. The production expectation of six ACTIVE products cannot be imposed on a correctly isolated two-fixture QA project. A later production-environment sitemap check must confirm six without deploying QA credentials.

Robots disallows account/admin/api/auth/cart/checkout/auth-password/login/orders/seller/signup/wishlist and private AI generation tools. An unauthenticated HEAD to the exact clean sitemap returned302 to Vercel SSO, text/plain, with Preview noindex. That is a protection response, not an application200. The Vercel connector fetch tool was unavailable to the model and the CLI was not installed/linked. No cookies or bypass tokens were extracted and protection was not disabled.

Normal hosted product JSON-LD parsed as Organization/WebSite/Product/BreadcrumbList; brand/category parsed root schemas and BreadcrumbList. No literal closing-script sequence was present. This is normal hosted serialization evidence; the malicious breakout regression remains prior local evidence. No malicious catalogue payload was inserted.

## 10. GA4 and consent

GA4 survives in source: components/consent and lib/consent have no diff against supplied live06d78d5; root still imports/mounts GoogleAnalytics. Four UX fixes did not alter these files.

Ordinary Chrome Preview: reject optional cookies→analytics unchecked; opt in→save→reload→analytics remains checked; withdraw→analytics unchecked and consent banner returns. No googletagmanager script was present in any of these states, expected because hostname is Preview. This is DOM/script-gating proof, not a captured complete network trace. Production-host collection and network withdrawal remain a final approved production smoke item. No GA4 configuration or ga4-skxnz files were touched.

## 11. Rollback provenance

- Metadata base:57e31424cfb4c144bff08dddf700c2037426901c.
- Subject:Add Vercel Web Analytics integration. Author/commit date:2026-09-24T09:50:53Z.
- Supplied live code commit:06d78d58265b4b11b4bdc83e68da29124cb72c94, feat: add GA4 analytics,2026-09-27T22:54:17+05:30.
- 57e3142 is an ancestor of06d78d5. The range contains one commit,9files,+72/-15.
- Changed files: PROGRESS.md; app/cookies/page.tsx; app/layout.tsx; components/consent/consent-manager.tsx; components/consent/google-analytics.tsx; lib/consent/google-analytics.ts; lib/consent/script-gate.ts; tests/auth-trust.test.cjs; tests/tsconfig.json.
- Runtime change is primarily GA4 initialization/mounting, production-host and consent gating, withdrawal opt-out, consent copy; remaining changes are tests/documentation. 57e3142 alone has Vercel Analytics but lacks these GA4 additions.
- Crucially, PROGRESS.md in immutable commit06d78d5 explicitly records the founder-approved GA4 production deployment dpl_3jcbgTobUaMQTmTfzmX5SeZHnkHB before committing. Deployment time21:55:34+05:30 precedes the22:54:17 commit. The uploaded Vercel Source viewer contains the complete27-line GoogleAnalytics component matching that later commit, despite the57e3142 Git link. Therefore the metadata does not describe an unchanged57e3142 runtime tree. The evidence supports a pre-commit working-tree deployment, not accidental loss of GA4 in that artifact.
- Searching Vercel project history by06d78d5 returned No Results. No separate deployment whose metadata is exactly06d78d5 was found. The existing deployment is the artifact historically associated with that subsequently committed work; absence of an exact-metadata match is not proof the GA4 work was never deployed.

The retained dpl_3jcbgTobUaMQTmTfzmX5SeZHnkHB remains READY, Production, with skxnz.com displayed as its current domain. It therefore exists and currently serves Production. Instant Rollback/Promote are disabled on its menu while it is already current; that is not proof it is ineligible after replacement. Retention is enabled at project level, but a future retention guarantee/pin was not established. Historical environment values and future alias reassignment were not exercised.

A read-only current production /shop request returned200 with additive0019/0020 already applied. Prior contract reconciliation supports schema compatibility; this public smoke is not full buyer/seller/admin compatibility of the old artifact. Full uploaded-tree equivalence to06d78d5, retained/eligible rollback status after replacement, appropriate environment and full additive-schema compatibility are not all independently certified.

**CERTIFIED ROLLBACK DEPLOYMENT: NONE.**
**SOURCE SHA: UNVERIFIED for full uploaded-tree equivalence.**
**Leading rollback candidate:** dpl_3jcbgTobUaMQTmTfzmX5SeZHnkHB; metadata57e31424cfb4c144bff08dddf700c2037426901c; historical GA4 code association06d78d58265b4b11b4bdc83e68da29124cb72c94.

Minimum closure: preserve/verify retention of this exact current artifact; compare its uploaded runtime/source manifest to the post-deployment06d78d5 tree (accounting explicitly for post-deploy documentation), verify environment and old-code/live-schema contract, and confirm alias/rollback eligibility without promoting or rolling back. Do not rebuild from bare57e3142 and assume GA4 survives. No rollback was executed.

## 12. Finding dispositions

No finding was fixed or silently removed. These are reviewer dispositions and proposed acceptance conditions, not newly granted founder acceptance. The explicit local-only wishlist allowance is already accepted by the user. Other launch exceptions still require explicit acceptance before production.

| ID / severity | Disposition | Rationale / remaining condition |
| --- | --- | --- |
| FG-H01 HIGH, new | MUST FIX BEFORE PRODUCTION | At320x900 the floating launcher covers Send. Actual pointer click closes chat; Enter submits and returns real QA jacket. Send rect x232/y827/44x44 has Open SKXNZ AI Assistant as topmost hit target. Panel z120 versus launcher z121. Paths: components/ai/floating-skxnz-assistant.tsx:754,910,921,938. Minimum safe fix: hide/reposition launcher while panel is open or ensure panel's interactive controls are above it, then pointer/touch recheck across widths. Flow stopped; no fix made |
| M01 MEDIUM cache invalidation/no-TTL navigation | ACCEPT FOR LAUNCH, conditional | Unpaid discovery-only scope; tolerate documented stale displays; retain authoritative server draft validation. Owner acceptance pending; targeted invalidation remains follow-up |
| M02 MEDIUM stale cart/wishlist snapshots | ACCEPT FOR LAUNCH, conditional | No money capture; server rechecks draft. Stale/missing variant and retry hosted tests still mandatory; no assumption the M09 source fix resolves all stale snapshots |
| M03 MEDIUM community errors shown as empty | POST-LAUNCH, proposed | Document misleading empty state; restricted community exposure only. Do not claim a database-error UX pass; owner exception pending |
| M04 MEDIUM static editorial/AI availability claims | MUST FIX BEFORE PRODUCTION | Hosted home still says AI Styling Live Beta while Stylist is unavailable; static example names Chrome District/Signal Studio as catalogue recommendations. Paths lib/home-data.ts:199 and components/home/ai-signal-panel.tsx:92. Minimum: truthful unavailable/editorial labeling or remove unsupported live claims. This is copy reconciliation, not an SEO redesign |
| M05 MEDIUM local wishlist/server sync gap | ACCEPT FOR LAUNCH | User explicitly permits local-only wishlist; no sync project started |
| M07 MEDIUM WebGL fallback/context resilience | POST-LAUNCH, proposed | Shader rendered on this Chrome; unsupported/context-loss behavior remains unverified. Manual hardware exceptions need explicit acceptance; no new fallback claimed |
| M08 MEDIUM error-page nothing-submitted guarantee | POST-LAUNCH, proposed | Payment stays disabled; document that draft/ticket outcome may require checking account state before retry. Neutral recovery copy remains follow-up; owner exception pending |
| L01 LOW unused Prisma build burden | POST-LAUNCH | Clean hosted generation/build succeeds |
| L02 LOW explicit private noindex | POST-LAUNCH | Keep auth/robots/protected Preview; explicit private metadata still debt |
| L03 LOW legacy/demo/upload/alias copy | POST-LAUNCH | Prior seller-create5MB wording and alias hops remain; no copy fix claimed |
| L04 LOW eight lint warnings | POST-LAUNCH | Existing informational warnings; no cleanup |
| QA-L05 LOW support list needs reload | ACCEPT FOR LAUNCH, proposed | Prior successful ticket/reply evidence retained; current signed-in behavior unverified. Owner exception pending |
| QA-L06 LOW cancelled/unpaid draft operation count | POST-LAUNCH | Count is misleading; do not use attention count to authorize unpaid fulfilment. Payment/shipping remain disabled |
| Known users grant hardening | POST-LAUNCH | Separately recorded anon TRUNCATE/TRIGGER/REFERENCES and authenticated TRUNCATE; no release-specific exploitation path newly demonstrated |

QA02/QA03 now pass hosted scoped checks. M06/M09 remain source-resolved but their required full hosted checks are incomplete. B01 normal hosted JSON and H01 live catalogue recommendation pass in the stated scope. H02 fresh upload verification is pending; H03 unavailable content passes; H04 complete enforcement/auth remains pending.

Keep payment capture disabled until atomic stock revalidation/decrement at the proper payment/order boundary is implemented and verified. Refund/courier integrations and Stylist generation remain disabled. No setting was enabled in this task.

## 13. Final production recommendation and evidence

**READY FOR PRODUCTION: NO. Production has not been deployed or recommended.**

Required remaining gates:
1. Fix and reverify FG-H01 under a separately authorized code change; reconcile M04 public availability/editorial claims.
2. Complete ordinary-Chrome login, wrong-password, CAPTCHA rejection/enforcement, signup/confirmation, recovery/reset and session/destination flows with authorized QA accounts.
3. Complete M06 newly stored unpaid line price4299 and M09 L/M/plain/stale/inactive/legacy/network/retry/Save-for-Later preservation on the hosted artifact.
4. Re-run isolated buyer/seller/admin workflows and exact786432-byte upload boundary/persistence/ownership/recovery.
5. Finish the full responsive interaction/visual matrix, especially hero/video, search, gallery, real touch/input usability, signed-in screens and WebGL fallback/cleanup, or obtain explicit exceptions.
6. Capture authenticated raw application response status where required; confirm the eventual production-environment six-product sitemap separately from the QA two-product fixture sitemap.
7. Certify an exact retained rollback artifact/source/environment/DB compatibility and eligibility.
8. Obtain explicit disposition acceptance for remaining proposed MEDIUM/LOW exceptions; preserve disabled commerce features.
9. Verify approved production-host GA4 collection only at the final production smoke stage; do not make Preview collect production analytics.

New evidence is in C:/Users/BHOLENATH/Documents/Codex/2026-10-03/skxnz-release-candidate-review-pre-production/outputs, prefixed FINAL_GATE_. Important files: CLEAN_DEPLOYMENT_FULL/CLEAN_INSTALL_START/CLEAN_INSTALL_DONE/CLEAN_BUILD_END; RETURNS/FAQ/FAQ_HOVER; PRICE_SWITCH/CART_L2/CHECKOUT_L2; NAV/HOME/SHOP/PDP/PRISM_MATRIX; JSONLD/RAW_SEO; CONSENT; ASSISTANT_LIVE/ASSISTANT_OVERLAP/ASSISTANT_320; CHROME_TURNSTILE_SUCCESS; ROLLBACK_FULL/ROLLBACK_UPLOADED_GA4_FULL/ROLLBACK_GIT_PROVENANCE/ROLLBACK_57_TO_06. Some early AX files contain diffs only; the explicitly FULL files and body/log excerpts supersede them. The empty BUILD_ALL file is not proof.

The external consolidated SKXNZ_FULL_TASK_REPORT_2026-10-10.md receives this addendum. Repository documentation and PROGRESS.md are committed separately; application source remains exactly bfe8469. No documentation commit is pushed in this pass. Production branch remains81d863d. Stop at this recommendation.

## 14. Signed-in hosted continuation — 2026-10-20

This section supersedes the pending signed-in/upload/hero statements above only for the cases actually completed here. Earlier deployment/build/SEO/consent/rollback evidence remains as recorded. The same stable integration Preview and bfe8469 application were tested. Local HEAD started at documentation-only 5b11b4fcac94c9f5862000eef8b2584641a2e9a8; origin integration remains bfe8469. No additional push or application deployment occurred. Production branch remains81d863d. All persistent mutations below target isolated QA project uktgghekyeolkppdujjj, never production hhsorrkvgvxxpwzrggei.

### 14.1 Four-fix and role results

| Gate | Current hosted evidence | Result / limits |
| --- | --- | --- |
| Returns / FAQ contrast | Earlier requested1440/1280/390/320 checks retained | PASS for recorded scope; no new application change |
| M06 authoritative variant price | Buyer B selected L, quantity2; cart/checkout4299 each /8598. Created draft370f606d-725d-466f-a3d3-a6aa8f5d42a0; refreshed buyer and independent admin details both show L / Black / Qty2 /4299 each /8598 | PASS core stored-price gate. Buyer reader selects saved order_items unit_price_paise/quantity, not a local estimate. Fixture M explicitly3999; null-price fallback not freshly hosted |
| M09 exact selected variant | L save→reload→wishlist→cart remains L4299; cart Save for Later→reload→cart remains L4299. M save→reload→cart remains M3999. Plain product saves/restores One Size / Default /1999 | PASS positive cases; local-only wishlist remains accepted |
| M09 reselection | Unsized jacket product-card bookmark shows Choose Color / Choose Size and unavailable/reselection message; Move to Cart disabled | PASS legacy/unspecified selection boundary. Actual later-inactivated/missing variant and network-failure/retry cases still UNVERIFIED |
| Buyer isolation | Buyer B cannot read Buyer A order9d6067cd or tickete6b9ddf3 (not-found screens). Admin/seller routes redirect to /?denied=role. Own returns list empty | PASS tested UI/reader paths, not an exhaustive API authorization audit. Nonexistent per-return buyer URL was discarded as invalid test evidence |
| Seller isolation | Seller B sees its two owned products. Seller A producta3333333-3333-4333-8333-333333333331 gives not-found; admin route denies role | PASS tested owner/role paths |
| Admin order | New draft correctly says unpaid/no provider. Admin cancelled it with explicit QA audit note; terminal state and audit event persisted; ordinary Chrome buyer detail also shows Cancelled and return unavailable | PASS cancellation/audit/buyer propagation. Never set paid, shipped, refunded or delivered |
| Support | Buyer B created linked ticket902b5b07-618a-453b-af5e-8385c4226bd3 and reply; admin reply and Resolved persisted after reload; ordinary Chrome buyer sees all three messages and reply-disabled resolved state | PASS tested thread/status path. No email/push integration invoked |
| Returns | Existing synthetic delivered return04326a33-74a2-4217-8f22-95fa02b15d20 remains Approved — refund not executed. No admin transition available; text explicitly excludes refund/pickup | PASS read-only state/gating recheck. New eligible return submission/approval not repeated against bfe8469 |

Verified accounts: ordinary Chrome QA Buyer B (2ce4df67-31ef-4824-984a-7126413f8650), IAB QA Seller B (c10d2abd-4a96-4f89-8347-17c1ff021a68), then IAB QA Admin A (e7668505-1a11-4b97-8852-c95e36be77d7). User performed sign-ins privately. Buyer A was originally requested, but actual Buyer B identity was verified and used as the approved isolated fixture; no identity assumption was carried forward.

### 14.2 H02 exact 768 KiB upload

Seller B used owned unpublished product4c4cff2a-c669-4cd4-bf80-e0885ff2fc6b, [QA ONLY] Upload boundary fixture. UI correctly states JPEG/PNG/WebP up to768KiB each. Filesystem-verified PNG sizes:

| Bytes/type | Result |
| --- | --- |
| 786431 PNG | Accepted; gallery2→3 |
| 786432 PNG | Accepted; gallery3→4 |
| 786433 PNG | Rejected: Image must be768KiB or smaller; gallery unchanged |
| Unsupported text | Rejected: Image must beJPEG,PNG,orWebP; gallery unchanged |

Reload retained4images; both accepted uploads persisted. Invalid-file state recovered to successful valid upload. Product remained PENDING_REVIEW; no publication or ownership change. Cross-seller product access was denied. **PASS normal hosted boundary/persistence/ownership scope.** Forged oversized server-action requests, transport outage recovery and independent Storage byte inspection remain UNVERIFIED. Asynchronous completion was awaited before interpreting result; no duplicate retry submission was used.

### 14.3 Responsive interaction additions

All widths measured in ordinary Chrome at height900:1440/1280/768/430/412/390/375/360/320.

| Flow | All nine widths | Limits |
| --- | --- | --- |
| Hero scroll film | PASS forward early≈2s→later≈6.4s→reverse≈3.5s; readyState4, no media error, settled seek within0.15s of target; visible frames inspected at all widths; no horizontal overflow | Native wheel input and state-based frame checks, not screenshots alone. Physical touch/reduced-motion/media-failure behavior unverified |
| Address form | PASS no overflow and keyboard Full Name→Phone focus; mobile inputs16px | Physical iOS zoom not proven |
| Community | PASS empty feed, no overflow, invite-only Create Post guard | No post created; populated cards and query-error state unverified |
| Earlier navigation/shop/PDP matrix | Retained PASS for documented drawer/Escape/scroll-lock, filtering/reset/empty, price/quantity cases | Gallery gestures, complete focus trap/return, physical touch and all private-screen widths remain incomplete |

Hero evidence is FINAL_GATE_FILM_SETTLED_MATRIX_bfe8469.json and27 settled screenshots. Earlier rapid-resize/transient FILM_MATRIX samples are superseded and must not be used as passes. Search flow stopped at the new defect below; there is no all-width search PASS. Prism full resize/context-loss/cleanup/fallback gate remains incomplete.

### 14.4 New findings and explicit disposition changes

| Finding | Severity / disposition | Behavior, evidence and minimum safe correction |
| --- | --- | --- |
| FG-H02 cancelled order presented as paid to seller; supersedes narrow QA-L06 scope | HIGH — MUST FIX BEFORE PRODUCTION | Seller B queue labels order9D6067CD Paid / Awaiting action / Buyer has paid. Independent admin list confirms Cancelled / No payment record. app/seller/orders/page.tsx:101 hardcodes Paid; lib/orders/read-seller-orders.ts:256–269 queries owned lines without parent status; lib/orders/seller-fulfilment-vocabulary.ts:22–23 claims payment for PENDING. More seriously, recorded RPC in supabase/migrations/0020_reconcile_missing_commerce_objects.sql:318 excludes only DRAFT/PAYMENT_PENDING, allowing CANCELLED through that predicate; lib/orders/seller-update-line-fulfilment.ts:73 delegates without a parent-state guard. No Accept/fulfilment action was attempted. Deployed function definition and actual cancelled-line mutation are NOT freshly verified; do not claim server rejection. Minimum: verify deployed RPC, require an explicit allowed parent lifecycle at the authoritative transactional boundary, omit/disable cancelled/unpaid fulfilment controls and derive truthful payment labels from parent/payment evidence. Forward-only correction needs separate authorization; do not edit/apply historical migration during QA |
| FG-M02 search loses suggestions while input stays focused | MEDIUM — ACCEPT FOR LAUNCH only if explicitly accepted; otherwise MUST FIX BEFORE PRODUCTION | Ordinary Chrome1440: submit query with Enter, then edit still-focused input to jacket; focused=true, query=jacket, aria-expanded=false, suggestions0. Enter search/no-result navigation still works. components/shared/site-search-bar.tsx:231–247 sets isFocused=false on submit/Enter without blurring; onChange:271 only updates query, while shouldShowSuggestions:217 requires isFocused. Minimum: keep logical/DOM focus consistent or reopen on editing; recheck keyboard and widths. Flow stopped, no fix |
| QA-L05 support list reload | LOW — ACCEPT FOR LAUNCH, proposed | Not reproduced in this signed-in attempt: newly created ticket appeared without reload. Unchanged source and one successful attempt do not establish a fix; historical finding retained with narrower current evidence |

FG-H01 HIGH Assistant launcher overlap remains MUST FIX BEFORE PRODUCTION. M04 MEDIUM unsupported Live Beta/editorial catalogue claims remains MUST FIX BEFORE PRODUCTION. No finding disappeared: M01/M02 conditional acceptance still needs owner acceptance and remaining stale tests; M03/M07/M08 proposed post-launch exceptions remain pending; M05 local-only wishlist already accepted; L01/L02/L03/L04 remain post-launch; QA-L06 is now subsumed by FG-H02 rather than quietly closed. Known users grant hardening remains separately post-launch. Payment/refund/courier/Stylist generation stay disabled.

### 14.5 Persistent QA ledger and scope

- One synthetic Buyer B address added: QA FIXTURE ONLY — DO NOT SHIP, Isolated QA release bfe8469, QA City / QA State110001, dummy phone9999999999.
- One new unpaid order370f606d-725d-466f-a3d3-a6aa8f5d42a0: Lqty2, unit429900paise, subtotal859800paise. Created18Oct per stored UI; cancelled20Oct with audit note. No charge/refund/shipment.
- One linked ticket902b5b07-618a-453b-af5e-8385c4226bd3: two buyer messages plus one admin reply; final RESOLVED. No external notification.
- Upload fixture4c4cff2a-c669-4cd4-bf80-e0885ff2fc6b: old2images plus2accepted boundary PNGs; final4images, PENDING_REVIEW.
- Local-only Buyer B cart retains jacket Lqty2 and plain teeqty1; wishlist empty after moves. No checkout submitted with the plain tee. No persistent record was deleted.
- Existing cancelled9d6067cd, synthetic delivereda7777777 and approved return04326a33 were not mutated. No production data/provider/schema/settings changes.

Evidence beside the consolidated report is prefixed FINAL_GATE_: BUYER_B_SESSION, WISHLIST_L_RELOAD/L_TO_CART/M_TO_CART/UNSELECTED/PLAIN_TO_CART, SAVE_FOR_LATER_L, BUYER_B_STORED_DRAFT, BUYER_B_ISOLATION, UPLOAD_786431/786432/786433/TEXT/PERSISTED_4, SELLER_ISOLATION/QUEUE, ADMIN_A_SESSION/CANCELLED_ORDER_PROOF/CANCELLED_BUYER_B/TICKET_RESOLVED/APPROVED_RETURN, BUYER_TICKET_ADMIN_REPLY/CANCELLED_DRAFT, SEARCH_FOCUS_REGRESSION, ADDRESS_MATRIX, COMMUNITY_MATRIX, FILM_SETTLED_MATRIX. Text snapshots and screenshots distinguish intermediate asynchronous states from persisted results.

### 14.6 Final recommendation after signed-in continuation

**READY FOR PRODUCTION: NO. CERTIFIED ROLLBACK DEPLOYMENT: NONE.** No production action taken. Preview remains suitable for controlled isolated QA; this is not approval to promote it or ship QA credentials.

Remaining gates: (1) FG-H01 and FG-H02 corrections/reverification plus M04 truthful claims; (2) full ordinary-Chrome wrong-password, missing/invalid CAPTCHA enforcement, signup/confirmation, recovery/reset, logout/relogin/protected destination — successful user-completed Buyer B sign-in and persisted private session alone do not close this gate; (3) stale/inactivated/missing saved variant and network/retry cases; (4) complete responsive/physical-touch/gallery/Prism/private-screen matrix or explicit accepted exceptions; (5) fresh eligible buyer return submission/admin review where required, plus any untested fulfilment flow only after FG-H02 resolution; (6) authenticated raw HTTP status capture behind Vercel protection and eventual six-product production sitemap; (7) full retained rollback source/environment/additive-DB compatibility and eligibility certification; (8) explicit remaining MEDIUM/LOW exception acceptance, including new search finding; (9) approved production-host GA4 network smoke at final production stage. No production recommendation while these are unresolved. No local tests were rerun for documentation-only QA evidence; prior automated build/test results remain unchanged.

## 15. PRE-PRODUCTION DEFECT PASS — 2026-10-20

Scope: exactly FG-H01, FG-H02, M04 and SEARCH. Starting local c48a713f5b246b17953d4de47c000aee5c1168d6 on integrate/recover-missing-work. Remote/hosted application remains bfe8469; production branch remains81d863d. This section records LOCAL corrections and disposable local SQL tests, not a new hosted pass. No push, deployment, production ref/domain change, production-data mutation, hosted migration, payment/refund/courier enablement, archive or ga4-skxnz modification occurred. Historical sections remain intact.

### FG-H01: launcher and composer

Root cause: the fixed draggable launcher remained at z121 above the z120 panel; at320 the launcher's rectangle occupied Send's pointer target. The launcher's pointer-up toggle could therefore close the panel instead of submitting. Loader/global CSS did not supply a competing dismissal path.

Correction: hide and remove the launcher from pointer/tab interaction while open (hidden attribute plus explicit hidden/flex class), retaining the existing close button and Escape. Restore focus to the launcher after closing, without auto-focusing on initial mount. Keep the drag/closed-launcher behavior. Use100dvh for mobile maximum panel height, min-h-0 on scrolling messages and shrink-0 on the composer footer so short viewports preserve the input.

Local production-build ordinary Chrome:320/360/390/430 and1440. Open, input, actual pointer Send, close/reopen and Escape exercised; chat remains open on Send. At320 the original Send center now resolves to Send message to SKXNZ AI; launcher hidden; no page horizontal overflow. A live Signal Black Hoodie recommendation3999 returned. Close restored launcher focus. Settled desktop geometry: width1440, panel430×650 atx975/y154, existing desktop placement retained. Short320×500 viewport: Send visible and topmost, no horizontal overflow. Physical touch hardware and actual mobile virtual keyboard were not available; the short viewport is supporting evidence, not proof of keyboard behavior on a phone. Hosted recheck remains required after a separately authorized Preview.

### FG-H02: authoritative source comparison and lifecycle

Full path: orders.status→0006 seller_owns_post_payment_order_line→order_items seller SELECT policy→read-seller-orders.runLineQuery (owned product ids)→list/detail→SellerLineActions→updateSellerLineFulfilment→seller_update_line_fulfilment. The list hardcoded Paid and PENDING vocabulary said Buyer has paid; neither read actual payment evidence. seller_active_return_indicators separately scopes returned line indicators but previously lacked a parent lifecycle filter.

Fresh READ-ONLY dashboard queries of pg_proc/pg_get_functiondef inspected QA uktgghekyeolkppdujjj and production hhsorrkvgvxxpwzrggei. Production pg_policies confirms seller SELECT invokes seller_owns_post_payment_order_line; buyer SELECT is additive and admin remains is_admin(). The actual orders_status_check contains DRAFT, PAYMENT_PENDING, PAID, FULFILLING, SHIPPED, DELIVERED, CANCELLED, REFUNDED.

| Function | Repository body MD5 | QA deployed body MD5 | Production deployed body MD5 | Comparison |
| --- | --- | --- | --- | --- |
| seller_owns_post_payment_order_line | 5d64409f02b6c5f6d907e1b1b98dc3b7 | 5d64409f02b6c5f6d907e1b1b98dc3b7 | 5d64409f02b6c5f6d907e1b1b98dc3b7 | Body bytes identical; helper denies only DRAFT/PAYMENT_PENDING, so admits CANCELLED/REFUNDED |
| seller_update_line_fulfilment | a2b959ebb1a5486d9fc0fb4e1c9abaef | 20ad542845f4f3918bcd75b5292cbee0 | a2b959ebb1a5486d9fc0fb4e1c9abaef | QA differs only CRLF/LF; normalized bodies identical; same faulty deny-list |
| seller_active_return_indicators | 77165ee4600db6e90bb99d64d453fd3d | 7943f7be8c1e92aef47c986fc589123a | 77165ee4600db6e90bb99d64d453fd3d | QA differs only CRLF/LF; normalized bodies identical; no parent lifecycle filter |

QA/production SECURITY DEFINER and ACLs match: helper search_path=public and NULL ACL (default privileges); write/return functions search_path=public,pg_temp with postgres/authenticated EXECUTE only. No role, grant or policy was changed during this inspection. The source comparison replaces the earlier deployed-function UNVERIFIED status. No cancelled fulfilment mutation was attempted on either hosted DB.

Derived invariant: seller history/return reads only for owned lines with parent PAID/FULFILLING/SHIPPED/DELIVERED. ADVANCE only while parent PAID/FULFILLING and through PENDING→ACCEPTED→PACKED→HANDED_TO_DELIVERY. SHIPPED/DELIVERED retain history and scoped notes/returns, not new preparation/hand-off advances. DRAFT/PAYMENT_PENDING/CANCELLED/REFUNDED cannot read as seller work or mutate through seller RPC. Existing orders lifecycle/roles are reused; no new status invented. Admin's independent policy and admin commerce functions remain unchanged; admin/buyer still cannot invoke seller-only mutations.

Application correction: remove fabricated Paid/Buyer has paid labels. Recheck each owned line through the existing boolean helper at the shared server reader, failing closed on helper errors, so an additive buyer SELECT policy cannot bypass the seller workspace's scope after0021. This check still depends on correcting the existing deployed helper; UI hiding alone does NOT resolve FG-H02. Additional helper calls run in parallel; large-queue performance was not load-tested.

**Database correction REQUIRED:** supabase/migrations/0021_seller_order_lifecycle_allowlist.sql. Replaces only the three functions above using CREATE OR REPLACE; replaces the deny-list with the explicit parent allow-list, bounds ADVANCE, locks parent order with its line to serialize against cancellation, and aligns return indicators. Preserves ownership/SELLER checks, signatures, events, owners and grants; pins all three search paths to public,pg_temp. No table, data, policy or historical migration change.0020 remains byte-for-byte unchanged. Helper comment updated to reflect its corrected invariant.

**0021 SHA-256 (UTF-8/LF): 5debeca2f16ee4ad80e4220f2018a2914a6ff90a374412696f8e70ec31b072c4. NOT APPLIED to QA or production.**

Verification: supabase/verification/0021_seller_order_lifecycle_test.mjs plus0021_seller_order_lifecycle_verify.sql. Runner accepts a PGlite module installed outside the repository; creates only an in-memory disposable PostgreSQL contract fixture, loads original canonical function definitions, reproduces cancelled admission, opens BEGIN, loads the exact0021 bytes, tests and ROLLBACKs. No hosted URL/credentials or migration-history writes. Required ineligible states, eligible reads, owned action ladder, cross-seller denial, buyer/admin/anon action denial, terminal/cancelled action and note denial, audit events, actual authenticated RLS matrix, admin read policy, SECURITY DEFINER/search_path/ACL/owner preservation and rollback restoration PASS. Twelve check groups. This is not a live hosted migration application, a full Supabase instance integration test or a concurrent-load proof. Review exact SQL separately before any application.

### M04: truthful public content

- AI Styling Live Beta→Unavailable; unavailable checkout/returns/shipping labels use Not Connected rather than launch timing promises. Hero copy no longer asserts particular luxury inventory or a currently functioning AI Stylist.
- AI panel explicitly says Stylist unavailable; CTA is AI Stylist Status. Decorative chat is labeled Illustrative conversation and no longer recommends fictional Chrome District/Signal Studio stock.
- Static FeaturedLabels is Brand Inspiration with an explicit no-stock/no-partnership disclaimer; CTA leads to actual catalogue brands. Live Brand Spotlight stays canonical.
- Luxury Finds becomes Luxury Inspiration with explicit editorial/non-listing context; category and mosaic imagery likewise distinguish inspiration from actual result availability. Existing layouts/routes remain. No new catalogue source or SEO redesign.

### SEARCH: state machine and async ordering

Root cause: submit/Enter set isFocused=false while the input stayed focused; subsequent onChange never reopened it. Correction models suggestionsOpen explicitly: focus/edit opens, submit/Escape/outside blur closes; empty query remains closed. No arbitrary close timeout. Internal focus is retained; suggestion buttons work by native click/keyboard activation. ArrowUp/Down tracks an active option, Enter selects it or submits the query if no option selected. Query changes reset selection. Live results carry their originating query and aborted responses are ignored, preventing old responses/results from replacing a newer query.

Focused tests cover Enter/edit, form-submit/edit, empty, Escape, inside/outside blur, arrow/Enter selection, stale query visibility and an actual deferred response resolving after abort. Ordinary Chrome1440: submit hoodie, retain focus, edit jacket→expanded=true and live jacket suggestion; ArrowDown/Enter reaches Obsidian Utility Jacket PDP. At320/360/390/430 each submit closed, subsequent edit reopened and Escape closed. Mobile placement preserved. Hosted recheck remains required.

### Verification and file classification

Application and test TypeScript compilation PASS. All276 tests PASS (265 existing+11 new); local SQL suite separate PASS. Lint0errors/8 unchanged warnings. Production build PASS with82 pages against read-only live catalogue. Initial build attempt hit machine certificate trust failures; final build uses Node's system CA trust, without disabling TLS verification. Initial pnpm wrapper attempted module reconciliation; equivalent local Next/TypeScript/ESLint binaries ran directly without dependency/lockfile changes. Frozen reinstall was unnecessary. Final route/API smoke108 probes matches prior statuses; sitemap36URLs/6ACTIVE products, archived QA/private URLs excluded. Missing-key login/signup/recovery remain200 with explicit configuration error and disabled submission. git diff --check PASS.

Prior B01/H01/H02/H03/H04, Returns/FAQ contrast, M3999/L4299 pricing, wishlist exact variant behavior, GA4 consent/host gating, canonical catalogue and unpaid checkout tests remain green. No secret/config/payment gate changed. Local live-catalogue browser checks are read-only; no order/upload/support/return mutations in this defect pass.

| Application file | Sole finding classification |
| --- | --- |
| components/ai/floating-skxnz-assistant.tsx | FG-H01 |
| app/seller/orders/page.tsx | FG-H02 |
| lib/orders/read-seller-orders.ts | FG-H02 |
| lib/orders/seller-fulfilment-vocabulary.ts | FG-H02 |
| components/shared/site-search-bar.tsx | SEARCH |
| lib/home-data.ts | M04 |
| components/home/ai-signal-panel.tsx | M04 |
| components/home/featured-labels.tsx | M04 |
| components/home/luxury-finds.tsx | M04 |
| components/home/category-showcase.tsx | M04 |
| components/home/mosaic-section.tsx | M04 |

Tests: pre-production-defects.test.cjs covers the four findings; commerce-actions.test.cjs adapts only the seller fixture resolver to the added eligibility read. Database commit contains only0021 and its two verification files. Allowed documentation: this append-only report and concise PROGRESS.md entry. No unrelated application changes or historical report rewrites.

Disposition: FG-H01/M04/SEARCH locally corrected, awaiting new exact-SHA hosted QA. **FG-H02 remains HIGH and MUST FIX before production because0021 is unapplied.** UI code is suitable for another controlled Preview regression pass, but that Preview cannot clear seller lifecycle until SQL is separately reviewed, authorized/applied to isolated QA and reverified. Production remains NOT READY. Existing complete Chrome CAPTCHA/signup/recovery, stale-variant/network and remaining responsive/return gates, exception acceptance and certified rollback NONE remain unchanged/out of this fix pass. No automatic migration application or promotion is authorized.

Evidence in the existing external outputs directory: PREPROD_QA_FUNCTIONS/PRODUCTION_FUNCTIONS/FUNCTION_COMPARISON/PRODUCTION_POLICY_2026-10-20.json, PREPROD_0021_LOCAL_ROLLBACK_2026-10-20.json; PREPROD_DEFECT_TESTS/LINT/BUILD/ROUTE_2026-10-20.txt; PREPROD_ASSISTANT_MATRIX/DESKTOP_GEOMETRY/SHORT_VIEWPORT and PREPROD_SEARCH_REOPEN/MOBILE_MATRIX records/screenshots. No consolidated historical report was rewritten in this pass.
