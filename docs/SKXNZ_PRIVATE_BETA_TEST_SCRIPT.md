# SKXNZ Private Beta Test Script

Status: Internal testing script for private beta.

## Tester Setup

1. Open the private beta URL.
2. Confirm the site is labeled beta/demo where expected.
3. Test on desktop and at mobile widths around 320px, 375px, 390px, 430px, and
   768px.
4. Report screenshots for broken layout, dead buttons, unsafe claims, or console
   errors.

## 1. Buyer Browsing

- Open `/`.
- Confirm the header, search, hero, category row, product grid, AI assistant,
  and footer render.
- Confirm the opening loader appears once per browser session and does not block
  clicks after it fades.

## 2. Search

- Search for `streetwear`.
- Search for `jacket`.
- Search for a term that should not match.
- Confirm results use existing catalog data and show a clear empty state.

## 3. Category Browsing

- Open `/categories/men`.
- Open `/categories/women`.
- Open `/categories/streetwear`.
- Open `/categories/accessories`.
- Open `/categories/perfume`.
- Open `/categories/new-season`.
- Open `/categories/ai-styled`.
- Open `/categories/limited-edition`.
- Confirm filters/sort do not break product cards.

## 4. Brand Browsing

- Open `/brands`.
- Search/filter brands if controls are visible.
- Open at least one brand detail page.
- Confirm brand pages do not claim official partnership unless verified.

## 5. Product Page

- Open a product from the homepage or search.
- Select a size and color.
- Use the image gallery.
- Open a similar product.
- Confirm AI styling copy says preview/beta and does not claim guaranteed fit.

## 6. Cart

- Add a product to cart.
- Open `/cart`.
- Increase and decrease quantity.
- Remove the product.
- Test the empty cart state.

## 7. Demo Checkout

- Add a product to cart again.
- Open `/checkout`.
- Confirm checkout is labeled demo/internal.
- Fill shipping fields with test data only.
- Select a demo payment method.
- Review the order.
- Complete the demo flow and open `/checkout/success`.
- Confirm success copy does not claim a real paid order.

## 8. Account And Wishlist

- Open `/login` and `/signup`.
- Confirm pages are beta-safe placeholders if real auth is not connected.
- Open `/account`.
- Open `/account/profile`.
- Save a product to wishlist.
- Open `/account/wishlist`.
- Remove a saved product.

## 9. Addresses And Orders

- Open `/account/addresses`.
- Add, edit, remove, and set a default demo address.
- Open `/account/orders`.
- Confirm orders are demo/internal if real backend is not connected.

## 10. Seller Application

- Open `/sell` or `/seller/apply`.
- Try submitting Step 1 empty and confirm validation.
- Complete the multi-step application with demo data.
- Confirm success says application received for internal review.
- Confirm upload fields are placeholder/beta only.

## 11. Seller Dashboard

- Open `/seller`.
- Open `/seller/dashboard`.
- Open `/seller/products`.
- Test demo product upload.
- Open `/seller/orders`.
- Open `/seller/analytics`.
- Open `/seller/tools`.
- Confirm no fake payouts, approvals, verified status, or real AI generation
  claims appear.

## 12. Signal Community

- Open `/community`.
- Like and save a demo post.
- Open Create Post modal.
- Select tagged products from the catalog.
- Submit a demo post or verify the safe placeholder success state.
- Open Report modal and submit a demo report.
- Confirm public upload/moderation copy remains beta-safe.

## 13. Admin Back Office

- Open `/admin`.
- Confirm internal/admin beta warning appears.
- Open `/admin/products`.
- Open `/admin/sellers`.
- Open `/admin/orders`.
- Open `/admin/users`.
- Open `/admin/community`.
- Open `/admin/support`.
- Open `/admin/content`.
- Open `/admin/analytics`.
- Confirm demo approve/reject/hide actions do not claim production effects.

## 14. AI Assistant

- Open the floating assistant.
- Ask `Show me black streetwear under 5000`.
- Ask `Show limited edition products`.
- Ask an unrelated general knowledge question.
- Confirm product recommendations are catalog-only.
- Confirm blocked questions return the SKXNZ-only response.

## 15. Legal And Support Pages

- Open `/about`.
- Open `/contact`.
- Open `/support`.
- Open `/faq`.
- Open `/terms`.
- Open `/privacy`.
- Open `/returns`.
- Open `/shipping`.
- Open `/authenticity`.
- Open `/seller-terms`.
- Open `/community-guidelines`.
- Confirm pages are draft/beta-safe and avoid unsupported claims.

## 16. Mobile Testing

- Test homepage, search, product page, cart, checkout, account, seller,
  community, and admin at the target widths.
- Confirm no horizontal overflow.
- Confirm modals scroll within the viewport.
- Confirm AI assistant does not cover key checkout or nav actions.
