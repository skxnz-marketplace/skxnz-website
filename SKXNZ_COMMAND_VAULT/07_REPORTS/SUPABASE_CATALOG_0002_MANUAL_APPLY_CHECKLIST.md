# SKXNZ Supabase Catalog 0002 Manual Apply Checklist - 3 July 2026

## Purpose

Prepare safe manual Supabase SQL Editor apply for catalog `0002`.

This file is preparation only.

Live Supabase apply has not happened yet. Catalog `0002` is not live yet.

Use this checklist before a first-time manual apply of:

- `supabase/migrations/0002_catalog_layer.sql`
- `supabase/seeds/0002_catalog_seed.sql`
- `supabase/verification/0002_catalog_verify.sql`

Reference report:

- `SKXNZ_COMMAND_VAULT/07_REPORTS/SUPABASE_FOUNDATION_SPRINT_6A_REPORT.md`

## 1. Pre-Apply Git Checks

Run these locally before opening Supabase:

```powershell
git status --short
git log --oneline -5
```

Confirm these are true:

- Sprint 6A security commit exists:
  - `security(auth): add server-side route role protection`
- Sprint 6A report commit exists:
  - `docs: add supabase foundation sprint 6a report`
- No `.env` files or secrets are staged.
- No `package.json` or `pnpm-lock.yaml` changes are staged accidentally.
- No homepage, UI, or ReactBits files are staged accidentally.
- `supabase/migrations/0002_catalog_layer.sql` is still waiting for manual Supabase apply unless this exact apply session is starting.

If anything looks wrong, stop before touching Supabase.

## 2. Supabase Project Checks

Before running any SQL:

- Confirm you are inside the correct SKXNZ Supabase project.
- Open the Supabase SQL Editor.
- Do not paste secrets, API keys, service role keys, passwords, or `.env` values.
- Keep each SQL file as a separate SQL Editor run.
- Take a screenshot after each successful run:
  - migration success
  - seed success
  - verification success

## 3. Exact Manual Apply Order

Run in this exact order:

1. `supabase/migrations/0002_catalog_layer.sql`
2. `supabase/seeds/0002_catalog_seed.sql`
3. `supabase/verification/0002_catalog_verify.sql`

Do not run the seed before the migration.

Do not run the verification before the seed.

Do not run `0002` twice unless a technical person has reviewed the current database state and confirmed it is safe.

## 4. Expected Verification Result

The verification output should confirm:

- Catalog tables exist.
- RLS is enabled on catalog tables.
- Policies exist.
- Expected counts from Step 4:
  - brands: `11`
  - categories: `6`
  - products: `6`
  - variants: `8`
  - images: `6`

If any count is different, stop and do not continue with frontend wiring.

## 5. Stop Conditions

Stop immediately if you see any of these:

- `public.users` missing
- `set_updated_at()` missing
- relation already exists
- type already exists
- policy already exists
- permission denied
- seed foreign key error
- verification count mismatch
- any destructive SQL warning

Do not try random fixes in Supabase.

Do not rerun files blindly.

Take a screenshot and ask for help with the exact error message.

## 6. What Not To Run

Do not run:

- `drop table`
- `drop schema`
- `truncate`
- `delete from`
- rerun `0001` blindly
- rerun `0002` twice
- seed before migration

If the SQL Editor shows destructive commands or a warning that data may be removed, stop.

## 7. Failure Handling

### If `public.users` is missing

Stop.

This means the user/auth foundation may not be present in the live Supabase project. Do not run catalog `0002` yet.

Action:

1. Screenshot the error.
2. Confirm whether `0001_user_layer.sql` was applied to this exact Supabase project.
3. Do not rerun `0001` blindly.

### If `set_updated_at()` is missing

Stop.

This means the shared timestamp trigger helper expected by catalog `0002` is not available.

Action:

1. Screenshot the error.
2. Confirm which earlier migration should have created `set_updated_at()`.
3. Do not edit `0002` inside the SQL Editor as a quick fix.

### If `already exists` appears

Stop.

This could mean `0002` was already applied, partly applied, or manually edited earlier.

Action:

1. Screenshot the full error.
2. Do not rerun the whole file.
3. Ask for a database state review before continuing.

### If the seed fails

Stop.

The migration may not have completed, or a foreign key target may be missing.

Action:

1. Screenshot the seed error.
2. Do not rerun the seed repeatedly.
3. Do not delete rows manually.
4. Run no further SQL until the migration state is reviewed.

### If verification fails

Stop.

Verification failure means catalog `0002` should not be treated as ready.

Action:

1. Screenshot the verification output.
2. Compare the counts against the expected Step 4 counts.
3. Do not wire the homepage or shop UI to catalog tables yet.
4. Ask for review with the migration, seed, and verification screenshots.

## 8. Final Status Wording

Use this wording before live apply:

> WAIT: Checklist prepared. Live Supabase untouched.

Use this wording only after successful live apply later:

> Catalog 0002 applied live. Migration, seed, and verification succeeded.

Do not say catalog is live until the migration, seed, and verification have all succeeded in the real SKXNZ Supabase project.
