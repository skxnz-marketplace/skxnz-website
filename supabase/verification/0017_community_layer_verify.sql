-- =============================================================
-- SKXNZ — verification for 0017_community_layer.sql
-- Read-only. Run in the Supabase SQL Editor AFTER applying 0017.
-- Compare each result to its EXPECT comment.
-- =============================================================

-- 1. All six tables exist with RLS enabled (EXPECT: 6 rows, all rls_enabled = true)
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'community_poster_grants', 'community_posts', 'community_likes',
    'community_saves', 'community_reports', 'style_boards'
  )
order by c.relname;

-- 2. Helper functions exist and are SECURITY DEFINER (EXPECT: 2 rows, both prosecdef = true)
select proname, prosecdef
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_admin', 'is_community_poster');

-- 3. Policy count per table (EXPECT: poster_grants=4, posts=7, likes=3, saves=3, reports=4, style_boards=5)
select tablename, count(*) as policy_count
from pg_policies
where schemaname = 'public'
  and tablename in (
    'community_poster_grants', 'community_posts', 'community_likes',
    'community_saves', 'community_reports', 'style_boards'
  )
group by tablename
order by tablename;

-- 4. anon grants — EXPECT: community_posts (select only) and style_boards (select
--    only); ZERO rows for the other four tables.
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'community_poster_grants', 'community_posts', 'community_likes',
    'community_saves', 'community_reports', 'style_boards'
  )
  and grantee = 'anon'
order by table_name, privilege_type;

-- 5. community_poster_grants: authenticated has SELECT only, no write verbs
--    (EXPECT: exactly 1 row — SELECT)
select privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'community_poster_grants'
  and grantee = 'authenticated';

-- 6. Force-pending trigger present on community_posts (EXPECT: 1 row)
select tgname
from pg_trigger
where tgrelid = 'public.community_posts'::regclass
  and tgname = 'community_posts_force_pending_trigger';

-- 7. Status/reason check constraints present (EXPECT: >= 1 row each table)
select conrelid::regclass as table_name, conname
from pg_constraint
where contype = 'c'
  and conrelid in (
    'public.community_posts'::regclass,
    'public.community_reports'::regclass
  )
order by table_name, conname;

-- 8. FK cascade behaviour (EXPECT: every row confdeltype = 'c', except
--    community_reports.reviewed_by -> users, which has no ON DELETE CASCADE
--    and should NOT appear here)
select conrelid::regclass as table_name, conname, confdeltype
from pg_constraint
where contype = 'f'
  and conrelid in (
    'public.community_poster_grants'::regclass,
    'public.community_posts'::regclass,
    'public.community_likes'::regclass,
    'public.community_saves'::regclass,
    'public.community_reports'::regclass,
    'public.style_boards'::regclass
  )
order by table_name, conname;

-- =============================================================
-- 9. author_display_name column present, not null, default set
--    (EXPECT: 1 row, is_nullable = 'NO')
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'community_posts'
  and column_name = 'author_display_name';

-- 10. MANUAL RLS ISOLATION (run separately with two buyer sessions + one
--    admin session):
--    a) Buyer A (no grant) inserts into community_posts -> RLS with-check
--       denies (is_community_poster() is false).
--    b) Admin inserts a row into community_poster_grants for Buyer A ->
--       succeeds. Buyer A (still no direct grant on themself via any
--       client call) can now SELECT their own grant row but still cannot
--       INSERT/DELETE into community_poster_grants.
--    c) Buyer A inserts a community_posts row -> succeeds; status comes
--       back 'pending_moderation' even if the client tried to send
--       'published' (trigger overrides it).
--    d) Buyer B selects community_posts -> does NOT see A's still-pending
--       row (only 'published' rows + B's own).
--    e) Admin updates A's post status to 'published' -> succeeds; Buyer B
--       can now select it.
--    f) Buyer B likes A's now-published post -> succeeds. Buyer B tries to
--       like a still-pending/hidden post -> with-check denies.
--    g) anon selects community_posts -> sees only 'published' rows, zero
--       grants error on community_likes/saves/reports/poster_grants.
-- =============================================================
