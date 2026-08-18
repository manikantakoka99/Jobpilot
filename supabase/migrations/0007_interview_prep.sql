-- ============================================================================
-- 0007_interview_prep.sql
-- JobPilot AI — Interview Prep + Mock Interview
--
-- Creates `interview_sessions`, `interview_questions`, and `interview_answers`
-- and their Row Level Security policies. A session is one Start -> Question ->
-- Answer -> Feedback -> ... -> Finish run: it snapshots the resume/job context
-- it was generated from (so later edits/deletes elsewhere never change what a
-- past session says it was about), holds the ordered list of questions the AI
-- generated for it, and the user's per-question answers + AI feedback.
--
-- This migration is purely additive — it does not modify 0001-0006. Safe to
-- re-run: every statement uses `if not exists` / `drop ... if exists` before
-- create, matching the pattern used in prior migrations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. interview_sessions
-- ----------------------------------------------------------------------------
-- `resume_id`/`resume_version_id`/`job_id` are optional traceability links
-- (all `on delete set null`, matching applications' pattern) — deleting a
-- resume, version, or saved job later must never delete a past interview
-- session, only clear the now-stale link. `job_title`/`company`/
-- `job_description` are a snapshot copied at creation time for the same
-- reason applications snapshots them.
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid references public.resumes (id) on delete set null,
  resume_version_id uuid references public.resume_versions (id) on delete set null,
  job_id uuid references public.jobs (id) on delete set null,
  job_title text not null,
  company text,
  job_description text not null default '',
  -- Snapshots of the grounding material questions/feedback were generated
  -- from (resume text + dictionary-matched skills at session-start time) —
  -- kept alongside the resume_id/resume_version_id links (which are nullable
  -- and `on delete set null`) so a later resume edit/delete can never change
  -- what a past session's questions were actually grounded in, and so
  -- per-answer feedback never has to re-fetch a possibly-deleted resume.
  resume_snapshot text not null default '',
  detected_skills jsonb not null default '[]'::jsonb,
  mode text not null check (mode in ('behavioral', 'technical', 'mixed')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  total_questions integer not null default 5 check (total_questions > 0 and total_questions <= 20),
  overall_score integer check (overall_score between 0 and 100),
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  improvement_suggestions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table public.interview_sessions is
  'One Start->Finish mock interview run. Snapshots its resume/job context at creation time; final score + summary are filled in when the session is finished.';

create index if not exists interview_sessions_user_id_created_at_idx
  on public.interview_sessions (user_id, created_at desc);

drop trigger if exists interview_sessions_set_updated_at on public.interview_sessions;
create trigger interview_sessions_set_updated_at
  before update on public.interview_sessions
  for each row
  execute function public.set_updated_at();

alter table public.interview_sessions enable row level security;

drop policy if exists "Interview sessions are selectable by owner" on public.interview_sessions;
create policy "Interview sessions are selectable by owner"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Interview sessions are insertable by owner" on public.interview_sessions;
create policy "Interview sessions are insertable by owner"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Interview sessions are updatable by owner" on public.interview_sessions;
create policy "Interview sessions are updatable by owner"
  on public.interview_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Interview sessions are deletable by owner" on public.interview_sessions;
create policy "Interview sessions are deletable by owner"
  on public.interview_sessions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. interview_questions
-- ----------------------------------------------------------------------------
-- `user_id` is denormalized from the parent session (rather than only
-- reachable via a join) so RLS here can be a simple, direct owner check —
-- the same pattern resume_versions/cover_letters use relative to resumes.
-- `grounded_in` records which resume/job-description signals (skills,
-- technologies, project/experience snippets) a technical question was
-- generated from, so the UI can show its basis and the answer-feedback
-- prompt never has to re-derive it.
create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_number integer not null check (question_number > 0),
  category text not null check (category in ('behavioral', 'technical')),
  question_text text not null,
  grounded_in jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, question_number)
);

comment on table public.interview_questions is
  'Ordered, AI-generated questions for one interview session. Technical questions are grounded in the session''s resume/job snapshot (see grounded_in); behavioral questions may use generic STAR-style patterns.';

create index if not exists interview_questions_session_id_idx
  on public.interview_questions (session_id, question_number);

alter table public.interview_questions enable row level security;

drop policy if exists "Interview questions are selectable by owner" on public.interview_questions;
create policy "Interview questions are selectable by owner"
  on public.interview_questions for select
  using (auth.uid() = user_id);

drop policy if exists "Interview questions are insertable by owner" on public.interview_questions;
create policy "Interview questions are insertable by owner"
  on public.interview_questions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Interview questions are deletable by owner" on public.interview_questions;
create policy "Interview questions are deletable by owner"
  on public.interview_questions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. interview_answers
-- ----------------------------------------------------------------------------
-- One row per submitted answer, at most one per question (`unique
-- (question_id)`) — resubmitting an answer updates this row rather than
-- creating a second one. `feedback` holds the AI's structured critique
-- (relevance/clarity/structure/specificity/confidence/missing detail); `score`
-- is that same feedback's 0-100 rating for this one answer, used to compute
-- the session's overall_score when finished.
create table if not exists public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.interview_questions (id) on delete cascade,
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  answer_text text not null,
  score integer check (score between 0 and 100),
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id)
);

comment on table public.interview_answers is
  'The user''s answer to one interview_question, plus the AI''s structured feedback (never a claim of factual expertise about the candidate) and per-answer score.';

create index if not exists interview_answers_session_id_idx
  on public.interview_answers (session_id);

drop trigger if exists interview_answers_set_updated_at on public.interview_answers;
create trigger interview_answers_set_updated_at
  before update on public.interview_answers
  for each row
  execute function public.set_updated_at();

alter table public.interview_answers enable row level security;

drop policy if exists "Interview answers are selectable by owner" on public.interview_answers;
create policy "Interview answers are selectable by owner"
  on public.interview_answers for select
  using (auth.uid() = user_id);

drop policy if exists "Interview answers are insertable by owner" on public.interview_answers;
create policy "Interview answers are insertable by owner"
  on public.interview_answers for insert
  with check (auth.uid() = user_id);

drop policy if exists "Interview answers are updatable by owner" on public.interview_answers;
create policy "Interview answers are updatable by owner"
  on public.interview_answers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Interview answers are deletable by owner" on public.interview_answers;
create policy "Interview answers are deletable by owner"
  on public.interview_answers for delete
  using (auth.uid() = user_id);
