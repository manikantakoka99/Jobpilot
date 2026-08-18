-- ============================================================================
-- 0005_jobs_applications.sql
-- JobPilot AI — Phase 4: Job Discovery + Application Tracker
--
-- Creates the `jobs` and `applications` tables and their Row Level Security
-- policies. `jobs` holds jobs a user has saved for later; `applications`
-- holds the actual tracked application record a user creates (optionally
-- starting from a saved job, optionally linked to a resume / resume version
-- / cover letter generated in earlier phases).
--
-- This migration is purely additive — it does not modify 0001–0004. Safe to
-- re-run: every statement uses `if not exists` / `drop ... if exists` before
-- create, matching the pattern used in prior migrations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. jobs
-- ----------------------------------------------------------------------------
-- One row per job a user has saved. Deliberately holds its own copy of the
-- job's text (title/company/description/etc.) rather than pointing at any
-- external source — jobs are saved by the user (pasted or typed in), never
-- scraped from a job board on their behalf.
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  company text not null,
  url text,
  location text,
  description text,
  salary text,
  source text not null default 'manual',
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.jobs is
  'Jobs a user has manually saved for later — analysis, resume optimization, and application tracking all key off a saved job or the application it becomes.';

create index if not exists jobs_user_id_saved_at_idx
  on public.jobs (user_id, saved_at desc);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row
  execute function public.set_updated_at();

alter table public.jobs enable row level security;

drop policy if exists "Jobs are selectable by owner" on public.jobs;
create policy "Jobs are selectable by owner"
  on public.jobs for select
  using (auth.uid() = user_id);

drop policy if exists "Jobs are insertable by owner" on public.jobs;
create policy "Jobs are insertable by owner"
  on public.jobs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Jobs are updatable by owner" on public.jobs;
create policy "Jobs are updatable by owner"
  on public.jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Jobs are deletable by owner" on public.jobs;
create policy "Jobs are deletable by owner"
  on public.jobs for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. applications
-- ----------------------------------------------------------------------------
-- One row per tracked application. `job_title`/`company`/`job_url`/etc. are
-- a snapshot copied at creation time (from a saved job, or typed directly)
-- rather than a live join — editing or deleting the source job later must
-- never silently change what an application says it was applied to.
--
-- `job_id` is an optional traceability link back to the saved job an
-- application was started from (nullable, `on delete set null` — deleting a
-- saved job never deletes the application). Not part of the original field
-- list in the phase spec; added so "mark job as applied" / "create
-- application from job" can find/avoid duplicating an application for the
-- same saved job.
--
-- `resume_id` / `resume_version_id` / `cover_letter_id` all `on delete set
-- null` for the same reason resume_versions/cover_letters use it elsewhere:
-- deleting a resume, version, or letter later must never delete the
-- application record itself, only clear the (now-stale) link.
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  job_title text not null,
  company text not null,
  job_url text,
  location text,
  salary text,
  status text not null default 'Saved'
    check (status in ('Saved', 'Preparing', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected', 'Withdrawn')),
  source text not null default 'manual',
  resume_id uuid references public.resumes (id) on delete set null,
  resume_version_id uuid references public.resume_versions (id) on delete set null,
  cover_letter_id uuid references public.cover_letters (id) on delete set null,
  notes text,
  applied_at timestamptz,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.applications is
  'Tracked job applications — the Kanban board at /dashboard/applications reads/writes this table. Snapshots job details at creation time rather than joining live.';

create index if not exists applications_user_id_status_idx
  on public.applications (user_id, status);

create index if not exists applications_user_id_created_at_idx
  on public.applications (user_id, created_at desc);

create index if not exists applications_job_id_idx
  on public.applications (job_id);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row
  execute function public.set_updated_at();

alter table public.applications enable row level security;

drop policy if exists "Applications are selectable by owner" on public.applications;
create policy "Applications are selectable by owner"
  on public.applications for select
  using (auth.uid() = user_id);

drop policy if exists "Applications are insertable by owner" on public.applications;
create policy "Applications are insertable by owner"
  on public.applications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Applications are updatable by owner" on public.applications;
create policy "Applications are updatable by owner"
  on public.applications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Applications are deletable by owner" on public.applications;
create policy "Applications are deletable by owner"
  on public.applications for delete
  using (auth.uid() = user_id);
