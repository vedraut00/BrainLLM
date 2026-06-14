# Production Deployment — Plan & What I Need From You

Goal: take Company Brain from "runs locally on a JSON file" to a **deployed, multi-user SaaS** with a real database, login, and a public URL.

## Target production architecture (simple, one deployable app)
- **One Next.js app on Vercel** — landing + dashboard + the **MCP endpoint** (served as a Next route, so there's no separate server to host) + Gemini extraction (server actions / route handlers).
- **Supabase** — Postgres (+ pgvector later) for data, and **Supabase Auth** for login (email magic-link first; Google optional).
- **Gemini** free tier for extraction (already wired; your key).
- **Dodo Payments** (MoR) for billing — added after the core deploy works.

Local dev keeps using the file store (`CB_STORE=file`); production uses Supabase (`CB_STORE=supabase`). Same `SkillStore` interface — no rewrite.

---

## ✅ What I need from YOU (I can't create accounts as you)

### Tier 1 — required to deploy at all (~25 min total)
1. **GitHub** — a private repo for the code.
   - Create one at https://github.com/new named `company-brain` (private).
   - Paste me the repo URL. (I'll commit + push the code.)
2. **Supabase** — the database + auth.
   - Create a project at https://supabase.com/dashboard (pick a US region).
   - From **Project Settings → API**, paste me: **Project URL**, **anon public key**, **service_role key**.
   - I'll give you one SQL migration to paste into the Supabase SQL editor.
3. **Vercel** — hosting.
   - Sign up at https://vercel.com (log in with the GitHub above) — that's it. I'll handle the import + env config; you'll click "Deploy".
4. **Gemini key** — already have it (`GEMINI_API_KEY`); for production just confirm you're OK using the free tier to start (we can raise limits later).

> With Tier 1 you get a **live, multi-user product at a `…vercel.app` URL** that ingests help centers, lets users review/approve skills, and serves them over a hosted MCP endpoint.

### Tier 2 — to charge money + brand it (after Tier 1 works)
5. **Dodo Payments** (Merchant of Record) — https://dodopayments.com → API key + webhook secret. (I build checkout + the webhook that flips a plan.)
6. **Custom domain** — buy one (Cloudflare/Namecheap); add it in Vercel. (Until then the free `.vercel.app` URL works.)
7. **Google OAuth** (optional) — only if you want "Sign in with Google" in addition to email magic-link.

### Tier 3 — optional power-up
8. **Firecrawl** key (free tier, https://firecrawl.dev) — lets the audit/ingest read **JS-rendered** help centers (Intercom etc.), not just Zendesk-style ones. Big GTM win for the free-audit hook.

---

## What I'll build (no keys needed)
- [x] **MCP as a Next.js route** (`src/app/mcp/[token]/route.ts`) — whole app deploys as one Vercel service; verified end-to-end with a real MCP client. ✅ DONE 2026-06-14.
- [ ] **`SupabaseStore`** implementing `SkillStore` (same interface as `FileStore`) + a **SQL migration** for the schema (orgs, users, sources, documents, skills, skill_versions, staleness_flags).
- [ ] **Store selector** (`CB_STORE=file|supabase`) — local dev unchanged, prod uses Supabase.
- [ ] **Auth** (Supabase Auth: email magic-link) — login, session middleware, one org per user, per-user data isolation (RLS).
- [ ] **Billing** integration code (Dodo) — checkout + webhook → `org.plan` (wired when you add Tier 2 keys).
- [ ] **Vercel config** + production `.env` template + this runbook's deploy steps.

## Deploy steps (once you give Tier 1)
1. I push the code to your GitHub repo.
2. You run the SQL migration in Supabase (one paste).
3. I configure Vercel env vars (Supabase keys, `GEMINI_API_KEY`, `CB_STORE=supabase`, `CB_PUBLIC_MCP_BASE`).
4. You click Deploy in Vercel → live `…vercel.app` URL.
5. I smoke-test the live site end-to-end (sign up → ingest → approve → MCP).

## Run it locally in "production mode" (after SupabaseStore is built)
```
CB_STORE=supabase npm run build && CB_STORE=supabase npm run start
```
(Local dev stays on the file store: just `npm run dev`.)
