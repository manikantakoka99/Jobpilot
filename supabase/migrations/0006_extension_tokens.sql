-- ============================================================================
-- 0006_extension_tokens.sql
-- JobPilot AI — Phase 4: Chrome Extension Foundation (authentication)
--
-- Creates `extension_tokens`, the table backing the extension's
-- authentication flow (see lib/extension/tokens.ts and app/api/extension/).
-- A row here is a hashed, revocable, expiring personal-access-token — the
-- same pattern GitHub/Vercel use for CLI/third-party-tool auth. The raw
-- token is shown to the user exactly once at creation time and never
-- stored — only its SHA-256 hash is persisted, so a leaked database export
-- alone can't be used to authenticate as the extension.
--
-- This migration is purely additive — it does not modify 0001–0005. Safe to
-- re-run: every statement uses `if not exists` / `drop ... if exists` before
-- create, matching the pattern used in prior migrations.
-- ============================================================================

create table if not exists public.extension_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'Chrome Extension',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz
);

comment on table public.extension_tokens is
  'Hashed, revocable personal-access-tokens the Chrome extension uses to authenticate to the JobPilot API. Raw token is never stored — see lib/extension/tokens.ts.';

create index if not exists extension_tokens_user_id_created_at_idx
  on public.extension_tokens (user_id, created_at desc);

-- Looked up by hash on every extension API request (see
-- app/api/extension/*/route.ts) — this is the hot-path index.
create index if not exists extension_tokens_token_hash_idx
  on public.extension_tokens (token_hash);

alter table public.extension_tokens enable row level security;

-- Owner-only, and ONLY via the normal cookie-authenticated web session
-- (creating/listing/revoking tokens always happens from a logged-in
-- /dashboard/settings request). The extension itself never talks to
-- Supabase directly — it only ever calls JobPilot's own API routes, which
-- validate the bearer token server-side using the service-role key (see
-- lib/supabase/service.ts) and enforce ownership in application code, not
-- through this RLS policy. That's what makes the token-hash lookup on an
-- unauthenticated request possible at all: a plain anon-key client can never
-- see these rows (auth.uid() is null), by design.
drop policy if exists "Extension tokens are selectable by owner" on public.extension_tokens;
create policy "Extension tokens are selectable by owner"
  on public.extension_tokens for select
  using (auth.uid() = user_id);

drop policy if exists "Extension tokens are insertable by owner" on public.extension_tokens;
create policy "Extension tokens are insertable by owner"
  on public.extension_tokens for insert
  with check (auth.uid() = user_id);

drop policy if exists "Extension tokens are deletable by owner" on public.extension_tokens;
create policy "Extension tokens are deletable by owner"
  on public.extension_tokens for delete
  using (auth.uid() = user_id);
