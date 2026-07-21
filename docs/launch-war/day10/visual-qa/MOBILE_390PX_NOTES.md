# D10-B Mobile 390px Notes

Viewport: 390x844 (browser pane resize). Probes: `document.documentElement.scrollWidth` vs `innerWidth`, plus computed font-size scan of leaf elements in `<main>`.

| Route | Horizontal overflow | Tiny text (<10px, >10 chars) | Note |
|---|---|---|---|
| `/` | none (390/390) | ~30 elements | badges, card meta, trust-strip labels |
| `/shop` | none | ~27 elements | filter labels, brand-rail meta |
| `/product/obsidian-signal-oversized-tee` | none | not counted | layout holds; PDP stacks correctly |
| `/ai-stylist` | none | — | demo gate renders within viewport |

Takeaway: layout discipline is good — zero horizontal scroll on core buyer routes. The mobile issue is legibility, not breakage: dense sub-10px micro-copy is a deliberate compact style but sits below comfortable mobile reading size on ~30 elements per page. Recommend 10–11px floor for badge/meta text on <sm breakpoints in Day 10-C.

Not probed at 390px (desktop-verified only): `/brands`, `/cart`, `/checkout`, `/faq`, `/support`, `/returns`, `/community`.
