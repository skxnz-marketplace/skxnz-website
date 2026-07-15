# Operator next steps for catalog migration 0002

## User action is needed

Yes. Day 7-A cannot proceed until an authorized operator provides an already
authenticated Supabase CLI and a safely linked project context. Dashboard
login may be needed only if the operator must establish that context; do not
share credentials, screenshots containing secrets, project connection strings,
or access tokens here.

## Safe recovery sequence

1. Use a disposable or explicitly authorized project context, never an
   unreviewed production target.
2. Confirm the CLI is already available and linked without entering a token or
   password during the recovery session.
3. Read the installed `supabase db dump --help` output and choose its supported
   schema-only syntax. Do not guess a command.
4. Export schema definitions only. Do not export table rows, auth users,
   storage, payment records, or any data.
5. Save the result only as
   `supabase/migrations/0002_catalog_layer_RECOVERY_CANDIDATE.sql`.
6. Scan the candidate for `INSERT`, `COPY`, emails, user data, payment fields,
   tokens, connection strings, and service-role material. Do not commit it if
   any are present.
7. Compare the candidate against catalog application references and migrations
   `0005` through `0011`; document every included/removed object and mismatch.
8. Have an authorized reviewer verify provenance and exact historical content
   before any rename or promotion to canonical `0002_catalog_layer.sql`.

## Never do this on production

Do not apply migrations or SQL, alter RLS, run destructive statements, seed
data, export table data, or use production credentials in this repository.
