# VALIDATION SPRINT — Weeks 1–2 (Company Brain)

> **What this is:** The Weeks 1–2 playbook to validate the Customer Support / CS wedge BEFORE you heavy-build the product. Run it parallel to Phase 0 setup. It ends in a HARD go/no-go gate.
> **Sprint window:** Mon **2026-06-15** → Fri **2026-06-26** (10 working days).
> **Owner:** You (solo). All times in IST. US call window **6:30–10:30pm IST** (= 9am–1pm ET). EU window **1:30–5:30pm IST**. Mornings = build/sourcing.
> **Linked plan:** `COMPANY-BRAIN-EXECUTION-PLAN.md` §7.3 / §8.1. **This document is Phase 1.**

---

## 0. THE GOAL & THE GATE (read first — do not skip)

**Goal of these 2 weeks:** prove that real buyers will pay for the wedge — *before* you spend Weeks 3–6 building. No code-heavy product work past the existing `npm run audit` CLI until this gate passes.

### The numbers you are chasing
| Target | Number |
|---|---|
| Hot-list prospects sourced | **100** |
| Discovery calls **booked** | **15** |
| Discovery calls **completed** | **15** |
| Prospects who say "I'd pay **$99–399/mo**" | count them |

### 🚦 THE GATE (decide on Fri 2026-06-26)
```
IF  >= 5 of 15 completed calls say "I would pay $99–399/mo for this"
        -> GO. Advance to Phase 2 build sprint (plan §5).
ELSE
        -> NO-GO. Do NOT build. Revisit the wedge:
           - try a different DEPARTMENT (e.g. Ops, Sales enablement, IT helpdesk), OR
           - a different VERTICAL (e.g. fintech support, healthcare CS, dev-tools support),
           rebuild a fresh hot-list, and RE-RUN this exact sprint.
```

**Rules of the gate (enforce on yourself):**
- A "yes" only counts if it is an **unprompted or clean** answer to the price question (script in §4). "Sounds cool" ≠ yes. "Send me a contract / put me on the pilot at that price" = strong yes.
- You may NOT lower the bar to 4. You may NOT count "maybe."
- If you hit **5 yeses before call 15**, keep doing the remaining calls anyway — you need the design partners and the qualitative "what's missing" data.
- If you finish at **3–4 yeses**, that is a *soft signal* — do ONE re-run with a sharper sub-segment before abandoning the wedge entirely. **0–2 yeses = the wedge is wrong, change it.**

---

## 1. BUILD THE "HOT LIST OF 100"

**Ideal prospect:** Head of Support / Head of CS / Head of Ops — or a founder-operator — at a **20–200-person SaaS / D2C / agency** that has **recently launched or announced an AI support bot**.

**The trigger event you are hunting:** *"We deployed an AI support bot and it gives wrong answers."* Recency matters — someone who shipped an AI bot in the last 3–6 months is feeling the pain right now.

### 1.1 Sourcing tactics (work top-to-bottom; each should yield 15–30 names)

| # | Source | Exact tactic |
|---|---|---|
| 1 | **LinkedIn post search** | Search posts (Content filter), last 30–90 days, for: `"launched our AI support"`, `"AI agent for support"`, `"we rolled out Fin"`, `"Intercom Fin"`, `"Zendesk AI"`, `"AI chatbot"` + `"support"`, `"resolution rate"`, `"deflection"`. The PERSON who posted is your lead. Note who commented "how's accuracy?" — they're warm too. |
| 2 | **LinkedIn people search** | Title filters: `Head of Support`, `Head of Customer Success`, `Director of Support`, `Head of CX`, `Support Operations`, `Head of AI`. Company headcount filter **11–200**. Industry: Software / Consumer / Marketing & Advertising (agencies). |
| 3 | **Job ads** | Search LinkedIn Jobs / Wellfound / company careers pages for `"AI support"`, `"conversational AI"`, `"support automation"`, `"knowledge base manager"`, `"AI agent"`. A company hiring for this = actively investing = trigger present. Hiring manager / their boss = lead. |
| 4 | **Changelog / release-notes pages** | Google `site:<company>.com changelog "AI"` and scan `/changelog`, `/whats-new`, `/release-notes`. Companies that just shipped "AI answers" / "AI agent" / "ask AI" to their OWN customers feel the wrong-answer pain firsthand. |
| 5 | **Product Hunt** | Filter AI-support / chatbot / customer-service launches from the last 90 days. The maker (often founder-operator at a 20–200 co) is the lead; PH shows their profile + company. |
| 6 | **BuiltWith / Wappalyzer** | Detect companies running **Intercom / Zendesk / Gorgias / Front**. These already have a helpdesk = your connector surface + likely an AI add-on. Use BuiltWith "Relationships"/lists or the Wappalyzer browser extension on candidate sites. |
| 7 | **Communities (warm)** | Support Driven Slack, r/CustomerSuccess, r/SaaS, RevGenius, Lenny's Slack — people *complaining* about AI bot accuracy. Don't pitch in-channel; DM with the audit hook. |

### 1.2 Daily sourcing quota
- **20 net-new qualified rows/day, Days 1–5** → 100 by end of Week 1.
- A row is "qualified" only if you can fill `company`, `name`, `role`, AND at least one `ai_bot_evidence` link. No evidence = not on the list.

### 1.3 CSV columns — `company-brain/data/hot-list-100.csv`
Create the file with this exact header row (these are the canonical columns; the tracker, audit tool, and outreach all read from them):

```csv
id,company,website,help_center_url,headcount,segment,name,role,linkedin_url,email,ai_bot_evidence,helpdesk_detected,source_channel,audit_sent,audit_sent_date,outreach_sent,outreach_date,reply,call_booked,call_date,call_status,would_pay,price_reaction,owns_problem,whats_missing,pilot_interest,notes
```

| Column | Meaning / allowed values |
|---|---|
| `id` | 1–100 |
| `company` | Company name |
| `website` | Marketing site URL |
| `help_center_url` | Public help center / docs URL (the input to `npm run audit`) |
| `headcount` | Employee count (target 20–200) |
| `segment` | `saas` \| `d2c` \| `agency` |
| `name` | Prospect full name |
| `role` | Their title |
| `linkedin_url` | Profile URL |
| `email` | If found (Hunter/Apollo/guess + verify) |
| `ai_bot_evidence` | Link/quote proving the trigger (post, changelog, PH, job ad) |
| `helpdesk_detected` | `intercom` \| `zendesk` \| `gorgias` \| `front` \| `unknown` (from BuiltWith/Wappalyzer) |
| `source_channel` | Which §1.1 tactic found them (1–7) |
| `audit_sent` | `y`/`n` — did you run + email the free skill audit |
| `audit_sent_date` | Date |
| `outreach_sent` | `y`/`n` |
| `outreach_date` | Date |
| `reply` | `none` \| `pos` \| `neg` \| `ooo` |
| `call_booked` | `y`/`n` |
| `call_date` | Scheduled date/time (IST) |
| `call_status` | `booked` \| `done` \| `no_show` \| `rescheduled` |
| `would_pay` | `yes` \| `maybe` \| `no` (GATE input — only `yes` counts) |
| `price_reaction` | Free text — exact words on price |
| `owns_problem` | Who owns AI-bot accuracy at their co |
| `whats_missing` | What they said is missing |
| `pilot_interest` | `yes` \| `no` \| `later` |
| `notes` | Anything else |

> The first 17 columns get filled during sourcing/outreach (Week 1). The `call_*` → `notes` columns get filled during calls (Week 2).

---

## 2. THE OUTREACH HOOK — FREE "SKILL AUDIT"

The hook that earns the call: **a free skill audit of their public help center.** You run your own CLI tool on their help-center URL and email them the generated `SKILL.md` drafts — *whether or not they ever talk to you.* It is genuinely useful, proves the product is real, and makes the cold message un-ignorable.

### 2.1 Generate the audit (CLI)
The tool already exists in the repo: `company-brain/package.json` → `npm run audit` (maps to `tsx src/cli/audit.ts`).

```bash
cd company-brain
npm install
# Try with NO key first to sanity-check crawling:
npm run audit -- https://help.theircompany.com --dry-run
# Then add a FREE key (v1 uses Google Gemini's free tier — no credit card):
cp .env.example .env        # paste a free GEMINI_API_KEY from https://aistudio.google.com/apikey
npm run audit -- https://help.theircompany.com
# -> writes draft SKILL.md files to ./out/help.theircompany.com/<skill>/SKILL.md + AUDIT.md
```

Workflow:
1. Pull `help_center_url` from the CSV.
2. Run `npm run audit <url>`.
3. Skim the 3–8 generated `SKILL.md` drafts — sanity-check they're coherent (you're putting your name on them).
4. Pick the **2 strongest** to paste/attach in outreach. Keep the rest as the "full audit" you hand over on the call.
5. Mark `audit_sent=y`, set `audit_sent_date`.

### 2.2 The cold message (LinkedIn DM / email — adapt per prospect)
> **Subject:** your AI bot's wrong answers
>
> Hi {Name} — saw {Company} {launched/announced} {their AI bot / "Ask AI"}. Most teams hit the same wall fast: the bot answers from a doc dump, so it hallucinates on anything procedural (refunds, escalations, edge cases).
>
> I ran my tool on your public help center and generated a few **human-approvable skill files** — the actual *procedures* your AI should be answering from. Two of them attached; happy to send the full set.
>
> You get these whether or not we ever talk. If it's useful, I'd love 15 min to hear where your bot actually breaks. Worth a quick call?

**Send rules:**
- Personalize line 1 with the *specific* trigger from `ai_bot_evidence`. No generic blasts.
- Always lead with the delivered audit, not a meeting ask.
- Booking link in the PS: `Grab 15 min: cal.com/<you>/skill-audit`.
- Follow-up once after 3 working days if `reply=none`: "Did the skill files land? Want the full audit?"

---

## 3. CLICKABLE-DEMO CHECKLIST (for the calls)

You do NOT build the product to validate it. You show the **core loop** via (a) the **live audit output** (real `SKILL.md` files you generated for *their* help center) plus (b) a thin **clickable Figma** of the approval UI. The audit output is your strongest asset — it's their real data.

Build this **before your first call (by Day 5)**. The loop to make tangible: **INGEST → EXTRACT → HUMAN APPROVES → PUBLISH (SKILL.md + MCP) → KEEP CURRENT.**

- [ ] **Cover frame** — one-liner + "here's what we generated from *your* help center."
- [ ] **INGEST** — a frame showing connector logos: Slack, Google Drive/Notion, Intercom/Zendesk ("we read these, read-only").
- [ ] **EXTRACT** — show 2–3 *real* generated `SKILL.md` drafts from their audit, each citing its source doc. (This is the "wow" — it's their content.)
- [ ] **HUMAN APPROVES** — the approval screen: draft on left, edit box, `Approve` / `Request changes` / version badge `v1 → v2`. Make clear a human signs off before any agent uses it. **This is the moat — dwell here.**
- [ ] **PUBLISH** — two outputs: (1) `Download skills.zip` button, (2) a hosted **MCP endpoint** URL `https://mcp.companybrain.ai/o/<slug>` they paste into their AI agent.
- [ ] **KEEP CURRENT** — a "⚠️ Source changed — re-approve" flag on a skill (staleness detection). This is the "you don't want to babysit this" pitch.
- [ ] **Before/after** — one frame: AI bot's wrong answer (screenshot from the wild) vs the same question answered from an approved skill.
- [ ] Record a **2-min Loom** walking the loop → reuse it for async prospects who won't take a call.

> Keep it a *clickable demo*, not a product. If a frame would take more than ~30 min, fake it with a static image. The audit `.md` files do the real selling.

---

## 4. DISCOVERY-CALL SCRIPT (~15–20 min)

Goal of the call: confirm pain, find who owns it, and get a clean price reaction. **Do not pitch features — diagnose.** Talk ~30%, listen ~70%.

### 4.1 Opening (60 sec)
> "Thanks for the 15 minutes. Quick context: I sent over those skill files I generated from your help center — did they land / were they useful? I'm not here to demo a finished product; I'm trying to understand where AI support bots actually break for teams like yours, and whether the thing I'm building fixes it. Can I ask you a few questions, then I'll show you what I've got?"

### 4.2 The 5–6 questions (ask in order, let them talk)
1. **Current AI-bot pain:** "You launched {bot}. How's it actually going — what % of conversations does it handle, and how confident are you in its answers?"
2. **What breaks:** "Where does it give wrong or made-up answers? Walk me through the last time it embarrassed you or a customer." *(Listen for: refunds, policy edge cases, procedural multi-step stuff.)*
3. **Who owns it:** "When the bot gets something wrong, whose job is it to fix the underlying knowledge? Who keeps the help center / SOPs current today?" *(→ `owns_problem`)*
4. **What's missing / current fix:** "What are you doing about it now — better docs, prompt tweaks, turning the bot down? What's still missing?" *(→ `whats_missing`)*
5. **The solution check:** *(now show the audit + 90-sec demo)* "Here's the idea: we extract your real procedures into skill files, a human on your team approves each one, your agent answers only from approved skills, and we flag them when the source changes. Does that map to your problem?"
6. **Willingness to pilot:** "If I gave you a 14-day pilot wired to your help center and Intercom/Zendesk, would you put it in front of your team?" *(→ `pilot_interest`)*

### 4.3 The price question (ask it CLEANLY — this feeds the gate)
Ask it plainly, then **shut up and let silence do the work.** Don't soften it, don't pre-discount.

> "Last thing, and be honest — there's no wrong answer. If this reliably cut your bot's wrong-answer rate, it'd be self-serve at **$99/month for one team, $399/month for multi-team with the staleness detection and MCP endpoints.** At that price, is this a 'yes, I'd buy it,' a 'maybe,' or a 'no'?"

Then capture:
- Their literal words → `price_reaction`.
- Bucket → `would_pay` = `yes` / `maybe` / `no`. **Only `yes` counts toward the gate.**
- If `yes`: "Great — I'm taking 5–8 design partners at **50% for life**. Want one of the spots?" → that's your beta pipeline.
- If `maybe`/`no`: "What would have to be true for it to be an obvious yes?" → gold for `whats_missing` and for a possible wedge pivot.

### 4.4 Close
> "Super helpful. I'll send the full audit set + a Loom. If you're up for the pilot, I'll reach out the week it's ready — design partners get founder pricing locked in."

---

## 5. TRACKER — THE 15 CALLS & GATE TALLY

Keep this as a tab/section alongside `hot-list-100.csv` (or just maintain it in the CSV's `call_*` columns). Fill one row per completed call.

| # | Company | Name / role | Call date | Status | Owns problem | Would pay | Price reaction | Pilot? | What's missing |
|---|---------|-------------|-----------|--------|--------------|-----------|----------------|--------|----------------|
| 1 |  |  |  | done |  | yes/maybe/no |  | y/n |  |
| 2 |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |  |
| 11 |  |  |  |  |  |  |  |  |  |
| 12 |  |  |  |  |  |  |  |  |  |
| 13 |  |  |  |  |  |  |  |  |  |
| 14 |  |  |  |  |  |  |  |  |  |
| 15 |  |  |  |  |  |  |  |  |  |

### Gate tally (update after every call)
```
Calls completed:      __ / 15
WOULD-PAY (yes):      __        <-- GATE METRIC (need >= 5)
Maybe:                __
No:                   __
Pilot-interested:     __        <-- your design-partner pipeline (aim 5-8)

GATE @ 2026-06-26:   [ ] GO (>=5 yes)    [ ] NO-GO -> revisit wedge & re-run
```

### Funnel health check (diagnose if the gate is at risk)
| Metric | Healthy | If below → fix |
|---|---|---|
| Outreach → reply | ≥ 20% | Sharpen line 1 / trigger relevance; lead harder with the audit |
| Reply → call booked | ≥ 40% | Make the ask smaller ("15 min, I'll just show you your skills") |
| Call → would-pay yes | ≥ 33% (5/15) | If pain is real but price is the no → wedge OK, pricing problem. If pain is weak → wrong wedge, pivot. |

---

## 6. WEEKS 1–2 DAY-BY-DAY CADENCE

Schedule shaped around your windows: **mornings = build/sourcing**, **1:30–5:30pm IST = EU calls**, **6:30–10:30pm IST = US calls (prime booking window).**

### Week 1 (Mon 2026-06-15 → Fri 2026-06-19) — SOURCE & SEND
| Day | Morning (build/source) | EU window (1:30–5:30pm) | US window (6:30–10:30pm) |
|---|---|---|---|
| **Mon 06-15** | Create `data/hot-list-100.csv` (§1.3). Source 20 rows (tactics 1–2). Set up Cal.com `/skill-audit`. | Run audits for first 10 (`npm run audit`). | Send 10 personalized cold messages (US prospects). |
| **Tue 06-16** | Source 20 rows (tactics 3–4). | Run 10 audits; send 10 EU messages. | Send 10 US messages. Reply to any inbound. |
| **Wed 06-17** | Source 20 rows (tactics 5–6, BuiltWith). | Run 10 audits; send 10 messages. Start Figma demo. | Send 10 US messages. Book calls as replies come. |
| **Thu 06-18** | Source 20 rows (tactic 7 + fill gaps → 100 total). | Run remaining audits; send batch. **Finish clickable demo + Loom.** | Send remaining messages; follow-ups to Mon non-repliers. |
| **Fri 06-19** | Polish demo. Prep call script; dry-run on Loom. | Follow-up wave (Tue non-repliers). Confirm next-week call slots. | **First 1–3 discovery calls** if booked. Tally. |

✅ *End of Week 1 target:* 100-row hot list complete, ~100 audits sent, ~8–12 calls booked into Week 2, demo + Loom done.

### Week 2 (Mon 2026-06-22 → Fri 2026-06-26) — CALLS & GATE
| Day | Morning | EU window | US window |
|---|---|---|---|
| **Mon 06-22** | Follow-ups to fill remaining call slots → push toward 15 booked. | 1–2 EU calls. Log to tracker. | 2–3 US calls. Log `would_pay`. |
| **Tue 06-23** | Send full audit sets to yesterday's calls; chase no-shows. | 1–2 EU calls. | 2–3 US calls. Update gate tally. |
| **Wed 06-24** | Re-book any no-shows; last booking push. | 1–2 EU calls. | 2–3 US calls. |
| **Thu 06-25** | Catch-up calls; design-partner follow-ups to every `yes`. | 1–2 EU calls. | 2–3 US calls → reach **15 completed**. |
| **Fri 06-26** | **DECIDE THE GATE.** Final tally. Write 1-paragraph verdict. | Buffer calls if short of 15. | If GO: confirm 5–8 design partners. If NO-GO: pick new wedge, draft re-run list. |

✅ *End of Week 2 target:* 15 calls completed, gate decided, design-partner list (if GO) or new-wedge plan (if NO-GO).

> **Pacing reality:** ~2–3 US calls + ~1–2 EU calls per day = ~3–5/day × 4 call-days = 12–20 capacity. 15 is achievable if Week 1 booking holds. If you're under 10 booked by Mon 06-22, spend Tue–Wed mornings on a 30-message re-send wave before you run out of runway.

---

## 7. DEFINITION OF DONE (Phase 1)

- [ ] `company-brain/data/hot-list-100.csv` has 100 qualified rows (every row has `ai_bot_evidence`).
- [ ] ~100 free skill audits generated via `npm run audit` and sent (`audit_sent=y`).
- [ ] Clickable demo + 2-min Loom of the core loop exist.
- [ ] **15 discovery calls completed**, logged in §5 tracker.
- [ ] Gate decided on 2026-06-26 and recorded in `COMPANY-BRAIN-EXECUTION-PLAN.md` §1 Phase Tracker.
- [ ] **GO** → mark Phase 1 done, start Phase 2 §5 with 5–8 named design partners. **NO-GO** → new wedge chosen, fresh hot-list seeded, re-run scheduled. **Either way: do not skip the gate.**
