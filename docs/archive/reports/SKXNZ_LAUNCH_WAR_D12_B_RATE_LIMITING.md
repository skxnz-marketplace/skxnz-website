# SKXNZ Launch War — Day 12-B: Centralized Abuse Protection

- **Worktree:** `skxnz-codex-d12b-rate-limiting`
- **Branch:** `codex/d12b-rate-limiting`
- **Base:** `6532a4c`
- **Scope:** application-layer rate limiting. No SQL, no migrations, no schema change, no push, no deploy.

---

## 1. The headline caveat, stated first

**This is process-local protection only. It is NOT distributed protection.**

No Redis, Upstash, or any shared store exists in `package.json`. The shipped
adapter keeps counters in one Node process's memory. SKXNZ deploys to Vercel,
where each serverless instance and each region has its own memory, so an
attacker spreading requests across instances gets **the configured limit per
instance**, not per system.

This is enforced in code rather than left to prose. `getRateLimiterCapability()`
returns `distributed: false` and a `guarantee` string that says so explicitly,
and a test asserts that string — so a future change cannot quietly start
claiming protection that is not there.

What it does buy today: a single client hammering one endpoint is stopped, which
is the common case for scripted abuse, accidental retry loops, and casual
scraping. What it does not buy: protection against a distributed attacker.
Closing that gap is a store swap, not a rewrite (§8).

---

## 2. Architecture

```
                        call sites (never import deeper than rate-limit.ts)
   Server Actions ──┐                                  ┌── Route Handlers
                    │                                  │
                    ▼                                  ▼
            guardServerAction()                guardRouteHandler()
                    └───────────────┬──────────────────┘
                                    ▼
                        rate-limit.ts   (public API)
                                    │
                    ┌───────────────┼────────────────┐
                    ▼               ▼                ▼
              policies.ts       limiter.ts        helpers.ts
        (every limit lives   (scope check,      (IP extraction,
         here, and only       fail open/closed,   429 + Retry-After,
         here)                degraded flag)      RateLimit-* headers)
                                    │
                                    ▼
                              keys.ts  (namespaced, hashed identity)
                                    │
                                    ▼
                            adapters/index.ts
                       (store resolution + capability)
                                    │
                                    ▼
                        adapters/memory-store.ts
                     (sliding window, process-local)
                                    │
                        [ future: adapters/redis-store.ts ]
```

Files:

| File | Responsibility |
| --- | --- |
| `lib/security/rate-limit/types.ts` | Contracts. No framework imports — the core is transport-agnostic. |
| `lib/security/rate-limit/policies.ts` | **Every limit in SKXNZ.** Numbers appear nowhere else. |
| `lib/security/rate-limit/keys.ts` | Key construction, identity hashing, scope satisfaction. |
| `lib/security/rate-limit/limiter.ts` | Core decision: consume, fail open/closed, degraded reporting. |
| `lib/security/rate-limit/adapters/memory-store.ts` | Sliding-window in-process store. |
| `lib/security/rate-limit/adapters/index.ts` | Store singleton, capability reporting, test reset. |
| `lib/security/rate-limit/helpers.ts` | Next.js glue: IP extraction, 429 response, headers. |
| `lib/security/rate-limit/rate-limit.ts` | Public API. Call sites import only this. |

### Design decisions worth stating

**Sliding window, not fixed.** A fixed window lets an attacker send `limit`
requests at the end of window N and `limit` more at the start of N+1 — a 2×
burst across the boundary. A test proves the sliding window refuses exactly
that.

**Identity is hashed into keys.** A raw user id never appears in a storage key,
so an operator reading the key space (or a future shared Redis) cannot recover
who was limited.

**Anonymous callers under a user-scoped policy are allowed, and flagged.**
Bucketing every anonymous request under one `none` key would let a single abuser
lock out every guest at once. Those requests pass with `degraded: true` so the
gap is visible in the result rather than silently absent.

**No limit number appears outside `policies.ts`.** A test asserts call sites name
a policy and never pass a raw limit or window.

---

## 3. Policy table

| Policy | Limit / window | Scope | On store failure | Guards |
| --- | --- | --- | --- | --- |
| `auth.signin` | 8 / 10 min | user+ip | **closed** | Password spraying, credential stuffing |
| `auth.signup` | 5 / hour | ip | **closed** | Bulk fake-account creation |
| `auth.recovery` | 5 / hour | user+ip | **closed** | Mail-bombing, account enumeration |
| `commerce.checkout` | 10 / 5 min | user+ip | **closed** | Draft-order retry storms |
| `commerce.address` | 30 / 10 min | user | **closed** | Address-table flooding |
| `commerce.wishlist` | 60 / min | user | open | Save-toggle spam (generous — real users toggle fast) |
| `support.ticket` | 5 / hour | user | **closed** | Support-queue flooding |
| `support.reply` | 20 / 10 min | user | **closed** | Thread spam |
| `returns.create` | 10 / hour | user | **closed** | Return-request spam |
| `seller.product.write` | 30 / 10 min | user | **closed** | Catalogue flooding |
| `seller.fulfilment` | 120 / 10 min | user | **closed** | High — bulk processing is legitimate |
| `admin.mutation` | 120 / 5 min | user | **closed** | Blast radius of a stolen admin session |
| `ai.request` | 20 / 10 min | user+ip | **closed** | Third-party API spend and compute |
| `search.suggest` | 60 / min | ip | open | Typeahead scraping |
| `public.read` | 240 / min | ip | open | Reserved generic public fallback |
| `community.post` | 10 / hour | user | **closed** | Reserved — public posting is not open yet |

Everything guarding credentials, money, external spend, or a human work queue
fails **closed**. Only read-side conveniences fail open, so a limiter outage
cannot take browsing down. A test pins the fail-closed set.

---

## 4. Protected endpoints

**Server Actions** (guard runs after auth, before any write, counted against the
verified session id — never client input):

| Action | Policy |
| --- | --- |
| `createOrderIntent` | `commerce.checkout` |
| `createAddress` / `updateAddress` / `deleteAddress` / `setDefaultAddress` | `commerce.address` |
| `saveProduct` / `removeSavedProduct` | `commerce.wishlist` |
| `createSupportTicket` | `support.ticket` |
| `addSupportTicketMessage` | `support.reply` |
| `createReturnRequest` | `returns.create` |
| `createSellerProduct` | `seller.product.write` |
| `updateSellerLineFulfilment` | `seller.fulfilment` |
| `adminUpdateOrderStatus` | `admin.mutation` |
| `adminUpdateReturnStatus` | `admin.mutation` |
| `adminUpdateSupportTicketStatus` / `adminAddSupportReply` | `admin.mutation` |

**Route Handlers** (return a real 429 with `Retry-After` and `RateLimit-*`):

| Route | Policy |
| --- | --- |
| `GET /api/search/suggestions` | `search.suggest` |
| `POST /api/ai-assistant` | `ai.request` |
| `POST /api/ai/buyer-assistant` | `ai.request` |
| `POST /api/ai/outfit-builder` | `ai.request` |
| `POST /api/ai/seller-product-check` | `ai.request` |
| `POST /api/ai/try-on/jobs` | `ai.request` |

Each guarded action gained `RATE_LIMITED` in its result union, so a refusal is a
typed, handled outcome rather than a thrown error. The checkout view mapper
(`lib/checkout/order-attempt.ts`) gained a `rate-limited` branch marked
`retryable: true` — nothing was created or charged, so retrying is correct.

---

## 5. Endpoints intentionally excluded — and one that cannot be protected

### Login, signup, and password reset are NOT protected. This is the biggest gap.

`auth.signin`, `auth.signup`, and `auth.recovery` policies exist and are tested,
but **nothing calls them**, because SKXNZ has no server-side auth endpoint.
`components/auth/auth-card.tsx` calls `supabase.auth.signInWithPassword()` and
`supabase.auth.signUp()` **directly from the browser** to Supabase GoTrue. The
request never touches SKXNZ server code, so no application-layer limiter can see
it.

The only protection today is whatever GoTrue applies upstream, which SKXNZ does
not configure or verify. Closing this requires routing auth through a Server
Action or Route Handler — an architecture change, deliberately out of scope for
this session and recorded as the top blocker in §8.

No password reset, magic link, or OTP flow exists in the codebase at all, so
`auth.recovery` is pre-wired for when one is added.

### Excluded by design

| Surface | Why |
| --- | --- |
| Cart and wishlist toggles in `marketplace-provider` | Browser `localStorage` only. No server request exists to limit. The server-side `saveProduct` path **is** guarded. |
| Community posting | Public posting is not open. Policy pre-wired. |
| `GET /api/ai/*` read routes (`usage`, `audit-logs`, `outfit-results/[id]`, `try-on/jobs/[id]`) | Read-only, no external spend. The cost-bearing `POST` routes are guarded. |
| `/auth/callback` | OAuth redirect handler; limiting it would break legitimate sign-in returns. |
| `signOut` / `signoutAction` | Ending a session is not an abuse vector. |
| Seller inventory / uploads | No such endpoint exists yet. `seller.product.write` covers creation. |
| Admin product moderation | Covered by `admin.mutation` on the order/return/support paths; the moderation action is a status update on an existing row. |

---

## 6. Security review findings

**Addressed here**

- *Burst abuse* — sliding window; boundary-burst case proven by test.
- *Resource exhaustion (memory)* — the store caps tracked keys at 20,000 with
  coldest-first eviction and periodic sweeping, so a key-space flood cannot grow
  memory without bound.
- *Retained-timestamp growth* — once a key is over its limit the exact count no
  longer changes the decision, so the hit array is capped rather than growing.
- *Infinite retries* — every refusal carries `Retry-After` / `retryAfterSeconds`,
  so clients can back off instead of hot-looping.
- *Silent failure* — a fail-open decision always sets `degraded: true`. The
  framework cannot report protection that did not run.

**Found and NOT fixed — flagged deliberately**

1. **AI routes gate on a client-supplied header.**
   `app/api/ai/buyer-assistant/route.ts` calls
   `getDemoRoleFromHeaders(request.headers)` and grants access on that basis. A
   caller sets the header themselves, so the role gate is trivially spoofable.
   Rate limiting now caps the *volume* of that abuse, but it does not fix the
   authorization defect. This should become a session-derived role check.

2. **IP-scoped limits depend on the platform overwriting `x-forwarded-for`.**
   Vercel does, which is why `x-vercel-forwarded-for` is preferred first. On any
   host that does not, an attacker rotates the header and evades every ip-scoped
   limit. Documented inline at the extraction point.

3. **User-scoped limits on anonymous callers cannot bind** (§2). Pair with an
   ip-scoped policy where anonymous access is expected.

**Out of scope, unchanged:** replay protection is idempotency-key territory and
was delivered in D12-A; this framework backstops it against retry storms rather
than replacing it.

---

## 7. Validation

| Check | Result |
| --- | --- |
| `pnpm.cmd run test:commerce` | **147 pass / 0 fail** (129 before, +18 new) |
| `pnpm.cmd run typecheck` | **EXIT 0** (`next typegen` + `tsc --noEmit --incremental false`) |
| Targeted ESLint (`lib/security`, `app/api`, all wired action dirs) | **EXIT 0** |
| `git diff --check` | clean |
| Secret scan on new code and tests | clean |

New suite `tests/rate-limit.test.cjs` (18 tests) covers: burst to the limit and
refusal past it; repeated attempts inside a window; window expiry; the
sliding-window boundary burst; per-user isolation; per-IP isolation; user+ip
pairing; anonymous-under-user-scope degradation; fail-closed fallback;
fail-open fallback; per-policy bucket separation; policy coherence across the
whole registry; the fail-closed set; key namespacing and identity hashing; IP
normalisation; the 429 body and headers; and the truthful capability string.

Determinism: the suite injects both the store and the clock, so window expiry is
proven by advancing time rather than sleeping.

**One pre-existing test-harness change was required.** Rate-limit counters are
process-wide by design, so the existing commerce suite — which calls
`createOrderIntent` many times as the same mock user — exhausted the real
`commerce.checkout` limit and two tests saw `RATE_LIMITED` where they expected
`NOT_WIRED`. Fixed by adding `resetRateLimitStore()` and a `beforeEach` that
isolates each case. This is test isolation, not a weakened guard: the limiter's
own behaviour is covered by the new suite.

---

## 8. Remaining production blockers

1. **Process-local only.** The single largest gap. Add a Redis/Upstash adapter
   implementing `RateLimitStore` and register it in `adapters/index.ts`; no call
   site changes. Until then, do not describe SKXNZ as rate-limited in any
   security or compliance statement.
2. **Login and signup are unprotected** (§5). Auth bypasses SKXNZ server code
   entirely. Requires routing credentials through a Server Action or Route
   Handler. This is the top functional blocker.
3. **AI role gate is client-spoofable** (§6.1). Authorization defect, not a
   pacing one.
4. **IP trust depends on the host** (§6.2). Verify the deployment overwrites
   forwarding headers before relying on any ip-scoped limit.
5. **No limiter observability.** Refusals are not counted or alerted, so an
   ongoing attack is invisible. `degraded: true` is returned but nothing
   aggregates it.
6. **Limits are untuned against real traffic.** Every number is a considered
   starting point, not a measured one. They need review against production
   patterns before launch.
7. **No admin bypass exists** — intentional, but worth knowing: a legitimate bulk
   admin operation exceeding 120 mutations per 5 minutes will be refused.

---

## 9. Guarantees

- Worktree created by Claude at `6532a4c`; no push, no merge, no deploy.
- No SQL executed, no migration added, no schema change.
- No secrets read, printed, or committed.
- **No unsupported protection claim.** The framework reports itself as
  process-local in code, and a test enforces that wording.
