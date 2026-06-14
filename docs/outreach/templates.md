# Company Brain — Outreach Templates (Copy-Paste Ready)

> **Use:** First-10-customers founder-led outreach (§7 of execution plan). Target = Heads of Support/CS/Ops at 20–200-person SaaS/D2C/agencies that recently shipped an AI bot.
> **Hook:** Free skill audit of their public help center — they keep the generated skills whether or not they ever talk to you.
> **Booking link:** `https://cal.com/companybrain/audit` (replace with your real Cal.com slug everywhere).
> **Send windows:** US prospects 6:30–10:30pm IST (9am–1pm ET). EU 1:30–5:30pm IST. Last updated 2026-06-12.

## Merge fields (fill before sending)

| Field | Meaning | Example |
|---|---|---|
| `{Name}` | First name | Priya |
| `{Company}` | Company name | Northbeam |
| `{AI bot}` | Their bot / AI initiative (from launch post, changelog, job ad) | "Northbeam Assistant" |
| `{helpdesk}` | Their helpdesk (from careers page / footer / G2) | Intercom |
| `{trigger source}` | Where you saw the launch | "your June changelog" / "your LinkedIn post last week" |
| `{your name}` | You | Ved |
| `{cal link}` | Booking URL | https://cal.com/companybrain/audit |

---

## 1. Cold emails

> Keep to ~90 words. One ask. No signature block beyond name + link. Plain text, no images.

### Variant A — "The wall" (default)

**Subject:** your AI bot's wrong answers

```
Hi {Name} — saw {Company} launched {AI bot}. Most teams hit the same wall:
the bot answers from a doc dump, so it hallucinates on anything procedural.

I built a tool that extracts your *actual* procedures (Slack, docs, {helpdesk})
into human-approved skill files your AI uses — and flags them when they go stale.

I'll run a free skill audit on your help center. You get the generated skills
whether or not we ever talk.

Worth 15 minutes? — {your name}
{cal link}
```

### Variant B — "Free audit first" (lead with the gift)

**Subject:** ran a quick skill audit on {Company}'s help center

```
Hi {Name} — I pulled a few procedures out of {Company}'s public help center
and turned them into the skill files an AI agent would actually need to answer
correctly (attaching 2 below if you reply).

The gap I see everywhere: {AI bot}-style bots answer from raw docs and
hallucinate on procedural questions (refunds, escalations, edge cases).

We extract the real procedures from Slack/docs/{helpdesk}, a human on *your*
team approves each one, and we flag them when the source changes.

Want the full audit + 15 min to walk through it? Keep the skills either way.
— {your name} · {cal link}
```

### Variant C — "One question" (ultra-short, for senior buyers)

**Subject:** {Company} + procedural accuracy

```
Hi {Name} — quick one. When {AI bot} gets a procedural question (refund window,
escalation path, edge-case policy), how often is it actually right?

That's the gap I close: I extract your real procedures from {helpdesk}/Slack/docs
into human-approved skill files your AI uses, and flag them when they go stale.

Free audit of your help center, no card, you keep the output. 15 min?
{cal link} — {your name}
```

---

## 2. LinkedIn (connection request + first message)

> Connection note cap = 300 characters. Keep the note benefit-only; save the audit offer for the first message after they accept.

### Variant 1

**Connection note (≤300 chars):**
```
Hi {Name} — I work with support teams whose new AI bots hallucinate on
procedural questions. Building the approval layer that fixes it. Would love to
connect.
```

**First message (after accept):**
```
Thanks for connecting, {Name}. Saw {Company} shipped {AI bot} — most teams find
it answers from a doc dump and gets procedural questions wrong.

I'll run a free skill audit on your help center and send back the human-approve-ready
skill files. Yours to keep. Want me to run it?
```

### Variant 2

**Connection note (≤300 chars):**
```
Hi {Name} — saw {AI bot} at {Company}. I turn scattered docs/Slack/{helpdesk}
into approved skill files so AI agents stop hallucinating on procedures. Keen to
connect and share a free audit.
```

**First message (after accept):**
```
Appreciate the connect, {Name}. Honest question — how's {AI bot} doing on the
*procedural* stuff (refunds, escalations, edge cases)? That's where doc-dump RAG
breaks.

Happy to run a free skill audit on your help center this week — you get the
generated skills regardless. Worth a look?
```

---

## 3. Two-step follow-up sequence (non-responders)

> Reply in the same thread (keeps it short, preserves context). Stop after Day 7 — move on, re-add to hot list in 60 days.

### Follow-up 1 — Day 3 (sent 2026-06-15 for an email sent today)

**Subject:** `Re: [original subject]`

```
Hi {Name} — floating this back up. I already started the skill audit on
{Company}'s help center; happy to just send the drafts over.

Reply "send it" and they're yours — no call required.
— {your name}
```

### Follow-up 2 — Day 7 (sent 2026-06-19)

**Subject:** `Re: [original subject]`

```
Last note, {Name} — I'll assume the timing's off and close this out.

If procedural accuracy on {AI bot} ever lands on your plate, the free audit
offer stands: {cal link}.

Thanks for the time. — {your name}
```

---

## 4. Free skill audit — delivery email

> Send after you've generated 2–4 real SKILL.md drafts from their public help center. This is your highest-converting touch: you've already delivered value before asking for anything. Attach the `.md` files (or paste one inline).

**Subject:** your {Company} skill audit — {N} skills, yours to keep

```
Hi {Name} — here's the skill audit I promised. I pulled {N} procedures out of
{Company}'s public help center and turned them into approved-ready skill files
(attached). These are the exact format an AI agent reads to answer correctly.

Two things stood out:
  1. "{skill title #1}" — your help center implies the steps but never states
     them in order, so a bot fills the gap by guessing.
  2. "{skill title #2}" — looks like it changed recently; the older version is
     still cached in places a bot would scrape.

The attached drafts are yours to use however you like — no strings.

If you want the rest (the procedures that live in Slack/{helpdesk}, not the
public docs), plus the human-approval + staleness flagging, that's a 15-min walkthrough:
{cal link}

Either way, glad it's useful. — {your name}
```

---

## 5. Loom demo script (60–90 sec, scene-by-scene)

> Record once, reuse forever. Real product, real-ish data. Talk fast, no intro fluff, get to the wrong answer inside 10 seconds. Target length 75s.

| # | Scene | On screen | Say (verbatim-ish) | Time |
|---|---|---|---|---|
| 1 | The pain | AI bot / chat UI with a procedural question typed in | "Here's an AI support bot answering from a doc dump. I ask: 'Can a customer get a refund after 45 days?'" | 0:00–0:10 |
| 2 | Wrong answer | Bot returns a confident but WRONG answer | "It says yes. Confidently. It's wrong — your real policy is 30 days with a manager exception. This is the procedural-hallucination problem every team hits." | 0:10–0:25 |
| 3 | The fix — same query | Same query, now answered via the approved skill (MCP endpoint) | "Same question, same agent — now pointed at Company Brain. Correct answer: 30 days, here's the exception path, and it cites the source." | 0:25–0:40 |
| 4 | Where it came from | Skill detail / review UI showing the SKILL.md and its sources | "That answer came from this skill — extracted from your Slack, docs and {helpdesk}. Notice every line traces back to a real source." | 0:40–0:52 |
| 5 | Approve + version | Click Approve; show version history / diff | "A human on your team approves it before any agent can use it. Every edit is versioned — you can see exactly what changed and roll back." | 0:52–1:05 |
| 6 | Staleness flag | A skill row flipped to "Stale" with a flag because a source doc changed | "And when the source doc changes, we flag the skill as stale so it never silently drifts. That's the part you don't want to babysit." | 1:05–1:18 |
| 7 | CTA | Cal.com booking page | "I'll run this free on your help center — you keep the skills either way. Link's below. Thanks." | 1:18–1:30 |

**Loom title:** `{Company}: your AI bot answered this wrong — 75-sec fix`
**Loom description / first comment:** `Free skill audit + the skills are yours to keep: {cal link}`

---

## 6. Cal.com booking page copy

**Event title:**
```
Company Brain — Free Skill Audit (15 min)
```

**Event description:**
```
I'll show you the skill audit I ran on your help center — the real procedures
your AI bot should be answering from, extracted into approved-ready skill files.
You keep the generated skills whether or not we work together.

In 15 minutes you'll see: where your current bot hallucinates on procedural
questions, the same questions answered correctly from an approved skill, and how
the approve + staleness-flag workflow keeps it from drifting.

Read-only access only. No prep needed. No card.
```

**Single qualifying question (required field):**
```
What AI bot / assistant are you running today, and which helpdesk + tools hold
your support knowledge (e.g. Intercom + Slack + Notion)?
```

---

## 7. Objection cheat-sheet

> 1–2 sentences each. For "different from RAG," the real move is to drop the Loom — don't argue, show.

| # | Objection | Crisp answer |
|---|---|---|
| 1 | **Solo founder in India — why trust you?** | Your data stays in your tools (read-only scopes), and every skill is approved by *your* team before any agent uses it — judge the output, not my headcount. Start with a free audit, no card. |
| 2 | **How is this different from search / RAG?** | Search and RAG hand a model a pile of docs and hope; we extract the actual *procedure*, a human approves it, and we flag it when it goes stale. Easier to show than tell — here's a 75-sec Loom: {loom link}. |
| 3 | **Our data is sensitive.** | Read-only scopes, per-customer isolation, never trained on your data, delete on request — and the public-help-center audit needs zero access to prove value first. SOC 2 (Vanta/Drata) lands by ~10 customers. |
| 4 | **What if it generates wrong skills?** | That's exactly why nothing goes live until a human on your team approves it — we're the safety layer, not another autonomous bot. |
| 5 | **We'll build it ourselves.** | You can build extraction in a weekend; the cost is *maintaining* it as Slack, docs and {helpdesk} drift — the staleness detection is the part you won't want to babysit. |

---

*End of templates. Source of truth for positioning + objections: COMPANY-BRAIN-EXECUTION-PLAN.md §6–§7.*
