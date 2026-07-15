# Supabase catalog recovery blocked

## Safe commands attempted

```text
supabase --version
npx supabase --version
npx --no-install supabase --version
```

## Redacted result

PowerShell reported that `supabase` is not recognized as a command. A follow-up
`Get-Command supabase` / `where.exe supabase` check found no CLI on PATH.
`supabase/config.toml` is also absent from this worktree.

After the project was resumed, the requested `npx supabase` command group
timed out after 124 seconds without producing a result or authentication
prompt. A follow-up `npx --no-install supabase --version` timed out after 34
seconds, also with no output. This does not prove authentication or linking;
it only proves that the available npx path cannot currently provide a usable
CLI result in this environment.

## Why the recovery stopped

Without a usable installed or npx-resolved Supabase CLI, this worktree cannot
establish whether an existing authenticated and linked local CLI state is
available. Installing a CLI, logging in, supplying an access token, entering
an OTP, adding a project link, or using a database connection string would
exceed this task's safe boundary. No dump command was attempted.

## Required manual operator action

An authorized operator must make the already-approved Supabase CLI available
on PATH and confirm an existing authenticated, linked **non-production or
explicitly authorized** project context. Do not place credentials, tokens,
database URLs, or passwords in this repository or chat.

## Exact next safe step

In a new session after the CLI is available, run only `supabase --version`,
then inspect `supabase status`, `supabase projects list`, and `supabase db dump
--help` with sensitive output suppressed. Stop again if any command asks for
login, OTP, token, password, browser authentication, or manual credential
entry. Only an already-authenticated and safely linked CLI may make a
schema-only candidate export.

No secrets were printed, no SQL was applied, and no production data was read
or dumped.
