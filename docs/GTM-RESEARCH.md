# Company Brain — GTM & Growth Research (with links + automation)

> Pure research, no fluff. Every channel has a concrete tactic, a link, and an automation angle.
> Product = "turn docs into human-approved SKILL.md + a hosted MCP endpoint so AI agents stop hallucinating."
> Wedge = Customer Support / CS at 20–200-person SaaS/D2C that recently shipped an AI bot.
> Metrics live in [`metrics/weekly-dashboard.md`](metrics/weekly-dashboard.md). North star = **skills approved per active org**.

---

## 0. The trigger to hunt
The buyer (Head of Support/CS/CX/Ops or founder-operator) feels one pain: **"our new AI bot gives confidently-wrong answers on procedural stuff (refunds, escalations, edge cases)."** Every channel below is about getting in front of that person at that moment.

---

## 1. The unfair top-of-funnel — the free **Skill Audit** (already built)
You already have `npm run audit -- <help-center-url>`. This is the growth engine, used 3 ways:

1. **Cold-outreach gift** — run it on a prospect's help center, email them the generated skills (they keep them regardless). Un-ignorable because it's *their* data. (Automated: `automation/batch-audit`.)
2. **Public self-serve lead magnet** (build next) — a `/audit` page: paste your help-center URL → get skills emailed. Captures the lead + shows the product instantly. This is the single highest-ROI marketing asset to build.
3. **Programmatic SEO** (automation) — every public audit auto-generates a page: *"AI-support skill audit for {Company}"* → long-tail SEO + social proof + backlinks. Hundreds of pages from one script.

> Reality from testing: the audit shines on **Zendesk-style (`/hc/`) article help centers**. Add a JS crawler (Firecrawl, https://firecrawl.dev) to cover Intercom/Notion sites and ~3× the addressable prospects.

---

## 2. Channels, ranked by leverage

### A. MCP ecosystem distribution — UNIQUE to this product (you *are* an MCP server)
AI-native teams discover MCP servers through registries. Free, high-intent, almost no competition for "support knowledge" MCP servers yet.
- Official MCP registry — https://github.com/modelcontextprotocol/registry
- mcp.so — https://mcp.so
- Glama MCP servers — https://glama.ai/mcp/servers
- Smithery — https://smithery.ai
- PulseMCP — https://www.pulsemcp.com
- Awesome MCP Servers — https://github.com/punkpeye/awesome-mcp-servers
- Anthropic MCP docs/community + the MCP Discord (linked from https://modelcontextprotocol.io)
- **Tactic:** publish a free, read-only "demo" MCP server (sample skills) + list everywhere above. Each listing = a backlink + discovery.

### B. Open-source magnet (top-of-funnel → hosted upsell)
- Release the extractor as a free CLI `skillmd` on GitHub (MIT). The hosted product adds approval UI + MCP hosting + staleness.
- Launch it: **Show HN** (https://news.ycombinator.com/show), **Product Hunt** (https://www.producthunt.com), dev.to (https://dev.to), Hacker News.
- "Awesome SKILL.md / Agent Skills" list to own the keyword.

### C. Founder-led cold outreach (the hot-list + audit hook)
- **Find prospects:** companies named on AI-support vendor case-study/customer pages (Intercom Fin: https://fin.ai/customers, Zendesk AI, Decagon: https://decagon.ai/customers, Fini), tech detection via BuiltWith (https://builtwith.com) / Wappalyzer (https://www.wappalyzer.com), and AI-support job ads (Wellfound https://wellfound.com, LinkedIn Jobs).
- **Enrich + send tools:** Clay (https://clay.com — enrichment + waterfall), Apollo (https://www.apollo.io), Instantly (https://instantly.ai), Smartlead (https://smartlead.ai), lemlist (https://lemlist.com), PhantomBuster (https://phantombuster.com — LinkedIn).
- **Automate the whole flow** (see §3): Sheet/Clay row → enrich → run audit → personalized email → send → log reply.

### D. Communities (be useful, never spam)
- Support Driven — https://supportdriven.com (the #1 place support leaders hang out)
- RevGenius — https://www.revgenius.com
- r/CustomerSuccess — https://www.reddit.com/r/CustomerSuccess , r/SaaS — https://www.reddit.com/r/SaaS
- Indie Hackers — https://www.indiehackers.com
- MicroConf Connect — https://microconf.com/connect
- Lenny's Newsletter community — https://www.lennysnewsletter.com

### E. Content / SEO
- Target intent keywords: "AI support bot wrong answers", "Intercom Fin hallucination", "SOP to AI agent", "SKILL.md", "MCP for customer support", "reduce AI agent hallucination support".
- Cornerstone playbook: *"How to turn your SOPs into reliable AI agent skills"* (the topic is trending in 2026).
- Programmatic SEO from audits (see §1.3).

### F. Marketplace / app-store listings (meet buyers in their helpdesk)
- Intercom App Store — https://www.intercom.com/app-store (build a lightweight app/integration)
- Zendesk Marketplace — https://www.zendesk.com/marketplace
- These put you in front of teams *inside the tool they already use*.

### G. Launch moments (stack same-week with design-partner proof)
- Product Hunt, Show HN, Peerlist (https://peerlist.io/launchpad), Devhunt (https://devhunt.org), MicroLaunch (https://microlaunch.net).

### H. Partnerships (highest-margin channel)
- AI-implementation agencies & fractional "Head of AI" consultants deploy bots for SMBs — they need exactly this reliability layer. Offer **20% recurring referral**. Find them in AI agency directories + LinkedIn.

---

## 3. Automation opportunities (built in [`/automation`](../automation))
| What | How | Tool / script |
|---|---|---|
| Batch skill-audits over the hot-list | read `data/hot-list-100.csv`, run audit per `help_center_url` | `automation/batch-audit.mjs` |
| Personalized outreach mail-merge | CSV + template → per-prospect messages | `automation/outreach-merge.mjs` |
| Prospect discovery + verification | multi-source web research → verified rows | reuse the saved research workflow (see automation README) |
| Lead → enrich → audit → email | no-code pipeline | **n8n** (https://n8n.io, self-host free) or **Make** (https://www.make.com) or Zapier (https://zapier.com) |
| Scheduled staleness re-checks → re-engage | cron `npm run cb -- stale`, alert on flags | n8n/cron + the app's staleness detection |
| Programmatic SEO pages from audits | template + generated skills → static pages | extend the audit output (build next) |

**Recommended no-code stack:** n8n (free, self-hosted) for the outreach pipeline; Clay for enrichment; Instantly/Smartlead for deliverability.

---

## 4. Funnel math (track weekly)
Audit sent → reply % (≥20%) → call booked % (≥40%) → would-pay % (≥33%) → pilot → paid. Then North star: skills approved / active org climbing week-over-week. Full tracker: [`metrics/weekly-dashboard.md`](metrics/weekly-dashboard.md).

## 5. Sequencing (first 90 days)
1. **Weeks 1–2:** founder outreach (hot-list + audit hook) → 15 discovery calls → validate (gate ≥5/15).
2. **Weeks 3–6:** build with 5–8 design partners; ship the public `/audit` lead magnet + open-source CLI.
3. **Weeks 7–10:** list on all MCP registries; Show HN + Product Hunt for the CLI; convert design partners (first revenue).
4. **Weeks 11–13:** programmatic-SEO audit pages live; agency partnerships; full launch wave.

---

## 6. Curated links (one place)
**MCP distribution:** modelcontextprotocol.io · mcp.so · glama.ai/mcp/servers · smithery.ai · pulsemcp.com · github.com/punkpeye/awesome-mcp-servers · github.com/modelcontextprotocol/registry
**Outreach/automation:** clay.com · apollo.io · instantly.ai · smartlead.ai · lemlist.com · phantombuster.com · n8n.io · make.com · zapier.com
**Launch:** producthunt.com · news.ycombinator.com/show · peerlist.io · devhunt.org · microlaunch.net · dev.to
**Communities:** supportdriven.com · revgenius.com · indiehackers.com · microconf.com · reddit.com/r/SaaS · reddit.com/r/CustomerSuccess
**Prospecting signals:** fin.ai/customers · decagon.ai/customers · builtwith.com · wappalyzer.com · wellfound.com
**Marketplaces:** intercom.com/app-store · zendesk.com/marketplace
**JS crawler upgrade:** firecrawl.dev
