# Automation

Standalone scripts to run the growth motion in bulk. Run from the repo root (`company-brain/`).
Full strategy + links: [`../docs/GTM-RESEARCH.md`](../docs/GTM-RESEARCH.md).

## Scripts (no extra deps — plain Node)

### `batch-audit.mjs` — audit the whole hot-list
Runs the free skill-audit on every prospect in `data/hot-list-100.csv` that has a `help_center_url`.
```bash
node automation/batch-audit.mjs --dry          # preview (no key/LLM) — safe to test
node automation/batch-audit.mjs --limit 3      # first 3 prospects
node automation/batch-audit.mjs --max 10       # up to 10 articles each
```
Outputs SKILL.md files to `./out/<host>/`. Email the strongest ones; mark `audit_sent=y` in the CSV.
Also available as `npm run audit:batch`.

### `outreach-merge.mjs` — personalized cold-email drafts
Fills a template per prospect (with their real AI-bot evidence) → `automation/out/outreach-generated.md`.
```bash
node automation/outreach-merge.mjs
```
Edit the `TEMPLATE` string in the script to change the message. Also `npm run outreach`.

## No-code pipeline (recommended for ongoing scale)
Wire this in **n8n** (https://n8n.io, free self-host) or **Make** (https://www.make.com):

```
New lead (Google Sheet / form)
  → Enrich (Clay https://clay.com  or Apollo https://www.apollo.io)
  → Run skill audit (HTTP call to your /api/audit once the public endpoint exists,
     or trigger batch-audit)
  → Draft personalized email (this template)
  → Send + follow-up (Instantly https://instantly.ai / Smartlead https://smartlead.ai)
  → Log reply back to the sheet
```

## Prospect discovery (expand the hot-list)
The verified hot-list was built by multi-source web research (vendor case-study pages,
BuiltWith, job ads). To expand it yourself: pull customer lists from
fin.ai/customers, decagon.ai/customers, intercom.com case studies; detect helpdesks with
BuiltWith/Wappalyzer; enrich the buyer in Clay. Keep the same CSV columns as
`data/hot-list-100.csv`.

## Scheduled staleness re-checks
Keep customers' skills fresh + create re-engagement triggers:
```bash
npm run cb -- stale     # re-crawl sources, flag changed approved skills
```
Schedule via cron / n8n; alert when flags appear.
