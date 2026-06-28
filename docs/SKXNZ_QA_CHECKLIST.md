# SKXNZ QA Checklist

## Run after every major phase
- [ ] `npm run lint`
- [ ] `npm run typecheck` if available
- [ ] `npm run build`
- [ ] `npm test` if available

## Homepage checks
- [ ] Header is dark maroon glass across full width.
- [ ] Main background reads close to white, not yellow/cream-heavy.
- [ ] Hero is full-width and connected to header.
- [ ] Hero text does not cover the main visual.
- [ ] Hero images do not stretch, stack, or break.
- [ ] Brand pills align neatly.
- [ ] Category tiles are compact.
- [ ] Product cards are compact and equal-height.
- [ ] Quick preview is desktop-only and does not stretch product cards.
- [ ] Floating AI assistant appears once and remains working.
- [ ] No AfterLast branding or unrelated assets are visible.

## Buyer checks
- [ ] `/shop` opens.
- [ ] Product cards show images.
- [ ] Product detail opens.
- [ ] Size selector works.
- [ ] Add to cart preserves image and selected size.
- [ ] `/cart` opens and stays clearly MVP/demo where needed.
- [ ] `/wishlist`, `/orders`, `/returns`, `/account`, and `/support` open.

## Seller checks
- [ ] `/sell` opens.
- [ ] Seller application form uses admin review wording.
- [ ] `/seller` opens.
- [ ] `/seller/products` opens.
- [ ] `/seller/orders` opens.

## Admin checks
- [ ] `/admin` opens.
- [ ] `/admin/sellers` opens.
- [ ] `/admin/products` opens.
- [ ] `/admin/orders` opens.
- [ ] `/admin/returns` opens.
- [ ] `/admin/support` opens.

## Safety checks
- [ ] No fake payment claims.
- [ ] No fake delivery claims.
- [ ] No fake AI try-on claims.
- [ ] No automatic seller approval claims.
- [ ] No real refund claims.
- [ ] No copied competitor brand assets.

## Mobile checks
- [ ] 320px readable.
- [ ] 375px readable.
- [ ] 430px readable.
- [ ] 768px readable.
- [ ] No horizontal overflow.
- [ ] Buttons remain tappable.

