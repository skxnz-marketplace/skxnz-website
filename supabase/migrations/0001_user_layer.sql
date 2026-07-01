-- =============================================================
-- SKXNZ — Slice 1a: Core user layer
-- Tables: users, user_profiles, addresses
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Do NOT run via CLI or ORM. Do NOT modify .env.local.
-- =============================================================


-- =============================================================
-- 1. ROLE ENUM
--    Uppercase values match the Prisma UserRole enum exactly.
-- =============================================================

create type public.user_role as enum ('BUYER', 'SELLER', 'RIDER', 'ADMIN');


-- =============================================================
-- 2. TABLE: public.users
--    One row per authenticated user. id is the same UUID issued
--    by Supabase Auth (auth.users). We never store passwords here.
-- =============================================================

create table public.users (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null unique,
  name        text        not null default '',
  role        public.user_role not null default 'BUYER',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.users is
  'Public identity record that extends auth.users. One row per authenticated user.';


-- =============================================================
-- 3. TABLE: public.user_profiles
--    General profile details (avatar, phone, location, style
--    preferences, AI consent). One row per user, auto-created
--    on signup via the trigger below.
-- =============================================================

create table public.user_profiles (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null unique references public.users(id) on delete cascade,
  avatar_url       text,
  phone_number     text,
  city             text,
  state            text,
  country          text        default 'India',
  style_preference text,
  preferred_fit    text,
  budget_range     text,
  preferences_json jsonb,
  size_profile     jsonb,
  consent_for_ai   boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.user_profiles is
  'General profile info for any user role. Includes style/size prefs and DPDP AI-consent flag.';

comment on column public.user_profiles.consent_for_ai is
  'DPDP compliance: must be true before any AI feature may use this profile.';


-- =============================================================
-- 4. TABLE: public.addresses
--    Shipping / billing addresses. A user may have many;
--    is_default marks the primary one.
-- =============================================================

create table public.addresses (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references public.users(id) on delete set null,
  label        text,
  full_name    text,
  phone_number text,
  line1        text        not null,
  line2        text,
  city         text        not null,
  state        text,
  postal_code  text,
  country      text        not null default 'India',
  is_default   boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);

comment on table public.addresses is
  'Shipping and billing addresses owned by a user.';


-- =============================================================
-- 5. UPDATED_AT TRIGGER
--    Keeps updated_at current on every row update, on all three
--    tables, without any app-layer intervention.
-- =============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();


-- =============================================================
-- 6. AUTO-PROVISION TRIGGER
--    Fires after every insert on auth.users (i.e. every signup).
--    Creates the matching public.users row (default role BUYER)
--    and an empty public.user_profiles row so downstream code
--    can always assume both rows exist.
--
--    SECURITY DEFINER: runs as the function owner (postgres),
--    not as the signing-up user, so it can bypass RLS to insert.
-- =============================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    'BUYER'
  );

  insert into public.user_profiles (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


-- =============================================================
-- 7. ROW LEVEL SECURITY
-- =============================================================

alter table public.users         enable row level security;
alter table public.user_profiles enable row level security;
alter table public.addresses     enable row level security;


-- ── public.users policies ────────────────────────────────────

-- A signed-in user can only read their own row.
create policy "users: owner can select"
  on public.users
  for select
  using (auth.uid() = id);

-- Admins need to see all user rows for the admin dashboard.
-- The sub-select is safe because it reads the same table; no
-- recursion because auth.uid() short-circuits to a constant.
create policy "users: admin can select all"
  on public.users
  for select
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'ADMIN'
    )
  );

-- A user can edit their own row (e.g. update their display name).
create policy "users: owner can update"
  on public.users
  for update
  using (auth.uid() = id);


-- ── public.user_profiles policies ────────────────────────────

-- A user can read their own profile.
create policy "user_profiles: owner can select"
  on public.user_profiles
  for select
  using (auth.uid() = user_id);

-- A user can insert their own profile row. The trigger does this
-- automatically on signup, but this allows a manual upsert too.
create policy "user_profiles: owner can insert"
  on public.user_profiles
  for insert
  with check (auth.uid() = user_id);

-- A user can update their own profile (e.g. change avatar, city).
create policy "user_profiles: owner can update"
  on public.user_profiles
  for update
  using (auth.uid() = user_id);


-- ── public.addresses policies ─────────────────────────────────

-- A user can view only their own saved addresses.
create policy "addresses: owner can select"
  on public.addresses
  for select
  using (auth.uid() = user_id);

-- A user can save a new address for themselves only.
create policy "addresses: owner can insert"
  on public.addresses
  for insert
  with check (auth.uid() = user_id);

-- A user can edit their own addresses (e.g. set a new default).
create policy "addresses: owner can update"
  on public.addresses
  for update
  using (auth.uid() = user_id);

-- A user can delete their own addresses.
create policy "addresses: owner can delete"
  on public.addresses
  for delete
  using (auth.uid() = user_id);
