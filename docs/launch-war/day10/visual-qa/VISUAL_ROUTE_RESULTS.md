# D10-B Visual Route Results

Method: DOM/text inspection + SSR curl + console reads. Screenshots unavailable (browser-pane screenshot tool timed out); no screenshot paths.

| Route | Status | Verdict | Visible issue | Console red | Mobile 390 | Auth redirect |
|---|---|---|---|---|---|---|
| `/` | 200 | WARN | Fallback product cards (VANTA/AXIS/…) not in catalog; all link to `/shop`; only 2 images on page | none | no overflow; ~30 sub-10px text elements | n/a |
| `/shop` | 200 | WARN | "DEMO ATELIER" + "demo brand stack" copy; $ price filter vs ₹ prices; imageless cards (1 img SSR) | none | no overflow; ~27 tiny-text elements | n/a |
| `/brands` | 200 | PASS | h1 "Brand discovery." renders; demo-brand naming visible | none | not separately probed | n/a |
| `/cart` | 200 | PASS | Guest empty state truthful ("No live payment is connected") | none | no overflow | n/a |
| `/checkout` | 200 | PASS | 4-step draft flow, truthful payment copy; title "…| SKXNZ | SKXNZ" dup (P3) | none | no overflow | n/a |
| `/orders` | 307 | PASS | — | — | — | → `/login?next=%2Forders` correct |
| `/account` | 307 | PASS | — | — | — | → `/login?next=%2Faccount` correct |
| `/faq` | 200 | PASS | h1 "Questions, answered honestly." | none | — | n/a |
| `/support` | 200 | PASS | Title dup "| SKXNZ | SKXNZ" (P3) | none | — | n/a |
| `/returns` | 200 | PASS | Title dup (P3) | none | — | n/a |
| `/ai-stylist` | 200 | FAIL (buyer lens) | Public page shows "DEMO ACCESS REQUIRED" + role switcher; SSR h1 "Checking saved demo role." | none | no overflow | n/a |
| `/community` | 200 | PASS | "Signal Room" renders, future-truthful copy | none | — | n/a |
| `/product/obsidian-signal-oversized-tee` | 200 | PASS | Full PDP renders (price, size, stock, truthful delivery copy); 1 img only; similar-card copy "Layered premium demo shirt" | none | no overflow | n/a |
| `/seller` | 307 | PASS | — | — | — | → `/login?next=%2Fseller` correct |
| `/admin` | 307 | PASS | — | — | — | → `/login?next=%2Fadmin` correct |
| `/admin/operations` | 307 | PASS | — | — | — | → `/login?next=%2Fadmin%2Foperations` correct |

Setup note: worktree initially 500'd on every route — untracked `.env.local` absent from fresh worktree; copied from main repo (values never opened). After copy: all green.
