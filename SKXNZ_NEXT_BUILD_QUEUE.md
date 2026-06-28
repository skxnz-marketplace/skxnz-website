# SKXNZ NEXT BUILD QUEUE

**Execution rule:** Complete in order unless a dependency forces a change.

## Phase 0 — Windows verification (complete)

### Task 0.1 — Reinstall dependencies cleanly (complete)
Owner: Setup / Master Control

- Dependencies freshly installed with `pnpm.cmd install --frozen-lockfile`.
- Required dependency build scripts approved and completed.
- No package or lockfile drift reported.

Done when:
- Install completed successfully.
- No package drift was introduced.

### Task 0.2 — Start local project (complete)
Owner: Setup / Master Control

- Next.js development server started successfully.
- Homepage rendered successfully at `http://localhost:3000`.

Done when:
- Site loaded locally.
- No blocking runtime error appeared.

### Task 0.3 — Homepage verification (complete)
Owner: Setup / Master Control

- The current visible homepage baseline was captured.

Done when:
- Homepage render is confirmed and captured.

---

## Phase 1 — Codex workspace structure

### Task 1.1 — Create remaining role-based chats
Owner: Master Control

Already created:

1. SKXNZ Master Control
2. SKXNZ Frontend & UI
3. SKXNZ Setup & Migration

Create:

4. SKXNZ Backend & APIs
5. SKXNZ Supabase & Database
6. SKXNZ Seller / Admin / Rider
7. SKXNZ Testing & Security
8. SKXNZ Deployment & Production

Rule:
- Only one chat may edit the same feature area at a time.

### Task 1.2 — Create clean setup/control-files checkpoint
Owner: Master Control

- Review Git status and the control-file scope.
- Stage only the approved setup and control files.
- Create the checkpoint after confirming the tree contains no unintended changes.

Done when:
- A clean, scoped Git checkpoint exists.

---

## Phase 2 — Visual baseline testing

### Task 2.1 — Baseline verification
Owner: Testing

Check:
- Homepage
- Header
- Hero
- Category strip
- Brand bar
- Product cards
- Product detail page
- Seller dashboard
- Mobile responsiveness

Done when:
- Blocking issues are listed with screenshots.
- Findings are handed to Frontend & UI before implementation begins.

---

## Phase 3 — Frontend stabilization

### Task 3.1 — Global density pass

Goals:
- Reduce oversized text.
- Reduce excessive vertical spacing.
- Tighten section rhythm.
- Remove unnecessary rounded surfaces and shadows.
- Preserve premium readability.

Validation:
- Desktop
- Tablet
- Mobile

### Task 3.2 — Header and navigation

Goals:
- Solid dark-maroon header.
- No glass effect.
- Clean search alignment.
- No duplicate controls.
- Compact mega menu.
- Smooth drawer behavior.
- No scroll blocking.

### Task 3.3 — Hero finalization

Goals:
- One image per slide.
- Full-width visual.
- Better height and cropping.
- Calm autoplay.
- Clean arrows and dots.
- Mobile overflow eliminated.

### Task 3.4 — Category and brand systems

Goals:
- Smaller category strip.
- Correct left/right arrows.
- Remove awkward rounded boxes.
- Fix right-edge clipping.
- Use real brand logos.
- Improve logo spacing and consistency.

### Task 3.5 — Product-grid refinement

Goals:
- 5–6 cards per row where appropriate.
- Compact cards.
- Larger useful image area.
- Brand, name, price, old price, wishlist, preview.
- No text overflow.
- Strong mobile layout.

### Task 3.6 — Homepage depth

Goals:
- Make homepage feel rich, not empty.
- Add/position uneven fitted category mosaic.
- Increase product-led content.
- Reduce unnecessary explanatory copy.
- Keep spacing seamless.

---

## Phase 4 — Core backend foundation

### Task 4.1 — Supabase architecture

Define:
- Users
- Profiles
- Roles
- Sellers
- Products
- Product variants
- Inventory
- Carts
- Wishlists
- Orders
- Order items
- Payments
- Deliveries
- Returns
- Reviews
- Support tickets

Deliverables:
- Schema
- Relationships
- Indexes
- RLS policy plan
- Migration plan

### Task 4.2 — Authentication and roles

Roles:
- Buyer
- Seller
- Rider
- Admin
- Support

Done when:
- Authentication works.
- Protected routes work.
- Role permissions are enforced server-side.

### Task 4.3 — Buyer commerce flow

Sequence:
1. Product
2. Variant/size
3. Wishlist
4. Cart
5. Address
6. Checkout
7. Payment
8. Order confirmation
9. Tracking
10. Return request

---

## Phase 5 — Marketplace operations

### Task 5.1 — Seller system
- Seller application
- Approval
- Product upload
- Inventory
- Orders
- Payouts
- Analytics

### Task 5.2 — Rider system
- Assignment
- Pickup
- Navigation handoff
- Delivery status
- Proof of delivery
- Failed delivery workflow

### Task 5.3 — Admin system
- User management
- Seller approval
- Product moderation
- Order control
- Refunds
- Support
- Platform analytics

---

## Phase 6 — AI features

Implement only after core flows are stable:

1. AI stylist
2. Budget-aware recommendations
3. Outfit builder
4. Try-on
5. Seller listing assistant
6. Product video generation
7. Delivery helper
8. Restricted support chatbot

Rule:
- AI must enhance real marketplace workflows, not replace missing backend logic.

---

## Phase 7 — Production readiness

- Automated tests
- Permission testing
- Security review
- Payment compliance review
- Performance optimization
- Image optimization
- Error monitoring
- Backups
- Rate limits
- Deployment checklist
- Rollback plan
- Final Vercel production validation
