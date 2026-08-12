# JobPilot AI

**Your AI-powered career copilot.**

Optimize your resume, improve ATS compatibility, organize applications, and prepare for
interviews — all in one place.

> **Current scope (Phases 1–3):** authentication, the landing page, and the dashboard
> shell (Phase 1); the deterministic ATS Resume Analyzer (Phase 2); and the AI Resume
> Optimizer + Cover Letter Generator (Phase 3). Application tracking, job scraping,
> interview prep AI, analytics, and a career assistant are intentionally **not**
> implemented yet and are represented in the UI as "Coming in a future phase."
>
> **Phase 3 requires an AI provider API key to actually generate anything.** Without
> `AI_PROVIDER` / `AI_API_KEY` set, the Resume Optimizer and Cover Letter pages load
> normally but show an "AI provider not configured" message instead of a result — see
> [§8 AI provider setup](#8-ai-provider-setup-phase-3). Nothing in this app claims to be
> "AI powered" unless a provider is actually configured and responding — see also
> [Known limitations](#known-limitations-phase-3).

Built to run entirely on **free tiers**: Next.js + Vercel + Supabase.

---

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Framer Motion, Lucide icons
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **ATS scoring:** a fully deterministic, in-house engine (`lib/ats/`) — no AI involved
- **AI (optional, Phase 3):** Anthropic Claude via `@anthropic-ai/sdk`, isolated behind a
  vendor-neutral provider abstraction (`lib/ai/`)
- **Deployment:** Vercel (free tier)

## 1. Requirements

- Node.js 20+
- npm
- A free [Supabase](https://supabase.com) account and project
- A free [Vercel](https://vercel.com) account (for deployment)

## 2. Installation

```bash
git clone <your-repo-url>
cd JOBPILOT
npm install
```

## 3. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public API key |
| `AI_PROVIDER` | No (Phase 3 only) | AI provider to use. Currently only `anthropic` is implemented |
| `AI_API_KEY` | No (Phase 3 only) | Your Anthropic API key — read server-side only, never sent to the browser |
| `AI_MODEL` | No | Overrides the default model (`claude-sonnet-5`) |

The two `NEXT_PUBLIC_SUPABASE_*` values are found in your Supabase project at **Project
Settings → API**. The `AI_*` variables are optional — see [§8 AI provider
setup](#8-ai-provider-setup-phase-3).

Never commit `.env.local` — it's already covered by `.gitignore`. The Supabase anon key
is safe to expose in the browser; real access control is enforced server-side by the Row
Level Security (RLS) policies defined in the migrations below. The Supabase **service
role key is never used or exposed** anywhere in this app, and the `AI_API_KEY` is only
ever read in server-side code (`lib/ai/provider.ts`) — it is never sent to the client.

## 4. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com) (the free tier is
   sufficient for this project).
2. Copy your **Project URL** and **anon public key** into `.env.local` (see above).
3. Apply the database migrations — see the next section.
4. Confirm email auth is enabled (it's on by default): **Authentication → Providers →
   Email**.
5. **Recommended for local development:** under **Authentication → URL Configuration**,
   add `http://localhost:3000/auth/callback` to the list of Redirect URLs so email
   confirmation and password-reset links work locally. Add your production domain's
   equivalent URL (e.g. `https://your-app.vercel.app/auth/callback`) after deploying.

## 5. Database migrations

SQL migration files live in [`supabase/migrations/`](supabase/migrations/):

- `0001_create_profiles.sql` — creates the `profiles` table, RLS policies, and the
  trigger that auto-creates a profile row when a user signs up.
- `0002_avatar_storage.sql` — creates the public `avatars` Storage bucket and its
  access policies.
- `0003_resume_ats.sql` — Phase 2. Creates the `resumes` and `job_analyses` tables, a
  private `resumes` Storage bucket, and owner-only RLS policies for both.
- `0004_resume_versions_cover_letters.sql` — Phase 3. Creates the `resume_versions` and
  `cover_letters` tables (both owner-only RLS) used by the AI Resume Optimizer and Cover
  Letter Generator. Purely additive — does not modify 0001–0003.

Each migration is idempotent (`if not exists` / `drop ... if exists` before every
`create`), so re-running an already-applied migration is safe.

Apply them with either approach:

**Option A — Supabase Dashboard (simplest):**
Open your project's **SQL Editor**, paste the contents of each migration file in
order, and run it.

**Option B — Supabase CLI:**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This project does not assume direct access to your Supabase project — you must apply
these migrations yourself using one of the methods above.

## 6. Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run lint    # ESLint
npm run build   # Production build
npm run start   # Serve the production build
```

## 7. Deploying to Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. In Vercel, click **Add New → Project** and import the repository.
3. Add the environment variables from `.env.example` in the Vercel project settings
   (**Settings → Environment Variables**) — the two `NEXT_PUBLIC_SUPABASE_*` ones are
   required; the `AI_*` ones are optional and only needed for Phase 3 (see below).
4. Deploy. Vercel's free (Hobby) tier is sufficient.
5. Back in Supabase, add your deployed URL's callback route (e.g.
   `https://your-app.vercel.app/auth/callback`) to **Authentication → URL
   Configuration → Redirect URLs**.

## 8. AI provider setup (Phase 3)

The Resume Optimizer and Cover Letter Generator are the only parts of the app that call
an external AI provider. Everything else — auth, the dashboard, the ATS Analyzer's
scoring — is deterministic and works with **zero** AI configuration.

1. Create a free/pay-as-you-go account at [console.anthropic.com](https://console.anthropic.com/)
   and generate an API key.
2. Set in `.env.local` (and in Vercel's project environment variables for production):
   ```
   AI_PROVIDER=anthropic
   AI_API_KEY=sk-ant-...
   ```
3. Optionally set `AI_MODEL` to override the default (`claude-sonnet-5`).
4. Restart `npm run dev` (or redeploy). The "AI provider not configured" banner on
   `/dashboard/resume-optimizer` and `/dashboard/cover-letter` should disappear.

If these variables are unset or the key is invalid, the app **never fakes a result** —
it shows a clear setup or error message instead (see [Known limitations](#known-limitations-phase-3)).

## Project structure

```
app/                          Routes (App Router)
  (auth)/                      login, signup, forgot-password, reset-password
  auth/callback/                Supabase email link handler (route handler)
  dashboard/                   Protected app shell + pages
    ats-analyzer/                Phase 2: upload/select resume, run ATS analysis, history
    resume-optimizer/            Phase 3: AI resume optimization + saved version history
    cover-letter/                Phase 3: AI cover letter generation + saved letter history
components/
  ui/                          shadcn/ui primitives
  landing/                     Marketing page sections
  auth/                        Auth forms
  dashboard/                   Sidebar, topbar, dashboard widgets
  ats/                         ATS Analyzer UI (Phase 2)
  optimizer/                   Resume Optimizer UI (Phase 3)
  cover-letter/                Cover Letter Generator UI (Phase 3)
  shared/                      Logo, theme provider/toggle, footer badge
lib/
  supabase/                    Browser/server/middleware Supabase clients
  ats/                         Deterministic ATS scoring engine (Phase 2) — extraction,
                                keyword/skill matching, structure/readability/scoring
  ai/                          AI provider abstraction (Phase 3) — see below
  validations/                 Zod schemas (input validation + AI output validation)
  download.ts                  Browser-side plain-text file download helper
services/                      Data-access functions, one file per domain (ownership
                                checks + typed errors; the only layer that talks to
                                Supabase tables directly)
types/                         Shared TypeScript types, including the database schema
supabase/migrations/           SQL migrations
middleware.ts                  Route protection + session refresh
```

## ATS Resume Analyzer (Phase 2)

`/dashboard/ats-analyzer` — upload a resume (PDF/DOCX) or reuse a previously-uploaded
one, paste a job description, and get a **deterministic, non-AI** 0–100 ATS score
computed from keyword matching, skills matching, experience/education alignment, resume
structure, and readability (`lib/ats/analyze.ts`, weighted per `lib/ats/scoring.ts`).
Nothing about this score involves an AI model — it's the same engine every time, and it
runs with zero AI configuration. This score is reused as-is by Phase 3 (see below) rather
than duplicated.

## AI provider architecture (Phase 3)

All AI calls are isolated behind a single vendor-neutral interface in `lib/ai/`:

- **`lib/ai/types.ts`** — the `AIProvider` interface (`optimizeResume()` /
  `generateCoverLetter()`) and its input/output types. Nothing outside `lib/ai/` talks to
  a provider SDK directly.
- **`lib/ai/provider.ts`** — the only file that imports `@anthropic-ai/sdk`. Exposes
  `getAIProvider()` (returns `null` if unconfigured), `requireAIProvider()` (throws a
  typed error if unconfigured), and `isAIProviderConfigured()` (non-throwing check used
  to render the "not configured" banner). AI output is parsed with the SDK's
  `messages.parse()` + `zodOutputFormat()`, so responses are Zod-validated before they
  ever reach application code (schemas in `lib/validations/ai-output.ts`).
- **`lib/ai/errors.ts`** — a typed `AIProviderError` hierarchy (not configured, bad
  key, rate limited, timeout, provider outage, content too large, malformed output) each
  with a safe, user-facing message. Raw provider errors/stack traces are never shown to
  users.
- **`lib/ai/prompts.ts`** — centralized prompt templates. Every prompt explicitly
  instructs the model to use only information present in the supplied resume/profile
  text, never fabricate employment history, skills, metrics, or credentials, and to
  surface JD requirements the resume doesn't support as a suggestion ("consider adding
  this if you genuinely have experience with it") rather than inventing them.

Swapping providers means implementing `AIProvider` once in a new file under `lib/ai/` and
changing `getAIProvider()`'s factory — no other file in the app changes.

### Resume optimization + versioning

`/dashboard/resume-optimizer` — pick a resume (or a previously-generated version),
target job title/company, and a job description, optionally include your existing ATS
Analyzer findings as extra grounding context, then optimize. The result is a **preview**,
not an automatic save:

- The optimized text is re-scored with the exact same deterministic `analyzeResume()`
  engine used by the ATS Analyzer — the "optimized" ATS score is never a number the AI
  claims, it's independently recomputed.
- Every change is shown as before/after text plus a grounded reason.
- Anything the JD wants that the resume doesn't support is listed separately as an
  "unsupported recommendation," never silently added to the resume.
- Saving is an explicit "Save as New Version" action — it always **inserts** a new
  `resume_versions` row; the original resume (and every prior version) is never
  overwritten. Versions can be viewed, compared against their source text, downloaded as
  `.txt`, or deleted at `/dashboard/resume-optimizer/versions`. The original resume can
  still only be deleted via the existing ATS Analyzer resume-deletion flow.

### Cover letter generation

`/dashboard/cover-letter` — pick a resume (or version), job title/company, job
description, and an optional tone (Professional / Concise / Confident / Friendly). The
letter is generated strictly from that resume/version's text, the job description, and
your saved profile fields (`services/profile-service.ts`) — no other input is requested.
The result is editable before saving; if you hand-edit the generated text, the exact
edited content is what gets saved. Saved letters live at `/dashboard/cover-letter/history`
and can be reopened, edited, regenerated, copied, downloaded, or deleted.

## Known limitations (Phase 3)

- Downloads are plain `.txt` only — there is no PDF/DOCX generation. This is intentional:
  the spec explicitly forbids paid document-generation services and false fidelity
  claims, so we don't pretend to produce a formatted document we can't.
- Only one AI provider (Anthropic) is implemented. `AI_PROVIDER=anthropic` is the only
  supported value today.
- AI optimization output is only as good as the source resume text — resumes that failed
  text extraction (scanned images, password-protected PDFs) can't be optimized until
  re-uploaded as a text-based file.
- There's no server-side rate limiting service (by design — no paid rate-limiting SaaS).
  Abuse is mitigated with disabled/debounced submit buttons and server-side length limits
  only.

## Authentication

Implemented with Supabase Auth (email/password only — no third-party OAuth):

- Signup with email verification
- Login with persistent sessions
- Forgot/reset password
- Logout
- Protected routes (`/dashboard/**`) enforced in `middleware.ts`

## Security notes

- Row Level Security is enabled on every table (`profiles`, `resumes`, `job_analyses`,
  `resume_versions`, `cover_letters`); users can only read/insert/update/delete their own
  rows.
- The Supabase **service role key is never used**.
- Avatar and resume uploads are scoped per-user via Storage RLS policies.
- Every Server Action re-verifies resource ownership server-side before reading or
  writing — a browser-supplied resume/version/analysis/letter id can never be used to
  access another user's data, even though RLS already enforces this at the database
  layer too (defense in depth).
- The `AI_API_KEY` is read only in `lib/ai/provider.ts` (server-side) and is never sent
  to the browser or logged.

## License

Private project — all rights reserved.
