# JobPilot AI

**Your AI-powered career copilot.**

Optimize your resume, improve ATS compatibility, organize applications, and prepare for
interviews — all in one place.

> **Phase 1 scope:** this repository currently implements the project foundation —
> authentication, the landing page, the dashboard shell, and the database foundation.
> AI-powered features (ATS scoring, resume optimization, cover letters, job scraping,
> interview AI, analytics, etc.) are intentionally **not** implemented yet and are
> represented in the UI as "Coming in a future phase."

Built to run entirely on **free tiers**: Next.js + Vercel + Supabase.

---

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Framer Motion, Lucide icons
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
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

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public API key |

Both values are found in your Supabase project at **Project Settings → API**.

Never commit `.env.local` — it's already covered by `.gitignore`. The anon key is safe
to expose in the browser; real access control is enforced server-side by the Row Level
Security (RLS) policies defined in the migrations below. The **service role key is never
used or exposed** anywhere in this app.

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
3. Add the two environment variables from `.env.example` in the Vercel project
   settings (**Settings → Environment Variables**).
4. Deploy. Vercel's free (Hobby) tier is sufficient.
5. Back in Supabase, add your deployed URL's callback route (e.g.
   `https://your-app.vercel.app/auth/callback`) to **Authentication → URL
   Configuration → Redirect URLs**.

## Project structure

```
app/                  Routes (App Router)
  (auth)/              login, signup, forgot-password, reset-password
  auth/callback/       Supabase email link handler (route handler)
  dashboard/           Protected app shell + pages
components/
  ui/                  shadcn/ui primitives
  landing/             Marketing page sections
  auth/                Auth forms
  dashboard/           Sidebar, topbar, dashboard widgets
  shared/              Logo, theme provider/toggle, footer badge
lib/
  supabase/            Browser/server/middleware Supabase clients
  validations/         Zod schemas
services/              Data-access functions (profile CRUD, avatar upload)
types/                 Shared TypeScript types, including the database schema
supabase/migrations/   SQL migrations
middleware.ts           Route protection + session refresh
```

## Authentication

Implemented with Supabase Auth (email/password only — no third-party OAuth):

- Signup with email verification
- Login with persistent sessions
- Forgot/reset password
- Logout
- Protected routes (`/dashboard/**`) enforced in `middleware.ts`

## Security notes

- Row Level Security is enabled on `profiles`; users can only read/insert/update their
  own row.
- The Supabase **service role key is never used**.
- Avatar uploads are scoped per-user via Storage RLS policies.

## License

Private project — all rights reserved.
