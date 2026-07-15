# Day 6 catalog baseline recovery evidence

## Result

The canonical `supabase/migrations/0002_catalog_layer.sql` was **not authoritatively recovered**. This worktree intentionally does not add or reconstruct a `0002` migration.

## Evidence summary

- Every reachable local branch, tag, reflog entry, registered worktree, and path history was searched.
- `git log --all --name-status -- supabase/migrations/0002_catalog_layer.sql` and the catalog glob history returned no tracked file history.
- `git show` reported the file absent on `day2-live-data-clean`, `launch-war-july30`, `day3-cart-order-flow`, `main`, and representative Day-2 commits.
- `git fsck --no-reflogs --unreachable` found unreachable objects; `git fsck --no-reflogs --unreachable --name-objects` produced no `0002_catalog_layer.sql`, `0002_catalog_verify.sql`, or `catalog_layer` name match.
- One dirty checkpoint worktree on `local-polish-auth-ui` contains untracked copies of `0002_catalog_layer.sql` and its verification script. They are not tracked by Git and have no source commit, so they are evidence of a local copy only, not an authoritative canonical source. They were not copied or used.
- Historical commit `78431bf` records live verification only; its diff contains the report, not the migration.

## Commands retained for operator audit

```text
git branch -a
git tag
git worktree list
git reflog --all
git log --all --name-status -- supabase/migrations/0002_catalog_layer.sql
git log --all --name-status -- "supabase/migrations/*catalog*"
git rev-list --all --objects | Select-String -Pattern "0002|catalog|migration|supabase"
git fsck --lost-found
git fsck --no-reflogs --unreachable
git fsck --no-reflogs --unreachable --name-objects
git show <ref>:supabase/migrations/0002_catalog_layer.sql
```

## Downstream contract that must be recovered, not recreated from this note

The follow-on migration and application code require the historical baseline to provide the catalog `product_status` enum; `public.brands`, `public.categories`, `public.products`, `public.product_variants`, and `public.product_images`; catalog RLS and policies; and the columns used downstream, including product identity/slug/name/status/price/image/seller/brand/category links and variant product/price/stock/activity/size/color fields. `0005`, `0006`, `0008`, `0009`, and `0011` directly depend on `products` and/or `product_variants`.

This is a dependency inventory, not a replacement schema specification.

## Stop condition and safe recovery route

Stop before applying `0005` through `0011` to a blank disposable project until an authorized operator supplies a schema-only export or source-control backup from the known-good catalog database and verifies its checksum and object definitions. Follow `DAY6_SUPABASE_SCHEMA_EXPORT_PROCEDURE.md`; once an authoritative artifact is obtained, preserve its original migration number and provenance, review compatibility, and only then prepare a separate recovery change.
