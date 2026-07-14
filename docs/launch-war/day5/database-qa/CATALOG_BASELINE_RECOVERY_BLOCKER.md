# Critical: canonical catalog migration 0002 not recoverable locally

Searched all local branches/tags, reflogs, registered worktrees, reachable
objects, dangling-object inventory, historical Day-2 refs, and
`day2-live-data-clean`. Historical commit `78431bf` documents live 0002
verification but does not contain the migration file. No authoritative blob
was found, so no reconstruction was attempted.

Downstream migrations require the catalog baseline to provide `public.products`
(id, slug, name, status, price_inr, image_url, seller_id, brand_id),
`public.product_variants` (product_id, price_inr, stock_quantity, is_active,
size, color), and `public.brands`. In disposable QA, an authorized operator
must export the existing catalog schema/read-only definitions from the known
source project, hash and review them, recover the exact historical migration
from backup/source control, then run catalog preflight before 0005--0011.
This remains a Critical integration blocker.
