# SKXNZ D1 Operator Checklist

Founder-facing checklist. Only manual steps that cannot be safely automated are listed.

## No Action Needed Right Now

- Do not review code manually.
- Do not run routine developer checks.
- Do not push, merge, deploy, or apply SQL for this prep pack.
- Do not change live payment, shipping, or support settings because of this prep pack.
- Keep Claude's current worktree separate from the Codex prep worktree.

## Later Supabase Operator Steps

Only when D1-B asks:

- Confirm whether `0005_commerce_layer.sql` is applied in the intended Supabase project.
- Confirm whether `0006_fix_seller_order_item_rls.sql` is applied after `0005`.
- Run read-only verification scripts if requested:
  - `supabase/verification/0005_commerce_layer_preflight.sql`
  - `supabase/verification/0005_commerce_layer_verify.sql`
  - `supabase/verification/0005_commerce_layer_isolation.sql`
  - `supabase/verification/0008_seller_product_ownership_verify.sql`
- Confirm one real non-admin seller account exists.
- Confirm at least one real seller-owned product can be created and approved.
- Apply `0007_buyer_saved_items.sql` only when wishlist/account-sync work resumes.

## Later Razorpay Prerequisites

Do not connect Razorpay until the code task explicitly starts payment integration.

When that task starts:

- Create or confirm Razorpay test credentials.
- Keep all Razorpay secrets server-side only.
- Prepare webhook signing secret.
- Confirm the webhook URL that marks orders paid only after signature verification.
- Do not enter raw card data into SKXNZ. Saved cards must use Razorpay tokenization only.

## Later Vercel / Deployment Steps

Only after review branch is committed and you approve push/deploy:

- Confirm target branch to push.
- Confirm Vercel environment variables are present and server-only where required.
- Confirm deployment region remains Mumbai / `bom1`.
- Smoke test `/`, `/shop`, `/checkout`, `/orders`, `/account/support`, `/account/returns`, `/seller/orders`, and `/admin/orders`.

## Launch-Day Account Checks

- Buyer test account can sign up, confirm email, sign in, and see `/account`.
- Admin account has `public.users.role = ADMIN`.
- Seller account has `public.users.role = SELLER` and is not also the admin account.
- Buyer cannot open another buyer's order or support ticket.
- Seller cannot see buyer address/contact/order total data.
- Admin can see order review surfaces.
- Public `/support` and `/returns` pages are truthful and do not promise automated refunds, pickup, delivery, or payment success before those systems are live.
