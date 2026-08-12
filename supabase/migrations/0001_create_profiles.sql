-- ============================================================================
-- 0001_create_profiles.sql
-- JobPilot AI — Phase 1 database foundation
--
-- Creates the `profiles` table (1:1 with auth.users), enables Row Level
-- Security, and wires up automatic profile creation on signup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  avatar_url text,
  phone text,
  location text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile data for each authenticated user. One row per auth.users record.';

-- Lookups by email (e.g. admin tooling, future search) benefit from an index.
create index if not exists profiles_email_idx on public.profiles (email);

-- ----------------------------------------------------------------------------
-- 2. updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Row Level Security
--    Users may only read, insert, and update their own profile row.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No delete policy is defined: profile rows are removed automatically via
-- the `on delete cascade` foreign key when the auth.users row is deleted.

-- ----------------------------------------------------------------------------
-- 4. Auto-create a profile row whenever a new user signs up.
--    Runs with the privileges of the function owner (SECURITY DEFINER) so it
--    can write to public.profiles regardless of the new user's RLS policies.
--    `on conflict do nothing` guards against duplicate-profile edge cases
--    (e.g. retried signups, manual re-invocation).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Never block auth signup because of a profile-creation failure.
    -- The app also lazily creates a missing profile on first dashboard load.
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Keep profiles.email in sync if a user's auth email changes.
create or replace function public.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  execute function public.handle_user_email_updated();
