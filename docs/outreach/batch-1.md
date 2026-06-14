# Outreach — Batch 1 (verified prospects)

> Ready-to-send drafts for the 3 verified prospects in `data/hot-list-100.csv`.
> Fill `{your name}` and your Cal.com link. Personalize line 1 — it already references each prospect's real AI-bot metric.
> Find the buyer's name/email on LinkedIn (role noted per prospect); the hot-list leaves those blank on purpose.

**Important targeting note:** the free "skill audit" hook is strongest on **article-based help centers** (Zendesk `/hc/`, Intercom help). These 3 have FAQ/JS-style help centers, so a generated audit may be thin — lead with the *insight* (their bot's procedural gap) rather than attaching auto-generated skills. Run `npm run audit` first and only attach the output if it's genuinely good. (The product demo on a call uses your strong example audits — Zendesk/Discord — or their data live.)

---

## 1. Nuuly — D2C fashion rental · Intercom Fin · Head of Support / CX Ops

**Cold email**
> **Subject:** the other 51% of Nuuly's support conversations
>
> Hi {Name} — saw Nuuly's Fin agent is resolving ~49% of conversations at a 95% CSAT. Impressive. The wall most teams hit is the *other* half: procedural questions — return windows, damage fees, cancellation edge cases — where the bot answers from a doc dump and gets it subtly wrong.
>
> I built Brain: it turns your real procedures (from Intercom, Slack, docs) into human-approved "skill files" your AI answers from, and flags them when a policy changes. Your team approves every one before any agent uses it.
>
> Happy to run a free skill audit on your help center — you keep the output either way. Worth 15 min? — {your name} · {cal link}

**LinkedIn (after connect)**
> Thanks for connecting, {Name}. Nuuly's Fin numbers are great (49% / 95% CSAT) — curious how it does on the *procedural* stuff (returns, damage, cancellations)? That's where doc-dump RAG breaks. I turn those procedures into human-approved skill files the bot answers from. Open to a quick look?

---

## 2. Column Tax — embedded tax SaaS · Fini AI · Zendesk · Head of Support (verify post-Aiwyn)

**Cold email**
> **Subject:** Column Tax's last few % of accuracy
>
> Hi {Name} — saw Column Tax reached ~94% resolution at 98% accuracy with Fini in about 3 months. The last few percent is usually the procedural/edge-case tax questions — exactly where a wrong AI answer is most costly.
>
> I built Brain: we extract your actual procedures into versioned, human-approved skill files your AI answers from (and flag them when a source changes), so accuracy holds on the hard questions. A human on your team signs off on each one.
>
> I'll run a free skill audit on your help center — yours to keep. 15 minutes? — {your name} · {cal link}
>
> *(Note: Column Tax was acquired by Aiwyn in late 2025 — confirm the support team still operates independently before investing time.)*

**LinkedIn (after connect)**
> Appreciate the connect, {Name}. 98% accuracy with Fini is strong — for tax, the procedural edge cases are where the stakes are highest. I make those answers human-approved + auto-flagged when the underlying rule changes. Worth 15 min?

---

## 3. Qogita — B2B wholesale SaaS (~175) · Fini AI · HubSpot · Head of Support (RevOps: Clara Girardeau)

**Cold email**
> **Subject:** Qogita's bot at 88% — closing the procedural gap
>
> Hi {Name} — saw Qogita's Fini agent is at ~88% resolution / 97% accuracy. The remaining gap is almost always procedural: raising claims, seller policies, Amazon-related issues — where the bot improvises from scattered docs.
>
> I built Brain: it compiles your real procedures into human-approved skill files your AI answers from, and flags them when a source changes. You mentioned plans to automate refunds and tiered support — this is the reliability layer that makes that safe.
>
> Free skill audit of your help center, yours to keep. Worth 15 min? — {your name} · {cal link}

**LinkedIn (after connect)**
> Thanks for connecting, {Name}. 88% with Fini is a great base — the procedural stuff (claims, seller policy, Amazon issues) is the tricky last mile. I turn those into human-approved skill files the bot answers from. Open to a quick walkthrough?

---

## 4. Fourthwall — creator-economy SaaS (~179) · Decagon AI · COO Eli Valentin

**Cold email**
> **Subject:** Fourthwall's other 30%
>
> Hi {Name} — saw Eli is resolving 70%+ of Fourthwall's tickets via Decagon. Strong. The remaining 30% is usually procedural — payouts, shipping issues, product-setup edge cases — where the bot improvises from scattered docs and gets the details wrong.
>
> I built Brain: it compiles your real procedures into human-approved skill files your AI answers from, and flags them when a source changes. Your team signs off on each before any agent uses it.
>
> Free skill audit of your help center, yours to keep. Worth 15 min? — {your name} · {cal link}

**LinkedIn (after connect)**
> Thanks for connecting, {Name}. 70%+ resolution with Decagon is great — curious how Eli does on the procedural stuff (payouts, shipping, setup edge cases)? That's where I help: human-approved skill files the bot answers from. Open to a quick look?

---

## 5. Breathe HR — UK SaaS HR (~108) · Intercom Fin · Head of CS Sophie Bassett

**Cold email**
> **Subject:** Breathe's jump from 56% → 88%
>
> Hi Sophie — saw Fin took Breathe from 56% to 88% resolution in 9 months. Impressive. The last mile is usually procedural HR questions — leave policies, edge-case entitlements, statutory bits — where a confidently-wrong answer is costly for your SMB customers.
>
> I built Brain: we turn your actual procedures (Intercom, docs, Slack) into versioned, human-approved skill files your AI answers from, and flag them when a policy changes. A human approves each one.
>
> Happy to run a free skill audit on your help center — yours to keep. 15 minutes? — {your name} · {cal link}

**LinkedIn (after connect)**
> Appreciate the connect, Sophie. 56%→88% with Fin is a great result — the procedural HR questions are the risky last mile. I make those answers human-approved and auto-flagged when a policy changes. Worth 15 min?

---

### Send checklist (per prospect)
- [ ] Find buyer name + LinkedIn (role noted above) → fill `data/hot-list-100.csv`
- [ ] Run `npm run audit -- <their help_center_url>` — attach output only if strong
- [ ] Personalize line 1, send in your US window (6:30–10:30pm IST)
- [ ] Mark `outreach_sent=y` + date in the CSV; follow up day 3 if no reply
