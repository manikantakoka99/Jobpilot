-- ============================================================================
-- 0008_career_assistant.sql
-- JobPilot AI — Career Assistant
--
-- Creates `career_assistant_sessions` and `career_assistant_messages` and
-- their Row Level Security policies. A session is one ongoing chat thread;
-- messages hold the actual turns. Deliberately no separate
-- "career_assistant_context" table — context is always built fresh from
-- existing tables per message (see services/career-assistant-service.ts),
-- never duplicated/stored here.
--
-- This migration is purely additive — it does not modify 0001-0007. Safe to
-- re-run: every statement uses `if not exists` / `drop ... if exists` before
-- create, matching the pattern used in prior migrations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. career_assistant_sessions
-- ----------------------------------------------------------------------------
-- `title` is a short, auto-derived label (e.g. from the first message) shown
-- in the session list — purely cosmetic, never sent back to the AI provider.
create table if not exists public.career_assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.career_assistant_sessions is
  'One Career Assistant chat thread. Messages are stored in career_assistant_messages; per-message AI context is built fresh from existing tables, never duplicated here.';

create index if not exists career_assistant_sessions_user_id_updated_at_idx
  on public.career_assistant_sessions (user_id, updated_at desc);

drop trigger if exists career_assistant_sessions_set_updated_at on public.career_assistant_sessions;
create trigger career_assistant_sessions_set_updated_at
  before update on public.career_assistant_sessions
  for each row
  execute function public.set_updated_at();

alter table public.career_assistant_sessions enable row level security;

drop policy if exists "Career assistant sessions are selectable by owner" on public.career_assistant_sessions;
create policy "Career assistant sessions are selectable by owner"
  on public.career_assistant_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Career assistant sessions are insertable by owner" on public.career_assistant_sessions;
create policy "Career assistant sessions are insertable by owner"
  on public.career_assistant_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Career assistant sessions are updatable by owner" on public.career_assistant_sessions;
create policy "Career assistant sessions are updatable by owner"
  on public.career_assistant_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Career assistant sessions are deletable by owner" on public.career_assistant_sessions;
create policy "Career assistant sessions are deletable by owner"
  on public.career_assistant_sessions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. career_assistant_messages
-- ----------------------------------------------------------------------------
-- `user_id` is denormalized from the parent session for the same
-- direct-owner-check RLS reason interview_questions denormalizes it from
-- interview_sessions. `role` follows the standard chat-transcript shape;
-- only 'user' and 'assistant' are ever written by the app (no 'system' row —
-- the system prompt is built fresh per request in lib/ai/prompts.ts and never
-- persisted).
create table if not exists public.career_assistant_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.career_assistant_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

comment on table public.career_assistant_messages is
  'Turns in a Career Assistant chat thread. Full history is kept for the user''s own review; only a recency-bounded slice is ever sent to the AI provider per request (see services/career-assistant-service.ts).';

create index if not exists career_assistant_messages_session_id_created_at_idx
  on public.career_assistant_messages (session_id, created_at);

alter table public.career_assistant_messages enable row level security;

drop policy if exists "Career assistant messages are selectable by owner" on public.career_assistant_messages;
create policy "Career assistant messages are selectable by owner"
  on public.career_assistant_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Career assistant messages are insertable by owner" on public.career_assistant_messages;
create policy "Career assistant messages are insertable by owner"
  on public.career_assistant_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Career assistant messages are deletable by owner" on public.career_assistant_messages;
create policy "Career assistant messages are deletable by owner"
  on public.career_assistant_messages for delete
  using (auth.uid() = user_id);
