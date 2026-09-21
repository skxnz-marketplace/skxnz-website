-- =============================================================
-- SKXNZ — Slice 17: SKXNZ Community (Signal Community) layer
-- Tables: community_poster_grants, community_posts, community_likes,
--         community_saves, community_reports, style_boards
--
-- APPLIED to the live `skxnz` Supabase project (hhsorrkvgvxxpwzrggei) on
-- 2026-09-21 via the Supabase MCP (apply_migration), across three
-- statements folded into this one file: the base schema, a search_path
-- fix on community_posts_force_pending, and perf fixes (missing FK
-- indexes + wrapping auth.uid()/is_admin()/is_community_poster() in
-- `(select ...)` per Supabase's RLS performance guide, both flagged by
-- get_advisors after the base migration). Safe to re-run (idempotent) —
-- kept in supabase/migrations/ as the source of truth for any other
-- environment.
--
-- Scope for v1 (founder-confirmed):
--   - Posting is invite-only: an admin grants posting rights per user via
--     community_poster_grants. No automatic "N completed orders" gate yet
--     (checkout isn't live) — that can be layered on top of this table
--     later without a schema change.
--   - No real photo upload in v1: posts tag existing catalog products only
--     (tagged_product_ids), no user-supplied image column. Add one later
--     (Supabase Storage + RLS) without touching this migration.
--   - Style Boards (admin-curated collections) ARE in v1.
--   - Replaces the browser-localStorage demo in lib/data/community.ts —
--     see PROGRESS.md for the wiring plan.
--
-- Depends on: 0001_user_layer.sql (public.users, set_updated_at),
--             0002_catalog_layer.sql (public.products, for tagged_product_ids),
--             0003_fix_admin_rls_helper.sql (public.is_admin()).
-- =============================================================


-- =============================================================
-- 1. TABLE: public.community_poster_grants
--    Invite-only posting rights. Deliberately its OWN table, not a column
--    on public.users/public.user_profiles: both of those already have an
--    "owner can update" RLS policy with no column-level restriction, so a
--    flag living there could be self-granted by any buyer through a normal
--    profile update. A dedicated table with NO owner-write policy at all
--    (admin-only insert/delete, see section 8) closes that off entirely.
--    Existence of a row = that user may post. No status/boolean column
--    needed; revoke = delete the row.
-- =============================================================

create table if not exists public.community_poster_grants (
  user_id    uuid        primary key references public.users(id) on delete cascade,
  granted_by uuid        not null references public.users(id),
  granted_at timestamptz not null default now()
);

comment on table public.community_poster_grants is
  'Invite-only Signal Community posting rights. Row exists = user may create posts. Admin-only write (see RLS); a user may only read whether THEY have a grant.';

create index if not exists community_poster_grants_granted_by_idx on public.community_poster_grants (granted_by);


-- =============================================================
-- 2. HELPER: public.is_community_poster()
--    Mirrors public.is_admin() (0003): SECURITY DEFINER so it can be
--    called from the community_posts INSERT policy without that policy
--    having to grant the caller read access to community_poster_grants
--    rows it doesn't own.
-- =============================================================

create or replace function public.is_community_poster()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.community_poster_grants
    where user_id = auth.uid()
  );
$$;

comment on function public.is_community_poster() is
  'True iff the current authenticated user has an invite-only Signal Community posting grant.';


-- =============================================================
-- 3. TABLE: public.community_posts
--    One row per fit/style post. tagged_product_ids is a loose uuid[]
--    (no FK) on purpose, same philosophy as public.saved_items (0007):
--    a post should keep rendering even if a tagged product is later
--    archived/removed, not break or cascade-delete.
-- =============================================================

create table if not exists public.community_posts (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.users(id) on delete cascade,
  caption             text        not null default '',
  style_tags          text[]      not null default '{}',
  tagged_product_ids  uuid[]      not null default '{}',
  status              text        not null default 'pending_moderation'
                                   check (status in ('pending_moderation', 'published', 'hidden', 'removed')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.community_posts is
  'Signal Community fit/style posts. status is server-forced to pending_moderation on insert (see trigger below) — never trust the client on moderation state.';

create index if not exists community_posts_user_id_idx on public.community_posts (user_id);
create index if not exists community_posts_status_idx on public.community_posts (status);

-- Force every new post to pending_moderation regardless of what the client
-- sends. Defense in depth alongside the RLS insert policy — matches the
-- server-authoritative principle CLAUDE.md already requires for payments.
-- search_path pinned (same reason as public.is_admin() in 0003): prevents
-- search-path hijacking of the unqualified `new` reference.
create or replace function public.community_posts_force_pending()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.status = 'pending_moderation';
  return new;
end;
$$;

drop trigger if exists community_posts_force_pending_trigger on public.community_posts;
create trigger community_posts_force_pending_trigger
  before insert on public.community_posts
  for each row execute function public.community_posts_force_pending();

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();


-- =============================================================
-- 4. TABLES: public.community_likes, public.community_saves
--    Identical shape, same pattern as public.saved_items (0007): pure
--    ownership join rows, no snapshot needed. No like/save COUNT column —
--    the current UI only shows the current user's own like/save state,
--    never an aggregate count (see components/community/community-post-card.tsx).
-- =============================================================

create table if not exists public.community_likes (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.community_posts(id) on delete cascade,
  user_id    uuid        not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.community_saves (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.community_posts(id) on delete cascade,
  user_id    uuid        not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists community_likes_post_id_idx on public.community_likes (post_id);
create index if not exists community_likes_user_id_idx on public.community_likes (user_id);
create index if not exists community_saves_post_id_idx on public.community_saves (post_id);
create index if not exists community_saves_user_id_idx on public.community_saves (user_id);


-- =============================================================
-- 5. TABLE: public.community_reports
--    reason values match lib/types/community.ts CommunityReportReason
--    exactly, so the frontend needs no translation layer.
-- =============================================================

create table if not exists public.community_reports (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.community_posts(id) on delete cascade,
  reporter_id uuid        not null references public.users(id) on delete cascade,
  reason      text        not null
                           check (reason in (
                             'Spam',
                             'Inappropriate content',
                             'Fake product claim',
                             'Harassment',
                             'Copyright concern',
                             'Other'
                           )),
  note        text        not null default '',
  status      text        not null default 'open'
                           check (status in ('open', 'dismissed', 'resolved')),
  reviewed_by uuid        references public.users(id),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

comment on table public.community_reports is
  'Buyer reports against a community post. status starts open; admin moderation (Hide/Dismiss/Delete in the admin UI) resolves it and, for Hide/Delete, also updates the target community_posts.status.';

create index if not exists community_reports_post_id_idx on public.community_reports (post_id);
create index if not exists community_reports_status_idx on public.community_reports (status);
create index if not exists community_reports_reporter_id_idx on public.community_reports (reporter_id);
create index if not exists community_reports_reviewed_by_idx on public.community_reports (reviewed_by);


-- =============================================================
-- 6. TABLE: public.style_boards
--    Admin-curated editorial collections. product_ids is a loose uuid[],
--    same non-FK rationale as community_posts.tagged_product_ids.
-- =============================================================

create table if not exists public.style_boards (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null unique,
  title        text        not null,
  description  text,
  image_url    text,
  tags         text[]      not null default '{}',
  product_ids  uuid[]      not null default '{}',
  is_published boolean     not null default false,
  created_by   uuid        references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.style_boards is
  'Admin-curated Signal Community style boards. Publicly readable only when is_published = true.';

create index if not exists style_boards_created_by_idx on public.style_boards (created_by);

drop trigger if exists style_boards_set_updated_at on public.style_boards;
create trigger style_boards_set_updated_at
  before update on public.style_boards
  for each row execute function public.set_updated_at();


-- =============================================================
-- 7. GRANTS
--    Supabase grants ALL on new public tables to anon + authenticated by
--    default (same note as 0007). Revoke everything first, then grant
--    only the minimal verb surface; RLS (section 8) is the real boundary.
-- =============================================================

revoke all on public.community_poster_grants from anon, authenticated;
grant select on public.community_poster_grants to authenticated;
-- No insert/update/delete grant to authenticated at all: grants are
-- admin-only and admins write through the service role / an admin RPC,
-- never through a client-held anon/authenticated grant.

revoke all on public.community_posts from anon, authenticated;
grant select on public.community_posts to anon, authenticated;
grant insert, update, delete on public.community_posts to authenticated;

revoke all on public.community_likes from anon, authenticated;
grant select, insert, delete on public.community_likes to authenticated;

revoke all on public.community_saves from anon, authenticated;
grant select, insert, delete on public.community_saves to authenticated;

revoke all on public.community_reports from anon, authenticated;
grant select, insert, update on public.community_reports to authenticated;

revoke all on public.style_boards from anon, authenticated;
grant select on public.style_boards to anon, authenticated;
grant insert, update, delete on public.style_boards to authenticated;


-- =============================================================
-- 8. ROW LEVEL SECURITY
--    auth.uid() / public.is_admin() / public.is_community_poster() are all
--    wrapped in `(select ...)` in every policy below. Supabase's planner
--    then evaluates them once per query (a stable initplan) instead of
--    once per row — same result, flagged by get_advisors otherwise.
--    https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =============================================================

alter table public.community_poster_grants enable row level security;
alter table public.community_posts          enable row level security;
alter table public.community_likes           enable row level security;
alter table public.community_saves           enable row level security;
alter table public.community_reports         enable row level security;
alter table public.style_boards              enable row level security;


-- ── public.community_poster_grants policies ──────────────────
-- A user may see only whether THEY hold a grant, never anyone else's.
drop policy if exists "community_poster_grants: owner can select" on public.community_poster_grants;
create policy "community_poster_grants: owner can select"
  on public.community_poster_grants
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "community_poster_grants: admin can select all" on public.community_poster_grants;
create policy "community_poster_grants: admin can select all"
  on public.community_poster_grants
  for select
  using ((select public.is_admin()));

-- Only admin can grant or revoke posting rights. No owner-insert policy
-- exists at all, so a buyer can never self-grant.
drop policy if exists "community_poster_grants: admin can insert" on public.community_poster_grants;
create policy "community_poster_grants: admin can insert"
  on public.community_poster_grants
  for insert
  with check ((select public.is_admin()));

drop policy if exists "community_poster_grants: admin can delete" on public.community_poster_grants;
create policy "community_poster_grants: admin can delete"
  on public.community_poster_grants
  for delete
  using ((select public.is_admin()));


-- ── public.community_posts policies ──────────────────────────
-- Anyone (including anon) can read published posts.
drop policy if exists "community_posts: anyone can select published" on public.community_posts;
create policy "community_posts: anyone can select published"
  on public.community_posts
  for select
  using (status = 'published');

-- An author can always see their own post regardless of moderation state.
drop policy if exists "community_posts: owner can select own" on public.community_posts;
create policy "community_posts: owner can select own"
  on public.community_posts
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "community_posts: admin can select all" on public.community_posts;
create policy "community_posts: admin can select all"
  on public.community_posts
  for select
  using ((select public.is_admin()));

-- Only an invited poster may create a post, and only for themselves.
-- (status is additionally force-set by the trigger above — belt and braces.)
drop policy if exists "community_posts: eligible poster can insert" on public.community_posts;
create policy "community_posts: eligible poster can insert"
  on public.community_posts
  for insert
  with check ((select auth.uid()) = user_id and (select public.is_community_poster()));

-- Only admin may change a post's moderation status (publish/hide).
-- No owner-update policy in v1 — an author retracts by deleting, not editing.
drop policy if exists "community_posts: admin can update" on public.community_posts;
create policy "community_posts: admin can update"
  on public.community_posts
  for update
  using ((select public.is_admin()));

-- An author can delete (retract) their own post at any moderation stage.
drop policy if exists "community_posts: owner can delete" on public.community_posts;
create policy "community_posts: owner can delete"
  on public.community_posts
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "community_posts: admin can delete" on public.community_posts;
create policy "community_posts: admin can delete"
  on public.community_posts
  for delete
  using ((select public.is_admin()));


-- ── public.community_likes / community_saves policies ────────
-- A signed-in user can like/save only a PUBLISHED post, and only as
-- themselves — never on another user's behalf, never on hidden/removed
-- or still-pending content.
drop policy if exists "community_likes: owner can select" on public.community_likes;
create policy "community_likes: owner can select"
  on public.community_likes
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "community_likes: owner can insert" on public.community_likes;
create policy "community_likes: owner can insert"
  on public.community_likes
  for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.status = 'published'
    )
  );

drop policy if exists "community_likes: owner can delete" on public.community_likes;
create policy "community_likes: owner can delete"
  on public.community_likes
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "community_saves: owner can select" on public.community_saves;
create policy "community_saves: owner can select"
  on public.community_saves
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "community_saves: owner can insert" on public.community_saves;
create policy "community_saves: owner can insert"
  on public.community_saves
  for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.status = 'published'
    )
  );

drop policy if exists "community_saves: owner can delete" on public.community_saves;
create policy "community_saves: owner can delete"
  on public.community_saves
  for delete
  using ((select auth.uid()) = user_id);


-- ── public.community_reports policies ─────────────────────────
-- A user can see their own submitted reports; admin sees all (moderation
-- queue). No one but admin can see who reported what beyond their own.
drop policy if exists "community_reports: reporter can select own" on public.community_reports;
create policy "community_reports: reporter can select own"
  on public.community_reports
  for select
  using ((select auth.uid()) = reporter_id);

drop policy if exists "community_reports: admin can select all" on public.community_reports;
create policy "community_reports: admin can select all"
  on public.community_reports
  for select
  using ((select public.is_admin()));

-- Any signed-in user can report any post that exists, as themselves only.
drop policy if exists "community_reports: reporter can insert" on public.community_reports;
create policy "community_reports: reporter can insert"
  on public.community_reports
  for insert
  with check ((select auth.uid()) = reporter_id);

-- Only admin resolves reports (Dismiss / Hide / Delete in the admin UI).
drop policy if exists "community_reports: admin can update" on public.community_reports;
create policy "community_reports: admin can update"
  on public.community_reports
  for update
  using ((select public.is_admin()));


-- ── public.style_boards policies ──────────────────────────────
-- Anyone (including anon) can read a published board.
drop policy if exists "style_boards: anyone can select published" on public.style_boards;
create policy "style_boards: anyone can select published"
  on public.style_boards
  for select
  using (is_published = true);

drop policy if exists "style_boards: admin can select all" on public.style_boards;
create policy "style_boards: admin can select all"
  on public.style_boards
  for select
  using ((select public.is_admin()));

-- Only admin authors style boards.
drop policy if exists "style_boards: admin can insert" on public.style_boards;
create policy "style_boards: admin can insert"
  on public.style_boards
  for insert
  with check ((select public.is_admin()));

drop policy if exists "style_boards: admin can update" on public.style_boards;
create policy "style_boards: admin can update"
  on public.style_boards
  for update
  using ((select public.is_admin()));

drop policy if exists "style_boards: admin can delete" on public.style_boards;
create policy "style_boards: admin can delete"
  on public.style_boards
  for delete
  using ((select public.is_admin()));

-- =============================================================
-- Intentionally NOT added this slice:
--   - Any image-upload column/bucket (v1 posts tag catalog products only).
--   - Any "N completed orders" automatic posting gate (checkout isn't
--     live; community_poster_grants is a deliberately separate mechanism
--     so that gate can be added later as ANOTHER way to populate grants,
--     without a schema change).
--   - Any like/save COUNT column — the current UI never shows one.
--   - Any service_role logic, any broad/default grants left in place.
--
-- Accepted (pre-existing repo pattern, not fixed here):
--   - get_advisors flags "multiple permissive policies" on several of
--     these tables (e.g. community_posts has both an "owner can select
--     own" and an "admin can select all" policy for the same SELECT
--     action). This is the same shape public.saved_items (0007) already
--     uses throughout the schema — separate, readable, independently
--     auditable policies rather than one large OR'd condition. Left as-is
--     for consistency; revisit only if it becomes a measured bottleneck.
-- =============================================================
