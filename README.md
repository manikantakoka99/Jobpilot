# JobPilot AI

**Your AI-powered career copilot.**

Optimize your resume, improve ATS compatibility, organize applications, and prepare for
interviews — all in one place.

> **Current scope (Phases 1–5):** authentication, the landing page, and the dashboard
> shell (Phase 1); the deterministic ATS Resume Analyzer (Phase 2); the AI Resume
> Optimizer + Cover Letter Generator (Phase 3); job saving, the Application Tracker,
> the Document Hub, the Apply Assistant, and a foundational Chrome extension (Phase 4);
> and AI Interview Prep + Mock Interview, an Analytics dashboard, and an AI Career
> Assistant (Phase 5). Every AI-backed feature is grounded in your own resume, job
> descriptions, and JobPilot data — none of them invent skills, experience, scores, or
> statuses that aren't actually present, and every AI answer is validated against a Zod
> schema before it's ever shown to you or saved.
>
> **Phase 3 & 5 require an AI provider API key to actually generate anything.** Without
> `AI_PROVIDER` / `AI_API_KEY` set, the Resume Optimizer, Cover Letter, Interview Prep,
> and Career Assistant pages load normally but show an "AI provider not configured"
> message instead of a result — see
> [§8 AI provider setup](#8-ai-provider-setup-phases-3-and-5). Nothing in this app claims to be
> "AI powered" unless a provider is actually configured and responding — see also
> [Known limitations](#known-limitations-phase-3).
>
> **Phase 4 does not automate applying.** The Apply Assistant and Chrome extension only
> ever *suggest* values pulled from your profile/resume for you to review and insert
> yourself, and only ever mark an application "Applied" in your own tracker after you
> explicitly confirm you submitted it. Neither one fills a form, clicks Submit, or scrapes
> a job board on its own — see [Application Tracker &
> Document Hub](#application-tracker--document-hub-phase-4) and [Chrome extension
> (Phase 4)](#chrome-extension-phase-4).
>
> **Analytics never shows fake numbers.** Every chart and metric on
> [`/dashboard/analytics`](#analytics-phase-5) is computed live from your own
> `applications`, `job_analyses`, `resume_versions`, `cover_letters`, and
> `interview_sessions` rows. If you haven't used a feature yet, its metric reads "—" or
> is omitted — never a hardcoded demo value.

Built to run entirely on **free tiers**: Next.js + Vercel + Supabase.

---

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Framer Motion, Lucide icons
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **ATS scoring:** a fully deterministic, in-house engine (`lib/ats/`) — no AI involved
- **AI (optional, Phase 3 & 5):** Groq (free-tier Llama 3.3 70B) via `groq-sdk`, isolated
  behind a vendor-neutral provider abstraction (`lib/ai/`)
- **Charts (Phase 5):** `recharts`, styled with the app's own CSS design tokens (no
  external charting service)
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
| `AI_PROVIDER` | No (Phases 3 & 5 only) | AI provider to use. Currently only `groq` is implemented |
| `AI_API_KEY` | No (Phases 3 & 5 only) | Your Groq API key — read server-side only, never sent to the browser |
| `AI_MODEL` | No | Overrides the default model (`llama-3.3-70b-versatile`) |
| `SUPABASE_SERVICE_ROLE_KEY` | No (Phase 4 extension only) | Powers the Chrome extension's API routes (`app/api/extension/*`) — see [Chrome extension (Phase 4)](#chrome-extension-phase-4) |

The two `NEXT_PUBLIC_SUPABASE_*` values are found in your Supabase project at **Project
Settings → API**. The `AI_*` variables are optional — see [§8 AI provider
setup](#8-ai-provider-setup-phases-3-and-5). `SUPABASE_SERVICE_ROLE_KEY` is optional — without
it, everything except the Chrome extension's API routes works normally; those routes
respond with a clear 503 instead of a crash.

Never commit `.env.local` — it's already covered by `.gitignore`. The Supabase anon key
is safe to expose in the browser; real access control is enforced server-side by the Row
Level Security (RLS) policies defined in the migrations below. The `AI_API_KEY` is only
ever read in server-side code (`lib/ai/provider.ts`) — it is never sent to the client.
The **service role key**, if set, is confined to `lib/supabase/service.ts` and
`app/api/extension/_lib/auth.ts`, used only to authenticate the Chrome extension's own
bearer-token requests — it is never sent to the browser or the extension itself, and
every extension route still explicitly filters by the authenticated user's id (see
[Security notes](#security-notes)).

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
- `0005_jobs_applications.sql` — Phase 4. Creates the `jobs` and `applications` tables
  (both owner-only RLS, indexed on `user_id`/`status`/`job_id`, `updated_at` triggers),
  used by Job Saving and the Application Tracker. Purely additive — does not modify
  0001–0004.
- `0006_extension_tokens.sql` — Phase 4. Creates the `extension_tokens` table (owner-only
  RLS; select/insert/delete only — there is no update policy, since revoking a token is a
  hard delete, not a status flip) used to authenticate the Chrome extension. Purely
  additive — does not modify 0001–0005.
- `0007_interview_prep.sql` — Phase 5. Creates `interview_sessions`,
  `interview_questions`, and `interview_answers` (all owner-only RLS). A session
  snapshots the resume text, detected skills, and job context it was generated from at
  creation time, so later edits or deletion of the source resume/version/job never
  change what a past session's questions were actually grounded in. Purely additive —
  does not modify 0001–0006.
- `0008_career_assistant.sql` — Phase 5. Creates `career_assistant_sessions` and
  `career_assistant_messages` (both owner-only RLS). Deliberately no separate "context"
  table — the assistant's grounding context is rebuilt fresh from existing tables
  (applications, analyses, resumes, interview sessions) on every message rather than
  duplicated/stored here. Purely additive — does not modify 0001–0007.

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

## 8. AI provider setup (Phases 3 and 5)

The Resume Optimizer, Cover Letter Generator, Interview Prep (question generation +
answer feedback + session summary), and Career Assistant are the only parts of the app
that call an external AI provider. Everything else — auth, the dashboard, the ATS
Analyzer's scoring, Analytics — is deterministic and works with **zero** AI
configuration.

1. Create a free account at [console.groq.com](https://console.groq.com/) and generate an
   API key at [console.groq.com/keys](https://console.groq.com/keys). Groq's free tier is
   enough to run every AI feature in this app.
2. Set in `.env.local` (and in Vercel's project environment variables for production):
   ```
   AI_PROVIDER=groq
   AI_API_KEY=gsk_...
   ```
3. Optionally set `AI_MODEL` to override the default (`llama-3.3-70b-versatile`).
4. Restart `npm run dev` (or redeploy). The "AI provider not configured" banner on
   `/dashboard/resume-optimizer`, `/dashboard/cover-letter`, `/dashboard/interview-prep`,
   and `/dashboard/career-assistant` should disappear.

If these variables are unset or the key is invalid, the app **never fakes a result** —
it shows a clear setup or error message instead (see [Known limitations](#known-limitations-phase-3)).
No new environment variables were introduced for Phase 5 — Interview Prep and Career
Assistant reuse this same `AI_PROVIDER`/`AI_API_KEY`/`AI_MODEL` configuration.

## Project structure

```
app/                          Routes (App Router)
  (auth)/                      login, signup, forgot-password, reset-password
  auth/callback/                Supabase email link handler (route handler)
  api/extension/                Phase 4: bearer-token-authenticated API for the Chrome
                                 extension (me, applications, screening-suggestion,
                                 mark-applied) + a private _lib/ auth helper
  dashboard/                   Protected app shell + pages
    ats-analyzer/                Phase 2: upload/select resume, run ATS analysis, history
    resume-optimizer/            Phase 3: AI resume optimization + saved version history
    cover-letter/                Phase 3: AI cover letter generation + saved letter history
    jobs/                        Phase 4: save/edit/delete jobs, "Start Application" flow
    applications/                Phase 4: Application Tracker (Kanban + detail view)
    documents/                   Phase 4: Document Hub (resumes, versions, cover letters)
    apply-assistant/             Phase 4: review-and-open assistant for one application
    settings/                    Phase 4 addition: extension token generation/revocation
    interview-prep/               Phase 5: setup, live session, history, [id] detail
    analytics/                    Phase 5: real-metrics dashboard (no fake data)
    career-assistant/             Phase 5: AI copilot chat, session list, [id] thread
components/
  ui/                          shadcn/ui primitives
  landing/                     Marketing page sections
  auth/                        Auth forms
  dashboard/                   Sidebar, topbar, dashboard widgets
  ats/                         ATS Analyzer UI (Phase 2)
  optimizer/                   Resume Optimizer UI (Phase 3)
  cover-letter/                Cover Letter Generator UI (Phase 3)
  jobs/                        Job saving + "Start Application" UI (Phase 4)
  applications/                Application Tracker UI (Phase 4)
  documents/                   Document Hub UI (Phase 4)
  apply-assistant/             Apply Assistant UI (Phase 4)
  interview/                   Interview Prep + Mock Interview UI (Phase 5)
  analytics/                   Analytics charts + metric tiles (Phase 5)
  career-assistant/            Career Assistant chat shell (Phase 5)
  shared/                      Logo, theme provider/toggle, footer badge
lib/
  supabase/                    Browser/server/middleware/service Supabase clients
  ats/                         Deterministic ATS scoring engine (Phase 2) — extraction,
                                keyword/skill matching, structure/readability/scoring
  ai/                          AI provider abstraction (Phase 3 & 5) — see below
  screening/                   Deterministic screening-question evidence matcher (Phase
                                4) — reuses lib/ats/skills.ts, no AI call
  extension/                   Extension token generation/hashing helpers (Phase 4)
  validations/                 Zod schemas (input validation + AI output validation)
  download.ts                  Browser-side plain-text file download helper
services/                      Data-access functions, one file per domain (ownership
                                checks + typed errors; the only layer that talks to
                                Supabase tables directly) — includes interview-service.ts,
                                analytics-service.ts, and career-assistant-service.ts
                                (Phase 5)
types/                         Shared TypeScript types, including the database schema
supabase/migrations/           SQL migrations
extension/                     Phase 4: standalone Chrome Manifest V3 extension — not
                                part of the Next.js build, see below
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

## AI provider architecture (Phase 3 & 5)

All AI calls are isolated behind a single vendor-neutral interface in `lib/ai/`, shared by
every AI-backed feature (Resume Optimizer, Cover Letter Generator, Interview Prep, Career
Assistant):

- **`lib/ai/types.ts`** — the `AIProvider` interface and its input/output types. Six
  methods total: `optimizeResume()` and `generateCoverLetter()` (Phase 3), plus
  `generateInterviewQuestions()`, `evaluateInterviewAnswer()`, `summarizeInterviewSession()`,
  and `careerAssistantChat()` (Phase 5). Nothing outside `lib/ai/` talks to a provider SDK
  directly.
- **`lib/ai/provider.ts`** — the only file that imports `groq-sdk`. Exposes
  `getAIProvider()` (returns `null` if unconfigured), `requireAIProvider()` (throws a
  typed error if unconfigured), and `isAIProviderConfigured()` (non-throwing check used
  to render the "not configured" banner). Requests use Groq's `chat.completions.create()`
  with `response_format: { type: "json_object" }` — Groq's `llama-3.3-70b-versatile`
  rejects the stricter `json_schema` structured-outputs mode (confirmed against the live
  API; only `json_object` is actually supported for this model), so `json_object` mode is
  used to constrain the response to *syntactically* valid JSON, and the response is then
  parsed and fully re-validated against the matching Zod schema
  (`lib/validations/ai-output.ts`) before it ever reaches application code — the Zod
  validation, not the response-format hint, is the real safety guarantee. Each of the six
  calls retries up to twice (`MAX_VALIDATION_RETRIES = 2`) with the validation error fed
  back to the model if the first response fails schema validation, before giving up with a
  typed error.
- **`lib/ai/token-budget.ts`** — a preflight check run before every completion request.
  Estimates prompt size with a conservative chars-per-token heuristic, compares it against
  `llama-3.3-70b-versatile`'s real 131,072-token context window (verified directly against
  Groq's models API, not assumed) minus a 15% safety margin and the feature's reserved
  output-token budget, and fails fast with a clear "too large" error *before* sending an
  oversized request, instead of letting the provider reject it or silently truncate.
- **`lib/ai/errors.ts`** — a typed `AIProviderError` hierarchy (not configured, bad
  key, rate limited, timeout, provider outage, content too large, malformed output) each
  with a safe, user-facing message. Raw provider errors/stack traces are never shown to
  users.
- **`lib/ai/prompts.ts`** — centralized prompt templates. Every prompt explicitly
  instructs the model to use only information present in the supplied resume/profile/job
  text, never fabricate employment history, skills, metrics, credentials, statuses, or
  application data, and to surface gaps as a suggestion ("consider adding this if you
  genuinely have experience with it") rather than inventing them. The Interview Prep and
  Career Assistant prompts additionally forbid the model from ever claiming factual
  knowledge about the candidate beyond what's in their own resume/JobPilot data.

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

## Application Tracker & Document Hub (Phase 4)

### Job saving

`/dashboard/jobs` — save a job you found elsewhere by pasting its title, company, URL,
location, salary, and description. **JobPilot never scrapes job boards** — every saved
job is entered by hand or pasted in, never fetched automatically from LinkedIn, Indeed,
or anywhere else (see [Job Source Support](#job-source-support) below). From a saved job
you can analyze it, edit it, delete it, mark it applied, or start an application.

### Analyze Job

"Analyze Job" on a saved job opens `/dashboard/ats-analyzer?jobId=...`, which pre-fills
the job title/description into the **existing** ATS Analyzer form
(`components/ats/analyzer-form.tsx`). It reuses the exact same deterministic
`analyzeResume()` engine from Phase 2 — there is no second, duplicate scoring engine for
Phase 4.

### Start Application

From a saved job, "Start Application" (`/dashboard/jobs/[id]/start`) lets you pick a
resume (or a previously-optimized version) and, optionally, a cover letter. If you pick a
resume version, its already-computed ATS score is shown for reference — this reads the
score stored on that version; it does not re-run the ATS engine. "Prepare Application"
creates an `applications` row (deduplicated per job — starting a second application for
the same saved job reuses the existing row instead of creating a duplicate) with
`status = "Preparing"` and opens the Apply Assistant for it.

### Application Tracker

`/dashboard/applications` — a Kanban board across all eight statuses (Saved, Preparing,
Applied, Screening, Interview, Offer, Rejected, Withdrawn) plus a metrics row (Total /
Applied / Interviews / Offers / Rejected). Each application can be created manually,
edited, moved between statuses, opened for full detail
(`/dashboard/applications/[id]` — shows every field plus the linked resume/version/cover
letter), or deleted. `applied_at` is only ever stamped on an explicit transition into
"Applied" — never just because a detail page or the Apply Assistant was opened — and is
never overwritten once set.

### Document Hub

`/dashboard/documents` — one place to see everything you can attach to an application:
original uploaded resumes, AI-optimized resume versions, and saved cover letters. Every
open/download/delete action here calls the **same** service functions and Server Actions
Phases 2–3 already use (`resume-service.ts`, `resume-optimizer-service.ts`,
`cover-letter-service.ts` and their existing delete actions) — Phase 4 adds exactly one
new capability, a short-lived signed URL for viewing/downloading an original resume file
(`createResumeSignedUrl` in `services/resume-service.ts`), and reuses everything else.

### Apply Assistant

`/dashboard/apply-assistant?applicationId=...` — shows the resume/version/cover letter
you chose for one application, an "Open Application" button that opens the job's URL in a
new tab, and a "Confirm submission" button ("I submitted this application") that's the
only way `status` becomes "Applied" from the web app. The page states plainly: **"JobPilot
can help fill common application fields. Review everything before submitting."** It never
claims to fill or submit anything by itself — that part is the Chrome extension's job (see
below), and even the extension only ever suggests values for you to insert.

## Chrome extension (Phase 4)

The extension lives entirely in [`/extension`](extension/) — it is **not** part of the
Next.js app or its build (no bundler, no TypeScript compile step; plain Manifest V3 +
vanilla JS so it can be loaded unpacked with zero setup).

### What it does

- **Detects common fields** on the page you're currently looking at: name, first/last
  name, email, phone, location, LinkedIn, GitHub, portfolio, education, and resume/cover
  letter upload inputs (`extension/content/field-detector.js`).
- **Suggests values** from your JobPilot profile for each detected text field, shown
  pre-filled but editable in the popup — you can change any value before it's inserted,
  and nothing is inserted until you click "Insert" on that specific field.
- **Detects screening questions** (best-effort — headings/labels containing question-like
  phrasing near an answer field) and, per question, calls
  `/api/extension/screening-suggestion` for a deterministic, evidence-based suggestion:
  either `"Evidence found in resume: X, Y"`, `"Insufficient evidence in resume."`, or
  `"JobPilot cannot confidently answer this question."` — it never fabricates an answer,
  and it never inserts or submits the answer for you; you read the suggestion and type
  your own answer on the page.
- **Updates your tracker** — after you submit an application yourself, the popup lets you
  pick which tracked application it was and click "I submitted this application," which
  calls `/api/extension/mark-applied` (the same `markApplicationApplied()` service
  function the web app's Apply Assistant uses) to set `status = Applied` and stamp
  `applied_at`. This is the **only** thing the extension can do automatically, and it only
  ever happens after that explicit click — never just because a page opened or a field was
  filled.

### What it deliberately does not do

- No content script runs on every site — `manifest.json` declares **no**
  `content_scripts` at all. Field/question detection only runs when you open the popup and
  click a detect button, via `chrome.scripting.executeScript` scoped to the single active
  tab (the `activeTab` permission), and only for that one interaction.
- No browsing history, no tab list, no reading of any page you haven't explicitly asked it
  to look at.
- No LinkedIn/Indeed/job-board scraping, no anti-bot bypass, no CAPTCHA solving, no
  credential harvesting, no stealth automation — see [Job Source
  Support](#job-source-support).
- No automatic form submission, ever — the extension never looks for or clicks a Submit
  button.
- Requested permissions are limited to `storage` (saving your pairing token/settings
  locally), `activeTab` + `scripting` (on-demand detection/insertion on the tab you're
  looking at), and `host_permissions` for the JobPilot API origin only (not for any job
  site).

### Authentication (extension ↔ web app)

There is no Supabase key of any kind inside the extension. Pairing uses a personal-access
-token (PAT) flow:

1. In the web app, sign in normally and go to **Settings → Extension**, then click
   "Generate token." This runs through the existing cookie-authenticated session
   (`app/dashboard/settings/actions.ts` → `services/extension-token-service.ts`) — no
   service-role key is involved in generating it.
2. The **raw token is shown once**, prefixed `jbpt_`; only its SHA-256 hash is ever
   persisted (`extension_tokens.token_hash`), and it expires after 90 days.
3. Paste that raw token into the extension popup. It's stored in `chrome.storage.local`
   (extension-local, not synced, not accessible to web pages) and sent as
   `Authorization: Bearer <token>` on every request to `/api/extension/*`.
4. Each extension route (`app/api/extension/_lib/auth.ts`) hashes the incoming token,
   looks it up, checks it isn't revoked/expired, and only then uses the Supabase
   **service-role** client (`lib/supabase/service.ts`) — confined to this one file plus
   the route handlers under `app/api/extension/` — to fetch that specific user's data.
   Every query still filters explicitly by the resolved `userId`, so a bug in one query
   can't leak another user's data even though the service-role client itself bypasses RLS.
5. Revoking a token in Settings **hard-deletes** its row — there is deliberately no RLS
   `update` policy on `extension_tokens`, so a revoked token can't be "un-revoked" by any
   client-side bug.

### Local install (development)

1. Run the web app locally (`npm run dev`, defaults to `http://localhost:3000`) and set
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (see [§3 Environment
   variables](#3-environment-variables)).
2. In Chrome, go to `chrome://extensions`, enable **Developer mode**, click **Load
   unpacked**, and select the `/extension` folder.
3. In the web app, go to **Settings → Extension**, generate a token, and copy it.
4. Click the JobPilot extension icon, paste the token (and confirm the JobPilot URL —
   defaults to `http://localhost:3000`, or switch to the deployed
   `https://jobpilot-tan-chi.vercel.app`), and click **Connect**.
5. On any page with a form, open the popup and click **Detect fields on this page** (and
   **Detect questions on this page** for screening questions).

`extension/manifest.json`'s `host_permissions` already includes both
`http://localhost:3000/*` (local dev) and `https://jobpilot-tan-chi.vercel.app/*` (the
deployed instance), so no manifest edit is needed to switch between them — just pick the
matching URL in the popup. Pointing the extension at a *different* deployed origin would
still require adding that origin to `host_permissions`.

### Supported form behavior

Field detection is heuristic (label/`name`/`id`/`placeholder`/`aria-label` text matching),
form-first, and works on typical HTML forms — it is not a per-site integration and does
not target LinkedIn/Indeed/Greenhouse/Lever specifically. Browsers block extensions from
programmatically attaching a file to a `<input type="file">` element (a platform security
restriction, not a shortcut taken here) — resume/cover-letter uploads are flagged with a
reminder to attach the file yourself instead of a fake "insert" action.

## Known limitations (Phase 4)

- Field/question detection is a best-effort heuristic, not a per-site integration — some
  forms (especially heavily componentized SPA forms with no accessible labels) may not be
  detected correctly.
- Resume/cover-letter file inputs can never be filled by the extension — this is a browser
  platform restriction on all extensions, not specific to JobPilot.
- Screening-question evidence detection reuses the ATS engine's skill dictionary
  (`lib/ats/skills.ts`); it can only recognize evidence for skills in that dictionary, not
  arbitrary claims a resume makes.
- The extension's `host_permissions` covers `http://localhost:3000` and the deployed
  `https://jobpilot-tan-chi.vercel.app` out of the box; pointing it at any *other* deployed
  origin still requires editing `extension/manifest.json`.
- No job-board scraping or per-board integrations are implemented, by design — see [Job
  Source Support](#job-source-support).
- There's no server-side rate limiting on the extension's API routes (by design — no paid
  rate-limiting SaaS), matching the same posture as the rest of the app.

## Manual test checklist (Phase 4)

`npm run lint` and `npm run build` are automated and pass. The following requires a real
Supabase project with migrations `0005`/`0006` applied and a Chrome browser, so it's a
manual checklist rather than an automated test suite:

1. Apply `0005_jobs_applications.sql` and `0006_extension_tokens.sql` in Supabase.
2. `/dashboard/jobs` — save a job by pasting title/company/URL/etc.
3. Edit that job's details and confirm the change is saved.
4. Click "Analyze Job" — confirm it opens the ATS Analyzer pre-filled with that job's
   title/description and returns a deterministic score.
5. Click "Start Application," pick a resume and a version, confirm the version's stored
   ATS score is displayed, optionally pick a cover letter, click "Prepare Application."
6. Confirm a new `applications` row appears at `/dashboard/applications` with status
   "Preparing," and that repeating step 5 for the same job does **not** create a duplicate.
7. On `/dashboard/applications`, confirm the metrics row (Total/Applied/Interviews/Offers
   /Rejected) matches the board's contents.
8. Drag-free status change: use the status menu on a card to move it through several
   columns; confirm it moves and the count updates.
9. Open an application's detail page; confirm all fields, and the linked resume/version
   /cover letter names, are shown correctly.
10. Edit notes and a follow-up date on an application; confirm they persist after reload.
11. Delete an application; confirm it disappears from the board.
12. `/dashboard/documents` — confirm your resumes, resume versions, and cover letters each
    appear under their own section.
13. Open (view/download) an original resume file; confirm the signed URL works and expires
    (i.e., isn't a permanent public link).
14. Delete a resume version and a cover letter from the Document Hub; confirm they're gone
    and that deleting still goes through the existing Phase 2/3 delete actions (no new
    duplicate delete logic).
15. Open the Apply Assistant for a "Preparing" application; confirm the "Review everything
    before submitting" copy is visible, "Open Application" opens the job URL in a new tab,
    and clicking "I submitted this application" moves the application to "Applied" with
    `applied_at` set — and that simply opening the page never does this by itself.
16. `chrome://extensions` → Load unpacked → select `/extension`; confirm it loads with no
    manifest errors and requests only `storage`/`activeTab`/`scripting` permissions.
17. In Settings → Extension, generate a token, paste it into the popup, and confirm
    "Connect" succeeds and shows your profile name/email.
18. On any page with a form (e.g. a plain HTML form or a test page), click "Detect fields
    on this page"; confirm detected fields show your profile values pre-filled but
    editable, and that nothing changes on the page until you click "Insert" on a specific
    field.
19. Click "Detect questions on this page" on a page with a question-like prompt; confirm a
    suggestion appears with either matched evidence or an honest "cannot confidently
    answer" / "insufficient evidence" message — and that no answer is ever inserted or
    submitted automatically.
20. In the popup, load tracked applications, pick one, and click "I submitted this
    application" (two-step confirm); confirm the corresponding application's status flips
    to "Applied" in `/dashboard/applications` and that revoking the token in Settings
    immediately breaks further extension requests (401/expired).

## Job Source Support

Phase 4 is intentionally **form-first and generic**: you paste job details in yourself,
and the extension detects generic HTML form fields on whatever page you're on. There is
no LinkedIn/Indeed scraper, no site-specific parser, no anti-bot bypass, no CAPTCHA
solving, and no credential harvesting anywhere in this codebase — implementing any of
those was explicitly out of scope for Phase 4.

## Interview Prep & Mock Interview (Phase 5)

`/dashboard/interview-prep` — one unified feature covering both "Interview Prep"
(question generation + written feedback) and "Mock Interview" (the same session, run as a
live Start → Question → Answer → Feedback → Next → Final score flow). They were built as
a single system rather than two, since a mock interview *is* an interview-prep session run
end-to-end.

- **Setup:** pick a mode (Behavioral, Technical, or Mixed), a resume/version to ground
  questions in (required for Technical/Mixed, optional for Behavioral), an optional saved
  job to prefill title/company/JD, and how many questions to generate (3–12).
- **Grounding:** technical questions are generated only from skills actually detected in
  your resume text (via the same dictionary matcher the ATS Analyzer uses,
  `lib/ats/skills.ts`) and the job description you supplied — the prompt explicitly
  forbids inventing technologies, projects, or experience you didn't provide. Each
  question records what it was grounded in (shown as chips in the UI).
- **Session flow:** answer one question at a time in any order, submit an answer to get
  AI feedback (relevance/clarity/structure/specificity/confidence/what's-missing, plus a
  0–100 score), revisit and re-submit any question, then "Finish" to get a final score and
  a summary (strengths/weaknesses/improvement suggestions). The **final score is never an
  AI claim** — it's deterministically computed server-side as the average of your
  per-answer AI scores, the same "never trust the AI's own score claims" pattern the ATS
  Analyzer and Resume Optimizer already use.
- **Grounding snapshot:** a session stores the resume text and detected skills it was
  generated from at creation time (`interview_sessions.resume_snapshot` /
  `detected_skills`), so editing or deleting the source resume/version later never changes
  what a past session's questions were actually grounded in.
- **History:** `/dashboard/interview-prep/history` lists past sessions (with their score
  or "In progress") and lets you reopen a completed session as a read-only summary, or
  resume an in-progress one where you left off.
- RLS owner-only on `interview_sessions`, `interview_questions`, and `interview_answers`
  (migration `0007`).

## Analytics (Phase 5)

`/dashboard/analytics` — real metrics derived live from your own data, computed entirely
in Next.js/Supabase (no Grafana, no analytics SaaS, no redundant storage of numbers that
already exist elsewhere):

- Applications-over-time (30-day daily chart), status distribution across all 8
  application statuses, ATS score trend (last 20 analyses), an Applied → Interview →
  Offer conversion chart, and a 6-stage application funnel (Saved → Preparing → Applied →
  Screening → Interview → Offer) — plus summary tiles (average ATS score, average
  interview score, rejection rate, total applications, etc).
- Every number is computed fresh from the `applications`, `job_analyses`,
  `resume_versions`, `cover_letters`, and `interview_sessions` tables on each page load —
  nothing is pre-aggregated or cached in a new table.
- **No fake numbers, ever.** If you haven't used JobPilot yet, the page shows an honest
  empty state instead of a dashboard full of zeros. Metrics that would otherwise be
  misleading at zero (average ATS score, average interview score) render as "—" rather
  than `0` when there's no underlying data — a `0` there would look like a real, bad
  score, so it's `null` in the data layer and rendered as an explicit "no data" instead.
- Chart colors use five new design-system tokens (`--chart-1`…`--chart-5` in
  `app/globals.css`, mapped to the existing primary/success/warning/destructive palette
  plus one new tone) so Analytics stays visually consistent in both light and dark mode.

## Career Assistant (Phase 5)

`/dashboard/career-assistant` — an AI copilot chat scoped entirely to your own JobPilot
data, using the same Groq provider abstraction as every other AI feature:

- Each message is answered with a context summary built fresh, server-side, from your own
  profile, resume/version/cover-letter/job counts, your last 5 ATS analyses, your last 15
  applications, and your last 5 interview sessions (`services/career-assistant-service.ts`
  → `buildContextSummary()`) — never your raw resume text or raw job description text, to
  keep what's sent to the AI provider minimal.
- The prompt explicitly instructs the model to distinguish stated facts from suggestions,
  and to never invent an application status, a skill, an experience, or a job detail that
  isn't actually in the context it was given.
- Conversations are threaded (`career_assistant_sessions` + `career_assistant_messages`),
  auto-titled from your first message, and only the last 10 prior messages in a thread are
  sent back to the model as history (`MAX_HISTORY_MESSAGES = 10`) to keep context bounded.
- RLS owner-only on both tables (migration `0008`).

## Known limitations (Phase 3)

- Downloads are plain `.txt` only — there is no PDF/DOCX generation. This is intentional:
  the spec explicitly forbids paid document-generation services and false fidelity
  claims, so we don't pretend to produce a formatted document we can't.
- Only one AI provider (Groq) is implemented. `AI_PROVIDER=groq` is the only supported
  value today.
- AI optimization output is only as good as the source resume text — resumes that failed
  text extraction (scanned images, password-protected PDFs) can't be optimized until
  re-uploaded as a text-based file.
- There's no server-side rate limiting service (by design — no paid rate-limiting SaaS).
  Abuse is mitigated with disabled/debounced submit buttons and server-side length limits
  only.

## Known limitations (Phase 5)

- Interview question quality depends on the source resume's text extraction having
  succeeded — a scanned/image-only or password-protected resume produces the same weak
  grounding it would for the Resume Optimizer.
- Behavioral-only sessions don't require a resume, so their questions are generic
  (not grounded in your specific background) unless you pick one anyway.
- Analytics has nothing to show until you've used at least one other feature (ATS
  Analyzer, applications, resume versions, cover letters, or interview sessions) — this is
  intentional (see [Analytics](#analytics-phase-5)), not a bug.
- The Career Assistant's context summary is deliberately condensed (last 5 analyses, last
  15 applications, last 5 interview sessions) to keep prompts small and cheap — very old
  history outside those windows won't be visible to it in a given answer.
- Only one AI provider (Groq) is implemented for Interview Prep and Career Assistant too,
  same as Phase 3.

## Manual test checklist (Phase 5)

21. Apply `0007_interview_prep.sql` and `0008_career_assistant.sql` in Supabase.
22. `/dashboard/interview-prep` — start a Behavioral session with no resume selected;
    confirm it starts successfully with generic (non-resume-grounded) questions.
23. Start a Technical or Mixed session with a resume and a job description; confirm each
    question shows "grounded in" chips that match skills actually present in that resume.
24. Answer a question, submit it, and confirm feedback (6 sub-scores + summary + score)
    appears; re-submit the same question and confirm the feedback updates.
25. Navigate between questions with Previous/Next and the numbered pill navigator; confirm
    the draft textarea always shows the correct answer for whichever question is shown.
26. Click "Finish interview & get final score"; confirm the final score equals the average
    of your per-answer scores (not a number the AI invented independently), and that
    strengths/weaknesses/suggestions appear.
27. `/dashboard/interview-prep/history` — confirm the completed session appears with its
    score, and an in-progress session (if any) shows "In progress"; delete a session and
    confirm it's removed.
28. `/dashboard/analytics` — with no data yet (a brand-new account), confirm an honest
    empty state is shown, not zeroed-out charts.
29. After using the ATS Analyzer, Application Tracker, and Interview Prep at least once,
    reload `/dashboard/analytics` and confirm every tile/chart reflects real counts that
    match what you'd see on those features' own pages.
30. `/dashboard/career-assistant` — start a new conversation, ask a question about your
    own data (e.g. "how many applications do I have in Interview stage?"), and confirm the
    answer matches what's actually on `/dashboard/applications`.
31. Ask the Career Assistant something outside your data (e.g. about a job/skill you've
    never entered); confirm it does not fabricate an answer and instead says it doesn't
    have that information.
32. Start a second conversation, confirm both appear in the session list, and delete one;
    confirm it's removed and the other is unaffected.
33. Confirm all three of Interview Prep, Analytics, and Career Assistant now show as
    active (not "Coming Soon") in the sidebar, and that the main `/dashboard` stat tiles
    and recent-activity list reflect real data.

## Authentication

Implemented with Supabase Auth (email/password only — no third-party OAuth):

- Signup with email verification
- Login with persistent sessions
- Forgot/reset password
- Logout
- Protected routes (`/dashboard/**`) enforced in `middleware.ts`

## Security notes

- Row Level Security is enabled on every table (`profiles`, `resumes`, `job_analyses`,
  `resume_versions`, `cover_letters`, `jobs`, `applications`, `extension_tokens`,
  `interview_sessions`, `interview_questions`, `interview_answers`,
  `career_assistant_sessions`, `career_assistant_messages`); users can only
  read/insert/update/delete their own rows.
- Every new Phase 5 service function also explicitly filters by `.eq("user_id", userId)`
  in addition to relying on RLS — defense in depth, same posture as the extension API
  routes.
- The Supabase **service role key is only used** for the Chrome extension's API routes
  (`app/api/extension/*`, via `lib/supabase/service.ts`) — nowhere else in the app. It is
  read server-side only, is never sent to the browser or bundled into the extension, and
  every extension route still explicitly filters by the authenticated user's id rather
  than relying solely on RLS (which the service-role client bypasses).
- Avatar and resume uploads are scoped per-user via Storage RLS policies.
- Every Server Action and extension API route re-verifies resource ownership server-side
  before reading or writing — a browser- or extension-supplied resume/version/analysis
  /letter/job/application id can never be used to access another user's data, even though
  RLS already enforces this at the database layer too (defense in depth).
- The `AI_API_KEY` is read only in `lib/ai/provider.ts` (server-side) and is never sent
  to the browser or logged.
- Extension pairing tokens (`extension_tokens`) are stored **hashed only** (SHA-256); the
  raw token is shown exactly once at generation time and can't be recovered afterward.
  Revoking one is a hard delete (no RLS `update` policy exists on that table).
- The extension itself requests no permission beyond `storage`, `activeTab`, `scripting`,
  and host access to the JobPilot API origin — it declares no `content_scripts`, so it
  never runs on a page unless you open its popup and click a detect button.

## License

Private project — all rights reserved.
