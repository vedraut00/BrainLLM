/**
 * Personalized outreach mail-merge from the hot-list.
 * Reads data/hot-list-100.csv and fills a template per prospect (using each
 * prospect's real AI-bot evidence), writing automation/out/outreach-generated.md.
 *
 *   node automation/outreach-merge.mjs
 *
 * Edit TEMPLATE below to change the message. Placeholders are any CSV column,
 * e.g. {company} {name} {role} {ai_bot_evidence} {helpdesk}.
 * Run from the repo root (company-brain/).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { parseCSV } from "./_csv.mjs";

const TEMPLATE = `Subject: {company}'s AI bot and the procedural gap

Hi {name} — saw {company}: {ai_bot_evidence}. Impressive numbers. The wall most teams hit is the procedural last mile — refunds, escalations, policy edge cases — where the bot answers from a doc dump and gets it subtly wrong.

I built Brain: it turns your real procedures (from {helpdesk_detected}, docs, Slack) into human-approved skill files your AI answers from, and flags them when a source changes. A human on your team approves each one before any agent uses it.

I'll run a free skill audit on your help center — yours to keep either way. Worth 15 minutes?`;

const csv = readFileSync(resolve("data/hot-list-100.csv"), "utf8");
const rows = parseCSV(csv).filter((r) => r.company);

let out = `# Generated outreach — ${rows.length} prospects\n\n> Auto-filled from data/hot-list-100.csv. Personalize line 1, add your Cal.com link + name before sending.\n\n`;
for (const r of rows) {
  let msg = TEMPLATE;
  for (const [k, v] of Object.entries(r)) msg = msg.split(`{${k}}`).join(v || `{${k}}`);
  msg = msg.split("{name}").join(r.name || "there"); // fallback for empty name
  out += `## ${r.id || ""} — ${r.company}${r.role ? ` (${r.role})` : ""}\n\n${msg}\n\n---\n\n`;
}

mkdirSync(resolve("automation/out"), { recursive: true });
const path = resolve("automation/out/outreach-generated.md");
writeFileSync(path, out, "utf8");
console.log(`✓ Wrote ${rows.length} personalized message(s) → ${path}`);
