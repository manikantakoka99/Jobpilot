-- ============================================================================
-- 0003_resume_ats.sql
-- JobPilot AI — Phase 2: ATS Resume Analyzer
--
-- Creates the `resumes` and `job_analyses` tables, a dedicated private
-- `resumes` Storage bucket, and Row Level Security so users can only ever
-- read/write their own resumes and analyses.
--
-- This migration is purely additive — it does not modify 0001 or 0002.
-- Safe to re-run: every statement uses `if not exists` / `on conflict` /
-- `drop ... if exists` before create, matching the pattern used in 0001/0002.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. resumes
-- ----------------------------------------------------------------------------
-- Beyond the minimum columns needed to track an uploaded file, this table
-- also stores the server-extracted plain text (`extracted_text`) and the
-- outcome of that extraction (`text_extraction_status`). Storing the text
-- once at upload time — rather than re-downloading and re-parsing the file
-- from Storage on every analysis — keeps repeat analyses fast and keeps the
-- ATS engine decoupled from Storage entirely (see lib/ats/).
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null check (file_type in ('pdf', 'docx')),
  file_size integer not null check (file_size > 0),
  extracted_text text,
  text_extraction_status text not null default 'pending'
    check (text_extraction_status in ('pending', 'success', 'no_text_layer', 'password_protected', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.resumes is
  'Uploaded resume files (Storage metadata) plus their server-extracted text, one row per upload.';

create index if not exists resumes_user_id_created_at_idx
  on public.resumes (user_id, created_at desc);

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
  before update on public.resumes
  for each row
  execute function public.set_updated_at();

alter table public.resumes enable row level security;

drop policy if exists "Resumes are selectable by owner" on public.resumes;
create policy "Resumes are selectable by owner"
  on public.resumes for select
  using (auth.uid() = user_id);

drop policy if exists "Resumes are insertable by owner" on public.resumes;
create policy "Resumes are insertable by owner"
  on public.resumes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Resumes are updatable by owner" on public.resumes;
create policy "Resumes are updatable by owner"
  on public.resumes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Resumes are deletable by owner" on public.resumes;
create policy "Resumes are deletable by owner"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. job_analyses
-- ----------------------------------------------------------------------------
-- `score_breakdown` and `details` extend the columns requested in the Phase 2
-- spec so the saved-result page can be re-rendered in full without
-- re-running the analysis: `score_breakdown` holds the six weighted
-- sub-scores (0-100 each) and `details` holds the experience-alignment and
-- education/certification findings plus readability metrics. All other
-- columns match the spec exactly.
create table if not exists public.job_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  job_title text,
  job_description text not null,
  ats_score integer not null check (ats_score between 0 and 100),
  keyword_match_percentage integer not null check (keyword_match_percentage between 0 and 100),
  matched_keywords jsonb not null default '[]'::jsonb,
  missing_keywords jsonb not null default '[]'::jsonb,
  skills_found jsonb not null default '[]'::jsonb,
  skills_missing jsonb not null default '[]'::jsonb,
  structure_issues jsonb not null default '[]'::jsonb,
  formatting_issues jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  score_breakdown jsonb not null default '{}'::jsonb,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.job_analyses is
  'Saved ATS analysis results: one row per "Analyze Resume" run against a job description.';

create index if not exists job_analyses_user_id_created_at_idx
  on public.job_analyses (user_id, created_at desc);

create index if not exists job_analyses_resume_id_idx
  on public.job_analyses (resume_id);

drop trigger if exists job_analyses_set_updated_at on public.job_analyses;
create trigger job_analyses_set_updated_at
  before update on public.job_analyses
  for each row
  execute function public.set_updated_at();

alter table public.job_analyses enable row level security;

drop policy if exists "Analyses are selectable by owner" on public.job_analyses;
create policy "Analyses are selectable by owner"
  on public.job_analyses for select
  using (auth.uid() = user_id);

drop policy if exists "Analyses are insertable by owner" on public.job_analyses;
create policy "Analyses are insertable by owner"
  on public.job_analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Analyses are updatable by owner" on public.job_analyses;
create policy "Analyses are updatable by owner"
  on public.job_analyses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Analyses are deletable by owner" on public.job_analyses;
create policy "Analyses are deletable by owner"
  on public.job_analyses for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Storage — dedicated "resumes" bucket (separate from "avatars")
-- ----------------------------------------------------------------------------
-- Unlike avatars, resumes are private documents: the bucket is NOT public,
-- and only the owning user may read their own files (no public policy).
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "Users can view their own resume files" on storage.objects;
create policy "Users can view their own resume files"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload their own resume files" on storage.objects;
create policy "Users can upload their own resume files"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update their own resume files" on storage.objects;
create policy "Users can update their own resume files"
  on storage.objects for update
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own resume files" on storage.objects;
create policy "Users can delete their own resume files"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
