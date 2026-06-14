# Phase 0 Runbook — Human-Only Account & Legal Setup

**Owner:** You (solo founder, India). **An AI cannot create these accounts, sign legal docs, or pass KYC for you.** This is your TODO list.

**Date written:** 2026-06-12. **Re-verify any item marked 🕐 if you start this >2 months from now (i.e. after ~2026-08-12)** — pricing, free tiers, payout rules, and OAuth review processes change.

**How to use this:** Do it top-to-bottom in two sittings. **Session A (build accounts, ~2 hrs)** = all the SaaS/dev accounts. **Session B (legal/billing, ~half a day + waiting)** = company, bank, MoR. You can start coding after Session A; legal/billing can finish in the background.

**Total cash to first customers:** ~$50–250/mo (see budget table at the bottom). Most tools are free at your scale (the LLM runs on Gemini's free tier in v1); the real spend is domain + your CA.

---

## 0. Pre-flight: Windows / OneDrive fix (do this FIRST — 10 min) 🟥

Your repo currently lives at `C:\Users\gorakh\OneDrive\Desktop\Dreamm`. **OneDrive will try to sync `node_modules` (50k+ tiny files) and will choke** — slow installs, file locks, "file in use" errors, and corrupted builds. Fix before you `npm install` anything.

**Recommended: relocate the repo out of OneDrive entirely.**

```powershell
# Make a dev folder outside OneDrive and move the project there
New-Item -ItemType Directory -Force C:\dev
Move-Item "C:\Users\gorakh\OneDrive\Desktop\Dreamm" C:\dev\company-brain
# From now on, work in C:\dev\company-brain
```

**Alternative (if you must keep it in OneDrive):** right-click the repo folder in File Explorer → **"Free up space"** is wrong — instead, exclude it from sync: OneDrive tray icon → Settings → Sync and backup → **Manage backup / Choose folders** and untick the project, OR add a `.gitignore` that excludes `node_modules` AND set the folder to "Always keep on this device" but never let `node_modules` be created inside the synced tree. Relocating is cleaner — do that.

- [ ] Repo lives at `C:\dev\company-brain` (or OneDrive sync excludes `node_modules`)

---

## 1. Domain name (15 min, ~$10–60/yr) 🕐

Pick something brandable. Buy the `.com` if you can; a clean `.ai` is fine and on-brand for this product (note: `.ai` renews ~$60–90/yr, more than `.com`).

- **Registrar:** [Cloudflare Registrar](https://dash.cloudflare.com) (at-cost pricing, no upsells — best value) or [Namecheap](https://www.namecheap.com).
- Avoid GoDaddy (aggressive upsells, higher renewals).
- Buy the matching `.com` even if you lead with `.ai`, to protect the brand and for email.

**Steps:**
1. Brainstorm 5 names. Check availability + that the matching X/LinkedIn handle is free.
2. Register the domain. Enable auto-renew and WHOIS privacy (free on Cloudflare/Namecheap).
3. Set up email forwarding now (`you@yourdomain.com` → your Gmail) — you'll need a branded address for every signup below. Cloudflare Email Routing is free.

- [ ] Domain purchased, auto-renew on, branded email forwarding live

---

## 2. GitHub account + private repo (15 min, free) 🕐

- Sign up / log in: [https://github.com](https://github.com)
- Create a **private** repo named `company-brain`.
- Turn on 2FA (Settings → Password and authentication) — required and protects your IP.
- Locally connect it:

```powershell
cd C:\dev\company-brain
git init
git remote add origin https://github.com/<your-username>/company-brain.git
```

- Add a `.gitignore` that excludes `node_modules`, `.env*`, `.next`, `dist`.
- **Never commit secrets.** All API keys go in `.env.local` (gitignored) and in Vercel/host env vars.

- [ ] Private repo created, 2FA on, `.gitignore` excludes secrets + `node_modules`

---

## 3. Vercel (10 min, free Hobby tier) 🕐

Hosting for the Next.js app + dashboard.

- Sign up with your **GitHub** account: [https://vercel.com/signup](https://vercel.com/signup)
- Import the `company-brain` repo (you can do this once there's code; creating the account now is enough).
- Free **Hobby** tier is fine until you have paying customers; upgrade to **Pro (~$20/mo)** only when you need custom domains on prod + higher limits / commercial use.
- Note: Vercel Hobby is technically non-commercial. Move to Pro before you take real customer traffic.

- [ ] Vercel account linked to GitHub

---

## 4. Supabase — Postgres + pgvector (20 min, free tier) 🕐

This is your database, auth, and vector store (for embeddings/RAG over the docs you ingest).

- Sign up: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Create a new project. **Pick a region close to your customers (US East / `us-east-1`)**, not India — your buyers are global/US, and Vercel functions default to US.
- Save the DB password in your password manager immediately.
- **Enable pgvector:** Dashboard → **Database → Extensions** → search `vector` → enable. Or run in the SQL editor:

```sql
create extension if not exists vector;
```

- Grab your keys: Project Settings → **API** → copy `Project URL`, `anon` key, and `service_role` key (service_role is secret — server-side only).
- Free tier = 500 MB DB + 1 GB file storage; enough for design partners. Pro is ~$25/mo when you outgrow it. Note free projects pause after ~1 week of inactivity — keep it warm or upgrade once you have users.

- [ ] Supabase project created (US region), pgvector enabled, keys saved

---

## 5. LLM API key — Google Gemini free tier (5 min, free) 🕐

The LLM that generates and maintains the SKILL.md files. **v1 uses Gemini's free tier — $0, no credit card.**

- Get a key: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key**.
- Put it in `company-brain/.env` as `GEMINI_API_KEY=...` (the repo's `.env.example` shows the format). Keep a copy in your password manager.
- That's the only key the product needs to generate skills. Any OpenAI-compatible provider (Groq, OpenRouter) also works by changing env vars — see `.env.example`.
- 🕐 *Free-tier limits/model ids change; if extraction errors with "model not found", pick a current model in AI Studio and set `CB_LLM_MODEL`.*

- [ ] `GEMINI_API_KEY` created + saved in `.env` and your password manager

---

## 6. Background jobs — Inngest **or** Trigger.dev (15 min, free) 🕐

You need durable background jobs for ingestion (pull docs/Slack/tickets), embedding, and scheduled re-sync. **Pick ONE.**

- **Inngest** ([https://www.inngest.com](https://www.inngest.com)) — event-driven, great Vercel/serverless fit, generous free tier. **Recommended default for a serverless Next.js app.**
- **Trigger.dev** ([https://trigger.dev](https://trigger.dev)) — long-running tasks, good if jobs run many minutes (heavy backfills).

For Company Brain's short, event-driven syncs, **start with Inngest.**

- [ ] One job runner account created (Inngest recommended)

---

## 7. Slack developer app — READ-ONLY (20 min, free) 🕐

To ingest Slack threads into the brain. Read-only at this stage.

- Go to [https://api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**.
- Name it, attach to your own test workspace (create a free Slack workspace if you don't have one to test against).
- **OAuth & Permissions → Bot Token Scopes — request READ-ONLY only:**
  - `channels:history`, `channels:read`
  - `groups:history`, `groups:read` (private channels)
  - `users:read`
  - (optionally `files:read` if you'll ingest shared files)
  - **Do NOT** add any `:write` or `chat:write` scopes — you only read.
- Install to your test workspace, copy the **Bot User OAuth Token** (`xoxb-…`) into `.env.local`.
- Note the Signing Secret for verifying events later.

- [ ] Slack app created, read-only scopes, bot token saved

---

## 8. Google Cloud project — Drive API + OAuth consent (30 min, free) 🕐

To ingest Google Docs/Drive. The OAuth consent screen is the fiddly part.

- Console: [https://console.cloud.google.com](https://console.cloud.google.com) → create project `company-brain`.
- **APIs & Services → Library → enable "Google Drive API"** (and "Google Docs API" if you'll parse doc structure).
- **APIs & Services → OAuth consent screen:**
  - User type: **External**. Publishing status starts as **Testing** — fine for now; add your own + design-partner emails as **Test users** (up to 100).
  - Request **read-only** scopes: `drive.readonly` (or the narrower `drive.file` if you only touch files the user explicitly picks — narrower = easier approval later).
- **Credentials → Create Credentials → OAuth client ID → Web application.** Add your redirect URIs (localhost for dev + your Vercel URL later). Save the **Client ID + Client Secret** to `.env.local`.
- 🕐 *Google's verification process changes; `drive.readonly` is a "sensitive/restricted" scope. You can stay in Testing mode with design partners for months; **defer the full Google security review/verification until you're scaling past ~100 users** (it can take weeks and may need a pentest for restricted scopes). Note this as a future task.*

- [ ] GCP project + Drive API enabled, OAuth consent (Testing) + read-only scopes, client ID/secret saved

---

## 9. Notion integration token (10 min, free) 🕐

To ingest Notion docs.

- Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration** → internal.
- Capabilities: **Read content only** (untick insert/update). 
- Copy the **Internal Integration Secret** into `.env.local`.
- In a test Notion workspace, share a page/database with the integration so it has something to read.
- (For multi-customer use later you'll build a **public** OAuth integration; an internal token is fine to start and test.)

- [ ] Notion integration created (read-only), token saved, test page shared with it

---

## 10. Support tool dev/test account — Intercom **OR** Zendesk (20 min, free trial) 🕐

Your wedge is Support/CS, so you ingest tickets/macros. **Pick ONE to build against first.**

- **Intercom Developer Hub:** [https://developers.intercom.com](https://developers.intercom.com) — modern API, popular with the SaaS/D2C companies in your ICP. **Recommended first integration.**
- **Zendesk:** [https://www.zendesk.com/register](https://www.zendesk.com/register) — request a free developer/sandbox account; bigger in mid-market/enterprise.

Choose based on what your first 3 target design partners actually use. If unknown, **start with Intercom** (matches 20–200-employee SaaS/D2C). Create the dev account, request **read** scopes for conversations/tickets, save credentials.

- [ ] One support-tool dev account created (Intercom recommended), read scopes, creds saved

---

## 11. PostHog — product analytics (15 min, free tier) 🕐

To measure activation/usage in your app from day one.

- Sign up: [https://posthog.com](https://posthog.com) → **EU or US cloud** (pick US to match your buyers; pick EU if you want data residency for EU customers — US is fine to start).
- Create project, copy the **Project API key** into `.env.local`.
- Generous free tier (1M events/mo). Add the snippet/SDK when you build the app.

- [ ] PostHog project created, API key saved

---

## 12. Loom — async demos (10 min, free) 🕐

For founder-led sales: record 2–4 min personalized demos to send in outreach.

- Sign up: [https://www.loom.com](https://www.loom.com) (free tier = up to 25 videos, 5 min each — enough to start).
- Install the desktop/Chrome recorder. Do one test recording.

- [ ] Loom account + recorder installed, one test video made

---

## 13. Cal.com — booking link (15 min, free) 🕐

So prospects in your US (6:30–10:30pm IST) and EU (1:30–5:30pm IST) windows can self-book.

- Sign up: [https://cal.com](https://cal.com) (free tier covers a solo founder).
- Set your **timezone to IST** but create event types with availability that maps to your call windows:
  - **"US demo" event** open ~9am–1pm ET (= 6:30–10:30pm IST).
  - **"EU demo" event** open ~9am–1pm CET (= 1:30–5:30pm IST).
- Connect Google Calendar to avoid double-booking. Grab your booking link (`cal.com/yourname`) for outreach + LinkedIn.

- [ ] Cal.com link live with US + EU windows mapped to your call times

---

## 14. LinkedIn polish (30 min, free) 🕐

Founder-led B2B selling runs through LinkedIn.

- Update headline to outcome-focused, e.g. *"Helping 20–200-person support teams stop AI hallucinations — versioned, human-approved SKILL.md from your own docs."*
- Add the company (you can create a LinkedIn **Company Page** once the brand/domain is set).
- About section: the one-liner + who it's for + your Cal.com link.
- Set "Open to / building" and start following your ICP (Heads of Support/CS at target companies).

- [ ] Profile headline + about updated, Cal.com link added, company page created

---

## 15. Billing — Dodo Payments (Merchant of Record) (1–2 hrs to onboard) 🕐 🟦

### Why a Merchant of Record (MoR) — read this once
A normal payment gateway (Stripe/Razorpay) makes **you** the seller of record. That means **you** are legally responsible for collecting and remitting **VAT/GST/sales tax in every country your customers are in** — 100+ jurisdictions, each with its own registration and filing. As a solo India founder selling globally, that is impossible to manage.

**A Merchant of Record becomes the legal reseller.** Dodo (the MoR) sells to your customer, **calculates, collects, and remits VAT/GST/US sales tax in 100+ countries for you**, handles chargebacks/fraud/refunds, and then pays you a single consolidated payout. You **never register for foreign tax**. In India, this also simplifies your books: you're billing **one foreign entity (the MoR)** = a clean **export of services**, which keeps your **LUT/GST returns simple**. This is the single biggest reason to use an MoR over a raw gateway.

**Charge in USD.** Your pricing is Starter $99 / Growth $399 / Scale $999+ — set all plans in **USD**; the MoR handles local currency display + FX.

### Set up Dodo Payments
- **Why Dodo:** India-based MoR, built for Indian founders selling SaaS globally, fast onboarding (founders report **going live in ~2–3 hours**; bank-detail review ~1–2 working days), USD payouts to your Indian bank.
- Sign up: [https://dodopayments.com](https://dodopayments.com)
- Onboard: select **based in India**, give basic business details (works even as sole proprietor to start), link your **Indian business bank account**.
- 🕐 **Verify current India payout rules + fees at signup** — reported fees are roughly **~4% + ~$0.40 up to ~5% + $0.50 per transaction** with surcharges for subscriptions/international cards; FX and payout cadence change. Confirm the live numbers and FIRA/FIRC documentation support (you'll want FIRA as proof of export earnings for your CA) before you commit.
- **Start integrating in TEST mode immediately** — you do NOT need to wait for verification to finish to build the checkout. Live payments switch on once verified.
- Create your three products/plans in USD; set **annual = 2 months free**; create a **50%-off-for-life coupon** for your first 5–8 design partners.

### Alternatives (if Dodo doesn't fit / for comparison)
- **Lemon Squeezy** ([https://www.lemonsqueezy.com](https://www.lemonsqueezy.com)) — established MoR, now owned by Stripe; great DX.
- **Polar** ([https://polar.sh](https://polar.sh)) — developer-first MoR, good for digital/SaaS.
Both are MoRs (same tax benefit). Dodo's edge is India-native onboarding + INR payouts; keep one alternative in your back pocket.

- [ ] Dodo account onboarded (or alternative), India payout rules + fees verified at signup 🕐, USD plans created (Starter/Growth/Scale), annual + 50%-for-life coupon set, test-mode checkout working

---

## 16. Legal — India company, recognition, banking (half-day active + waiting) 🟨

### 16a. Entity: Sole Proprietor now vs. Pvt Ltd
You have two speeds:

| Option | When to use | Time | Cost (approx) |
|---|---|---|---|
| **Sole proprietor** (operate under your name + GST/Udyam) | Only if you want to take first dollars in the very first weeks before incorporating | ~days | minimal |
| **Private Limited (Pvt Ltd)** ✅ recommended | The moment you're serious / before you have real revenue + customers | ~7–15 working days | ~₹8k–20k via a CA/online filer |

**Recommendation:** if you can absorb ~2 weeks, **incorporate a Pvt Ltd now** — it's cleaner for contracts, payouts, future funding, and limited liability. Sole prop is a stopgap only.

- Incorporate via a CA or an online service ([https://www.mca.gov.in](https://www.mca.gov.in) is the official portal; most founders use a filer like ClearTax / IndiaFilings / a local CA). You'll get **CIN, PAN, TAN**; then register **GST** (needed for export-of-services LUT) and **Udyam/MSME** (free, useful).

- [ ] Entity decided + filed (Pvt Ltd recommended); PAN/TAN/CIN received; GST + Udyam registered

### 16b. DPIIT Startup Recognition — Startup India (free, ~1–3 working days) 🕐
Apply once incorporated: [https://www.startupindia.gov.in](https://www.startupindia.gov.in) → register → apply for **DPIIT Recognition** (no government fee, often approved in 24h–3 days).

**What it unlocks:**
- **Section 80-IAC tax holiday** — 100% income-tax exemption for **3 consecutive years** out of your first 10 (requires a separate Inter-Ministerial Board application with an innovation narrative — worth it once profitable).
- **SISFS (Startup India Seed Fund Scheme)** eligibility — grants up to **₹20 lakh** (proof of concept) and convertible debt up to **₹50 lakh** (scaling) via approved incubators.
- **Self-certification under 9 labour/environment laws**, **IPR fast-track + fee rebates** (patents/trademarks), and **GeM** procurement access.
- 🕐 **Angel-tax note (changed!):** Section 56(2)(viib) ("angel tax") was **repealed for investments from 2025 onward**, so DPIIT is **no longer required specifically for angel-tax protection** — but it **remains essential** for the 80-IAC tax holiday and the other benefits above. Re-verify current rules with your CA before relying on any tax position.

- [ ] DPIIT recognition applied + certificate received

### 16c. Business bank account + bookkeeping (day 1) 🟦
- Open a **current account** in the company's name (any business-friendly bank; many founders use RazorpayX / a neobank layer for ease). You need this to receive Dodo payouts.
- **Engage a startup CA from day one** (~**₹2,000–5,000/mo**) for bookkeeping, GST/LUT filing, and to keep export-of-services documentation (FIRA/FIRC) clean. Doing this from the first transaction saves painful cleanup later.

- [ ] Business current account open; startup CA engaged (~₹2–5k/mo); bookkeeping started from first transaction

### 16d. DEFER — US Delaware C-Corp "flip"
Do **NOT** incorporate in Delaware now. The standard play is to operate as an India Pvt Ltd and **only flip to a Delaware C-Corp (with the Indian entity as a subsidiary) when an institutional fundraise / US VC round is imminent.** Flipping early adds cost, compliance, and tax complexity you don't need pre-revenue. Note it as a future milestone, not a Phase 0 task.

- [ ] Acknowledged: Delaware flip deferred until fundraising is imminent

---

## Budget summary — monthly burn to first customers

| Item | Tier to start | Approx monthly cost (USD) | Notes |
|---|---|---|---|
| Domain (.com/.ai) | annual | ~$1–8/mo amortized | .ai is pricier (~$60–90/yr) |
| GitHub | Free | $0 | private repos free |
| Vercel | Hobby → Pro | $0 (→ $20 when live) | Pro before real traffic |
| Supabase | Free → Pro | $0 (→ ~$25 when you outgrow) | US region |
| **LLM API (Gemini)** | free tier | **$0** | v1 runs on Gemini's free tier (own key) |
| Inngest / Trigger.dev | Free | $0 | one of them |
| Slack / Google / Notion / Intercom dev | Free / trial | $0 | dev/test tiers |
| PostHog | Free | $0 | 1M events/mo |
| Loom | Free | $0 | upgrade only if you need >5min |
| Cal.com | Free | $0 | |
| Dodo Payments (MoR) | pay-per-txn | $0 fixed (~4–5% + ~$0.40–0.50/txn) | only pay when you get paid |
| India CA / bookkeeping | retainer | **~$25–60** (₹2–5k) | from day 1 |
| Company incorporation | one-time | ~$100–250 one-time (not monthly) | Pvt Ltd filing |
| **Typical monthly total** | | **~$150–250 lean; up to ~$500 with heavier API + Vercel/Supabase Pro** | |

**One-time Phase 0 cash:** domain (~$10–90/yr) + incorporation (~₹8–20k) + initial API credits ($25–50). Comfortably under a few hundred dollars to be fully set up.

---

## ✅ You are DONE with Phase 0 when…

- [ ] Repo is at `C:\dev\company-brain` (out of OneDrive sync), pushed to a **private** GitHub repo with 2FA.
- [ ] Domain bought (auto-renew + branded email forwarding live).
- [ ] **Vercel** + **Supabase (pgvector enabled, US region)** projects exist; keys in `.env.local` + password manager.
- [ ] **Gemini** API key created (free tier) and saved in `.env`.
- [ ] **One** background-job account (Inngest recommended).
- [ ] Read-only integration credentials saved for **Slack**, **Google Drive (OAuth consent in Testing)**, **Notion**, and **one** support tool (Intercom recommended).
- [ ] **PostHog**, **Loom**, **Cal.com** (US + EU windows), and **LinkedIn** polished + booking link live.
- [ ] **Dodo Payments** (or alt MoR) onboarded, India payout rules verified, **USD** plans (Starter/Growth/Scale) created with annual + 50%-for-life coupon, **test-mode checkout working**.
- [ ] **India entity** filed (Pvt Ltd recommended); **GST + Udyam** done; **DPIIT recognition** certificate received.
- [ ] **Business current account** open; **startup CA engaged** and bookkeeping running.
- [ ] Delaware flip consciously **deferred**.
- [ ] Every secret is in env vars / a password manager — **nothing committed to git**.

When all boxes are ticked, you can build, ingest from at least one source, and **take a real USD payment** — Phase 0 is complete.

---

**Sources (verify the 🕐 items yourself before relying on them):**
- [Dodo Payments — Merchant of Record for Global SaaS](https://dodopayments.com/payments/merchant-of-record)
- [Dodo Payments — Get Paid in USD as a Developer in India](https://dodopayments.com/blogs/get-paid-usd-developer-india)
- [Dodo Payments — Pricing](https://dodopayments.com/pricing)
- [Dodo Payments — FAQ / onboarding](https://docs.dodopayments.com/miscellaneous/faq)
- [Startup India — DPIIT Recognition & Tax Exemption (official)](https://www.startupindia.gov.in/content/sih/en/startupgov/startup_recognition_page.html)
- [DPIIT Startup Recognition 2026 guide (angel-tax repeal, 80-IAC, SISFS)](https://treelife.in/taxation/tax-exemption-for-startups-in-india/)
- [Supabase Docs — pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [MCA — official company incorporation portal](https://www.mca.gov.in)
