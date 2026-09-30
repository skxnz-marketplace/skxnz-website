# SKXNZ Private Beta Deployment Checklist

Status: Private beta prep. Not public launch approval.

## Pre-Deployment Checks

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes if available.
- [ ] `npm run build` passes.
- [ ] `npm test` passes if available.
- [ ] No private secrets are committed.
- [ ] `.env.example` contains placeholders only.
- [ ] Deployment provider secrets are configured outside git.
- [ ] Rollback checkpoint exists before deployment.

## Deployment Audit

- [ ] Framework confirmed as Next.js App Router.
- [ ] Package manager confirmed from `package.json`.
- [ ] Build command confirmed.
- [ ] Start command confirmed.
- [ ] No required Vercel/Netlify config is missing for the chosen provider.
- [ ] No hardcoded localhost URL is required for deployed runtime.
- [ ] Image and asset references use repo assets or safe fallbacks.
- [ ] Route generation completes during build.

## Beta-Safe Product And Buyer Checks

- [ ] Homepage loads.
- [ ] Search works.
- [ ] Category browsing works.
- [ ] Brand browsing works.
- [ ] Product pages open.
- [ ] Cart works with local/demo persistence.
- [ ] Demo checkout is clearly marked.
- [ ] Success page says internal/demo order, not real confirmed order.
- [ ] Wishlist is marked local/demo where needed.

## Seller, Admin, And Community Checks

- [ ] Seller application says internal review.
- [ ] Seller dashboard says beta/demo.
- [ ] Seller product uploads do not auto-publish publicly.
- [ ] Admin routes show internal/admin beta warning.
- [ ] Admin route production role-based access is listed as required before
  public launch.
- [ ] Signal Community is marked beta/demo.
- [ ] Community uploads are not presented as public live uploads.

## AI And Trust Checks

- [ ] AI assistant is beta-safe.
- [ ] AI recommendations use current SKXNZ catalog data only.
- [ ] No AI try-on live claim appears.
- [ ] No AI product video generator live claim appears.
- [ ] Legal pages remain draft for review.
- [ ] Authenticity page does not claim guaranteed authenticity.
- [ ] Seller pages do not claim verified sellers unless verification exists.
- [ ] Shipping page does not promise same-day delivery.
- [ ] Returns page does not promise free returns.

## Mobile Checks

- [ ] 320px width checked.
- [ ] 375px width checked.
- [ ] 390px width checked.
- [ ] 430px width checked.
- [ ] 768px width checked.
- [ ] No horizontal overflow on core buyer routes.
- [ ] AI assistant does not block critical checkout or nav controls.

## Release Control

- [ ] Do not connect the public `skxnz.com` domain until owner approval.
- [ ] Do not send public marketing traffic to this build.
- [ ] Keep beta invite distribution private.
- [ ] Keep rollback instructions and latest checkpoint available.
