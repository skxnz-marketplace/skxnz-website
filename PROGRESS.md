# SKXNZ - Progress Tracker

Single source of truth for project status. Read this before starting work and update it before finishing.

## Current state
- Frontend exists locally in the checkpoint repo.
- Current branch: `local-polish-auth-ui`.
- Supabase Auth Slice 1b is working locally.
- Signup, email confirmation, login, and redirect are verified.
- Supabase creates `auth.users`, `public.users`, and `public.user_profiles`.
- User role saves as `BUYER`.
- Signup now sends `name` metadata so `public.users.name` can be populated by the existing trigger.
- No push, deploy, Vercel change, or live update has happened.

## Done
- Built the local frontend foundation.
- Added Supabase auth layer.
- Ran/applied `0001_user_layer.sql` locally.
- Verified auth end to end: signup, email confirmation, login, redirect, user/profile rows, and `BUYER` role.
- Cleaned login/signup auth copy for real local Supabase auth.
- Added signup name metadata: `{ name: "<entered name>" }`.

## Next up
1. Update `CLAUDE.md`.
2. Start Product/catalog DB Slice 2A locally.
3. No commit, push, or deploy without user approval.
