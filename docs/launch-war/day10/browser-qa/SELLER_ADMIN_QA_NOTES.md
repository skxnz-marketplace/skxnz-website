# D10-A seller and admin QA notes

- Static page files exist for `/seller`, `/seller/orders`, `/admin`, `/admin/operations`, `/admin/orders`, `/admin/returns`, and `/admin/support`.
- Middleware source requires a session for account/orders/seller/admin paths, ADMIN for `/admin`, and SELLER or ADMIN for `/seller`. Wrong-role users are intended to return to `/?denied=role`.
- Runtime evidence is blocked: every seller/admin request returned HTTP 500 before redirect or role evaluation because Supabase public configuration was absent.
- Authenticated role behavior, read-only migration states, visible false claims, console errors, layout readability, and mobile table/card risks were not verified.
- Founder feedback says admin/dashboard surfaces feel good; D10-A records that as prior feedback, not fresh visual proof.

Once a safe configured session exists, verify BUYER denial, SELLER ownership scoping, ADMIN access, `NOT_WIRED` read-only states for unapplied atomic RPCs, and narrow-screen card/table readability. Do not trigger payment, refund, delivery, or destructive admin actions during smoke.
