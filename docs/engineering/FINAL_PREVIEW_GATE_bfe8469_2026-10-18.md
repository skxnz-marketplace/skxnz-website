# FINAL PREVIEW GATE — bfe8469

Review date: 2026-10-18. Application candidate: integrate/recover-missing-work at bfe8469e6c18fd0e04fa09b364969aa09e379299. This addendum supersedes earlier readiness statements only where new evidence is recorded. Historical tests against 4ed351f are not passes for this artifact.

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
