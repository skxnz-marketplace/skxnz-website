# Day 10-C — Buyer UI Recovery Plan (evidence-driven)

Order matters: fix what buyers hit first. No full rebuild — four surgical strikes.

## Strike 1 — Homepage tells the truth (P1 #1, #9)
Replace the fictional fallback rails (VANTA/AXIS/HALO cards) with the real 15-product live catalog: trending/new-in sections sourced from the same data as `/shop`, each card linking to its real `/product/[slug]`. If fewer products than slots, shrink sections rather than invent products. Acceptance: homepage has ≥1 `a[href^="/product"]` per rendered card; zero cards whose product is absent from `/shop`.

## Strike 2 — Product imagery or honest placeholders (P1 #2)
Best: upload/wire real product images for the 15 approved products (Supabase Storage, existing image fields). If photography isn't ready, ship one consistent premium placeholder treatment (brand-mark tile) instead of bare gradient text so cards read designed, not broken. Acceptance: every shop/home/PDP card renders an `<img>` (real or branded placeholder) with alt text.

## Strike 3 — Purge demo/internal copy from public surfaces (P1 #3, #4)
- `/ai-stylist`: replace demo-role gate with buyer-facing early-access panel (sign-in CTA, no "CONTINUE AS ADMIN", no "Checking saved demo role." h1). Keep role switcher behind an internal flag.
- `/shop` brand rail + brand descriptions: rename/re-describe "Demo Atelier"-style labels or hide `demo` brands from buyer view; drop "demo brand stack" copy. Same for PDP similar-card "demo shirt" description.
- Extend `test:commerce` truthfulness suite: assert no "demo" token in buyer-facing shop/ai-stylist rendered copy.

## Strike 4 — Polish sweep (P2/P3)
- `/shop` price filter: convert $ bands to ₹ bands matching catalog spread (e.g. Under ₹2,000 / ₹2,000–4,000 / ₹4,000–8,000 / ₹8,000+).
- Fix metadata title template double-suffix ("| SKXNZ | SKXNZ") and give core routes distinct titles.
- Raise sub-10px mobile micro-copy to ≥10px at <sm breakpoint (badges, card meta, trust strip).

## Guardrails
Reuse existing components; no new design language; keep truthful-copy tests green; validate with `test:commerce` + tsc + a repeat of this route sweep.
