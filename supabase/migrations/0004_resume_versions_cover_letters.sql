-- ============================================================================
-- 0004_resume_versions_cover_letters.sql
-- JobPilot AI — Phase 3: AI Resume Optimizer + Cover Letter Generator
--
-- Creates the `resume_versions` and `cover_letters` tables and their Row
-- Level Security policies. Both tables hold AI-generated content — see
-- lib/ai/ for the provider abstraction and services/resume-optimizer-service.ts
-- / services/cover-letter-service.ts for how rows here get written.
--
-- This migration is purely additive — it does not modify 0001, 0002, or
-- 0003. Safe to re-run: every statement uses `if not exists` / `drop ... if
-- exists` before create, matching the pattern used in prior migrations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. resume_versions
-- ----------------------------------------------------------------------------
-- One row per AI-optimized version of a resume. The original resume file and
-- its extracted text (public.resumes) are never overwritten or referenced as
-- a "version 0" here — a version row only exists once a user generates one.
-- `source_version_id` optionally points at the version a new version was
-- generated from (re-optimizing an already-optimized version); it's null
-- when a version was generated directly from the original resume.
create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  version_name text,
  source_version_id uuid references public.resume_versions (id) on delete set null,
  target_job_title text,
  target_company text,
  job_description text not null,
  content text not null,
  change_summary jsonb not null default '[]'::jsonb,
  ats_score_original integer check (ats_score_original between 0 and 100),
  ats_score_optimized integer check (ats_score_optimized between 0 and 100),
  ats_score_delta integer,
  remaining_missing_keywords jsonb not null default '[]'::jsonb,
  remaining_issues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resume_id, version_number)
);

comment on table public.resume_versions is
  'AI-optimized resume versions, generated with the deterministic ATS engine used to re-score them. Never overwrites the original resume row.';

create index if not exists resume_versions_user_id_created_at_idx
  on public.resume_versions (user_id, created_at desc);

create index if not exists resume_versions_resume_id_idx
  on public.resume_versions (resume_id);

drop trigger if exists resume_versions_set_updated_at on public.resume_versions;
create trigger resume_versions_set_updated_at
  before update on public.resume_versions
  for each row
  execute function public.set_updated_at();

alter table public.resume_versions enable row level security;

drop policy if exists "Resume versions are selectable by owner" on public.resume_versions;
create policy "Resume versions are selectable by owner"
  on public.resume_versions for select
  using (auth.uid() = user_id);

drop policy if exists "Resume versions are insertable by owner" on public.resume_versions;
create policy "Resume versions are insertable by owner"
  on public.resume_versions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Resume versions are updatable by owner" on public.resume_versions;
create policy "Resume versions are updatable by owner"
  on public.resume_versions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Resume versions are deletable by owner" on public.resume_versions;
create policy "Resume versions are deletable by owner"
  on public.resume_versions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. cover_letters
-- ----------------------------------------------------------------------------
-- `resume_version_id` is optional: a cover letter can be generated from the
-- original resume (resume_version_id null) or from a specific optimized
-- version. `on delete set null` so deleting a version doesn't delete a
-- user's saved cover letter — only its version link is cleared.
create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  resume_version_id uuid references public.resume_versions (id) on delete set null,
  job_title text not null,
  company text,
  job_description text not null,
  tone text not null default 'professional'
    check (tone in ('professional', 'concise', 'confident', 'friendly')),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cover_letters is
  'AI-generated cover letters, grounded in a resume (or resume version), a job description, and the user''s profile. One row per saved letter.';

create index if not exists cover_letters_user_id_created_at_idx
  on public.cover_letters (user_id, created_at desc);

create index if not exists cover_letters_resume_id_idx
  on public.cover_letters (resume_id);

drop trigger if exists cover_letters_set_updated_at on public.cover_letters;
create trigger cover_letters_set_updated_at
  before update on public.cover_letters
  for each row
  execute function public.set_updated_at();

alter table public.cover_letters enable row level security;

drop policy if exists "Cover letters are selectable by owner" on public.cover_letters;
create policy "Cover letters are selectable by owner"
  on public.cover_letters for select
  using (auth.uid() = user_id);

drop policy if exists "Cover letters are insertable by owner" on public.cover_letters;
create policy "Cover letters are insertable by owner"
  on public.cover_letters for insert
  with check (auth.uid() = user_id);

drop policy if exists "Cover letters are updatable by owner" on public.cover_letters;
create policy "Cover letters are updatable by owner"
  on public.cover_letters for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Cover letters are deletable by owner" on public.cover_letters;
create policy "Cover letters are deletable by owner"
  on public.cover_letters for delete
  using (auth.uid() = user_id);
