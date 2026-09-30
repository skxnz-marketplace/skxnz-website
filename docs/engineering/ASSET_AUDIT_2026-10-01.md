# Asset audit — 2026-10-01 (candidates only, nothing deleted)

Scope: `public/` (292 files, 139 MB). Found by SHA-256. Resolve these in the catalogue/media data-integrity pass, checking references first (`grep -r <path> app components lib src`).

## Files with a .webp name but PNG bytes (served with the wrong type)

- `public/assets/brands/demo/chrome-district/hero.webp`
- `public/assets/brands/demo/demo-atelier/hero.webp`
- `public/assets/brands/demo/signal-studio/hero.webp`
- `public/assets/products/demo/ai-drift-co-ord-set.webp`
- `public/assets/products/demo/demo-atelier-long-coat.webp`

## Largest files

- `public/assets/home/hero-film.mp4` (14.9 MB) is used by `components/home/hero-scroll-video.tsx`.
- `public/assets/home/hero-video.mp4` (5.9 MB) is **not referenced** by app code. It is a removal candidate.

## Byte-identical groups (27)

1. `assets/demo/uploaded/editorial/fire-shirt-look.png` `assets/home/hero/wear-the-signal.png` 
2. `assets/brand/logo/skxnz-wordmark-transparent.png` `assets/brand/skxnz/logo-wordmark-transparent.png` `assets/brand/skxnz/logo-wordmark.png` 
3. `assets/brands/demo/chrome-district/logo.webp` `assets/demo/brands/chrome-lab/logo.webp` `assets/demo/products/product-03.webp` 
4. `assets/brands/demo/demo-atelier/hero.png` `assets/brands/demo/demo-atelier/hero.webp` `assets/demo/uploaded/editorial/afterlast-duo.png` `assets/home/categories/women.png` `assets/home/drops/limited-edition-drops.png` `assets/products/demo/demo-atelier-long-coat.png` `assets/products/demo/demo-atelier-long-coat.webp` `assets/products/demo/pearl-signal-crop-jacket.png` 
5. `assets/admin/demo/admin-avatar-fallback.svg` `assets/sellers/demo/seller-avatar-fallback.svg` `assets/ui/placeholders/avatar-fallback.svg` 
6. `assets/demo/brands/obsidian-wear/hero.webp` `assets/demo/brands/vanta-mode/hero.webp` `assets/demo/products/product-09.webp` `assets/products/demo/obsidian-rider-vest.webp` 
7. `assets/demo/uploaded/products/afterlast-portrait-shirt.png` `assets/home/hero/new-season-picks.png` `assets/products/demo/signal-layered-shirt.png` 
8. `assets/demo/brands/chrome-lab/hero.webp` `assets/demo/products/product-10.webp` `assets/products/demo/electric-cyan-sunglasses.webp` 
9. `assets/brands/demo/skxnz/hero.webp` `assets/demo/brands/skxnz/hero.webp` `assets/demo/products/product-07.webp` `assets/products/demo/ultraviolet-mesh-top.webp` 
10. `assets/demo/uploaded/products/skxnz-back-tee.png` `assets/home/hero/ai-styled-fits.png` 
11. `apple-touch-icon-precomposed.png` `apple-touch-icon.png` `assets/brand/icons/skxnz-app-icon-transparent.png` `assets/brand/marks/skxnz-mark-transparent.png` `assets/brand/skxnz/logo-mark-transparent.png` `assets/brand/skxnz/logo-mark.png` 
12. `assets/demo/brands/obsidian-wear/logo.webp` `assets/demo/products/product-06.webp` `assets/products/demo/midnight-cargo-pants.webp` 
13. `assets/brands/demo/chrome-district/hero.png` `assets/brands/demo/chrome-district/hero.webp` `assets/demo/uploaded/editorial/chrome-queen.png` `assets/home/categories/perfumes.png` `assets/products/demo/liquid-silver-perfume.png` 
14. `assets/brands/demo/signal-studio/logo.webp` `assets/demo/brands/noir-signal/logo.webp` `assets/demo/products/product-02.webp` 
15. `assets/brands/demo/signal-studio/hero.png` `assets/brands/demo/signal-studio/hero.webp` `assets/demo/uploaded/editorial/afterlast-smoke.png` `assets/home/categories/streetwear.png` `assets/products/demo/ai-drift-co-ord-set.png` `assets/products/demo/ai-drift-co-ord-set.webp` 
16. `assets/ai/product-video-demo/video-fallback.svg` `assets/ai/stylist/.gitkeep-hero-fallback.svg` `assets/ai/try-on-demo/try-on-fallback.svg` `assets/ui/placeholders/hero-fallback.svg` 
17. `assets/demo/uploaded/products/skxnz-graphic-tee.png` `assets/home/hero/limited-edition-drops.png` `assets/products/demo/obsidian-signal-oversized-tee.png` 
18. `assets/demo/uploaded/categories/streetwear-chain.png` `assets/home/categories/accessories.png` 
19. `assets/products/accessories/product-fallback.svg` `assets/products/demo/.gitkeep-product-fallback.svg` `assets/products/limited-edition/product-fallback.svg` `assets/products/men/product-fallback.svg` `assets/products/perfume/product-fallback.svg` `assets/products/streetwear/product-fallback.svg` `assets/products/women/product-fallback.svg` `assets/ui/placeholders/product-fallback.svg` 
20. `assets/brands/demo/skxnz/logo.webp` `assets/demo/brands/skxnz/logo.webp` `assets/demo/products/product-01.webp` `assets/products/demo/chrome-trace-hoodie.webp` 
21. `assets/demo/uploaded/editorial/monochrome-fit.png` `assets/home/categories/men.png` 
22. `assets/brands/demo/demo-atelier/logo.webp` `assets/demo/brands/pulse-atelier/logo.webp` `assets/demo/products/product-05.webp` `assets/products/demo/chrome-district-bracelet.webp` 
23. `assets/demo/brands/vanta-mode/logo.webp` `assets/demo/products/product-04.webp` `assets/products/demo/future-runner-crossbody.webp` `assets/products/demo/sonic-magenta-mini-bag.webp` 
24. `assets/brands/adidas/.gitkeep` `assets/brands/armani/.gitkeep` `assets/brands/gucci/.gitkeep` `assets/brands/lv/.gitkeep` `assets/brands/nike/.gitkeep` `assets/brands/prada/.gitkeep` `assets/ui/backgrounds/.gitkeep` `assets/ui/textures/.gitkeep` 
25. `assets/demo/categories/shoes.svg` `assets/home/categories/shoes.svg` 
26. `assets/demo/uploaded/products/afterlast-blue-tee.png` `assets/demo/uploaded/products/afterlast-studio-tee.png` 
27. `assets/demo/brands/noir-signal/hero.webp` `assets/demo/brands/pulse-atelier/hero.webp` `assets/demo/products/product-08.webp` `assets/products/demo/pearl-white-sneakers.webp` 

## Third-party imagery

- Files named `afterlast-*` (under `assets/demo/uploaded/`) are another brand's photos, reused as category, product and hero art (see groups above). The trending-image mismatch in PROGRESS.md is the same problem.
