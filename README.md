# Company Brain

> Turn scattered company knowledge (docs, Slack, helpdesk tickets) into versioned,
> human-approved, always-current **SKILL.md** files (and a hosted **MCP** endpoint) so
> the AI agents you already use answer correctly — instead of hallucinating.

Wedge: **Customer Support / CS teams at 20–200-person companies.** Self-serve, USD pricing.
Master plan: [`../COMPANY-BRAIN-EXECUTION-PLAN.md`](../COMPANY-BRAIN-EXECUTION-PLAN.md) ·
Founder runbooks: [`docs/`](docs/).

---

## The core loop (built & working)

```
INGEST (public help center)
  → EXTRACT (LLM drafts procedure-shaped SKILL.md, sources cited)
  → HUMAN APPROVES (review / edit / version)        ← the moat & trust feature
  → PUBLISH (download SKILL.md  +  hosted per-org MCP endpoint)
  → KEEP CURRENT (source changed → skill flagged stale → re-approve)
```

Everything above runs **locally today** using a public help center as the (no-auth)
ingestion source. OAuth connectors (Slack, Google Drive, Notion, Intercom/Zendesk)
and cloud deploy come once Phase-0 accounts exist.

## Run it

```bash
npm install
cp .env.example .env          # paste a free GEMINI_API_KEY (https://aistudio.google.com/apikey)
```

**Dashboard (the product):**
```bash
npm run dev                   # http://localhost:3000  → Connect → review/approve → Publish
```

**MCP server (so an agent can use approved skills):**
```bash
npm run mcp                   # serves http://localhost:8787/mcp/<org-token>
npm run mcp:test              # connects a real MCP client and round-trips it
```

**Control CLI (drive the loop headlessly / for testing):**
```bash
npm run cb -- ingest https://support.acme.com/hc/en-us --max 8
npm run cb -- list
npm run cb -- approve <skillId>
npm run cb -- publish
npm run cb -- stale
npm run cb -- org             # show MCP endpoint + token
```

**Outreach skill-audit (sales hook — emails a prospect skills from their help center):**
```bash
npm run audit -- https://help.prospect.com --dry-run    # crawl + preview, no key needed
npm run audit -- https://help.prospect.com              # generates ./out/<host>/.../SKILL.md
```

`npm run typecheck` runs the TypeScript checker. `npm run build` builds the app.

## Architecture

```
src/
  lib/
    crawl.ts      polite help-center crawler (sitemap + English-article ranking, HTML→md)
    extract.ts    corpus → procedure-shaped SKILL.md drafts (the core IP)
    llm.ts        provider-agnostic LLM transport (free Gemini default; Claude later)
    skillmd.ts    SKILL.md serialization (Agent Skill format)
    store.ts      domain + persistence — SkillStore interface + FileStore (.data/db.json)
    publish.ts    export approved skills → SKILL.md files + skills.json
  app/            Next.js (App Router) dashboard — server-rendered, server actions
  mcp/            hosted MCP server (Streamable HTTP, per-org token auth) + test client
  cli/            audit (outreach) + cb (control)
docs/             founder runbooks (Phase 0, validation sprint, outreach, metrics)
data/             hot-list-100.csv prospect tracker
```

**Storage seam:** the app talks only to the `SkillStore` interface (`src/lib/store.ts`).
`FileStore` is the dev backend (one JSON file). A `SupabaseStore` (Postgres + pgvector)
drops in for production with no caller changes — that's the planned §4.6 stack.

## LLM provider (free)

Extraction runs on any **OpenAI-compatible** provider, selected by env (see
[`.env.example`](.env.example)). Default = **Google Gemini** free tier (your own key, no
card). Alternatives: **Groq**, **OpenRouter** — change the env vars only, no code change.
We do **not** use shared-key proxy services — they're unreliable and would route customer
data through an anonymous third party, breaking the product's privacy promise.

## ⚠ Windows / OneDrive

This repo currently lives under OneDrive. `node_modules`, `.next`, and `.data` are
gitignored, but OneDrive still syncs `.next`/build files slowly. For smoother dev, consider
relocating to e.g. `C:\dev\company-brain` (see [`docs/PHASE-0-RUNBOOK.md`](docs/PHASE-0-RUNBOOK.md)).

## Status

Core loop + MCP + dashboard built and tested locally. **Business validation gate still
applies:** the plan says don't scale the build until ≥5 of 15 discovery calls say they'd
pay. This working product makes those calls far more convincing — demo it live.
