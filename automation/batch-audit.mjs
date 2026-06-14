/**
 * Batch skill-audit over the prospect hot-list.
 * Reads data/hot-list-100.csv and runs `npm run audit` on every row that has a
 * help_center_url and isn't already marked audit_sent=y. Outputs land in ./out/.
 *
 *   node automation/batch-audit.mjs              # audit all pending prospects
 *   node automation/batch-audit.mjs --dry        # crawl + preview only (no LLM/key)
 *   node automation/batch-audit.mjs --limit 3    # only the first 3
 *   node automation/batch-audit.mjs --max 10     # up to 10 articles each
 *
 * Run from the repo root (company-brain/).
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { parseCSV } from "./_csv.mjs";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const num = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? Number(args[i + 1]) || def : def;
};
const max = num("--max", 8);
const limit = num("--limit", 0);

const csv = readFileSync(resolve("data/hot-list-100.csv"), "utf8");
const rows = parseCSV(csv).filter((r) => r.help_center_url && r.audit_sent !== "y");
const todo = limit > 0 ? rows.slice(0, limit) : rows;

if (todo.length === 0) {
  console.log("No pending prospects with a help_center_url (or all marked audit_sent=y).");
  process.exit(0);
}
console.log(`Running ${todo.length} audit(s)${dry ? " [DRY RUN]" : ""}, max ${max} articles each...\n`);

for (const r of todo) {
  console.log(`\n========== ${r.company || "?"} → ${r.help_center_url} ==========`);
  const a = ["run", "audit", "--", r.help_center_url, "--max", String(max)];
  if (dry) a.push("--dry-run");
  spawnSync("npm", a, { stdio: "inherit", shell: true });
}

console.log(`\n✓ Done. Generated SKILL.md files are in ./out/<host>/. Review, then email the strongest ones.`);
console.log(`  After sending, mark audit_sent=y in data/hot-list-100.csv.`);
