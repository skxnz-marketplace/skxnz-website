# Critical: canonical catalog migration 0002 not recoverable locally

Day 6 repeated and expanded the local-only audit: branches/tags, reflogs,
registered worktrees, reachable path history, object inventory, unreachable
objects, historical Day-2 refs, and `day2-live-data-clean`. Historical commit
`78431bf` documents live 0002 verification but does not contain the migration
file. One unrelated dirty checkpoint worktree has an untracked local copy, but
it has no Git source commit and is not authoritative. No canonical blob was
found, so no reconstruction was attempted. See
`docs/launch-war/day6/catalog-recovery/CATALOG_BASELINE_SEARCH_EVIDENCE.md`.

Downstream migrations require the catalog baseline to provide `public.products`
(id, slug, name, status, price_inr, image_url, seller_id, brand_id),
`public.product_variants` (product_id, price_inr, stock_quantity, is_active,
size, color), and `public.brands`. In disposable QA, an authorized operator
must export the existing catalog schema/read-only definitions from the known
source project, hash and review them, recover the exact historical migration
from backup/source control, then run catalog preflight before 0005--0011.
This remains a Critical integration blocker.
