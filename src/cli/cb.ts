/**
 * cb — Company Brain control CLI. Drives the full core loop headlessly so the
 * product can be tested end-to-end without the web UI:
 *
 *   npm run cb -- org                          show org + MCP endpoint/token
 *   npm run cb -- ingest <help-center-url> [--max 8]
 *   npm run cb -- list [--status draft|approved|stale|archived]
 *   npm run cb -- show <skillId>
 *   npm run cb -- approve <skillId>
 *   npm run cb -- archive <skillId>
 *   npm run cb -- stale                        re-crawl sources, flag changed skills
 *   npm run cb -- publish [--out exports]      export approved skills (files + skills.json)
 */
import "dotenv/config";
import { store } from "../lib/store";
import { exportSkills } from "../lib/publish";

const MCP_BASE = process.env.CB_PUBLIC_MCP_BASE ?? "http://localhost:8787";

function arg(flag: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

async function main(): Promise<void> {
  const [cmd, positional] = [process.argv[2], process.argv[3]];
  const org = await store.getOrCreateDefaultOrg();

  switch (cmd) {
    case "org": {
      console.log(`\nOrg:   ${org.name}  (${org.id}, slug=${org.slug}, plan=${org.plan})`);
      console.log(`MCP:   ${MCP_BASE}/mcp/${org.mcpToken}`);
      console.log(`Token: ${org.mcpToken}`);
      console.log(`Sources: ${(await store.listSources(org.id)).length}, skills: ${(await store.listSkills(org.id)).length}\n`);
      break;
    }

    case "ingest": {
      if (!positional) return die("usage: cb ingest <help-center-url> [--max 8]");
      const max = Number(arg("--max", "8")) || 8;
      console.log(`\nIngesting ${positional} (max ${max})...\n`);
      const r = await store.ingestHelpCenter(org.id, positional, max, (m) => console.log("  " + m));
      console.log(
        `\n✓ ${r.articlesFound} articles → ${r.documentsUpserted} docs · ${r.skillsCreated} new draft skill(s)` +
          (r.skillsSkipped ? `, ${r.skillsSkipped} skipped (already exist)` : "") +
          "\n  Review them: npm run cb -- list\n",
      );
      break;
    }

    case "list": {
      const status = arg("--status") as never;
      const skills = await store.listSkills(org.id, status);
      if (skills.length === 0) {
        console.log("\n(no skills yet — run: npm run cb -- ingest <url>)\n");
        break;
      }
      console.log("");
      for (const s of skills) {
        const badge = { draft: "📝 draft", approved: "✅ approved", stale: "⚠️  stale", archived: "🗄️  archived" }[s.status];
        console.log(`${badge.padEnd(12)} ${s.id}  ${s.title}`);
      }
      console.log(`\n${skills.length} skill(s).\n`);
      break;
    }

    case "show": {
      if (!positional) return die("usage: cb show <skillId>");
      const v = await store.getSkillView(org.id, positional);
      if (!v) return die("skill not found");
      console.log(`\n# ${v.current.title}   [${v.skill.status}]`);
      console.log(`slug: ${v.skill.slug} · versions: ${v.versions.length} · sources: ${v.sources.length}`);
      if (v.openFlags.length) console.log(`⚠️  ${v.openFlags.length} open staleness flag(s)`);
      console.log(`\n${v.current.bodyMd}\n`);
      if (v.sources.length) console.log("Sources:\n" + v.sources.map((s) => `  - ${s.url}`).join("\n") + "\n");
      break;
    }

    case "approve": {
      if (!positional) return die("usage: cb approve <skillId>");
      const v = await store.approveSkill(org.id, positional, "founder@cli");
      if (!v) return die("skill not found");
      console.log(`\n✅ Approved: ${v.current.title}\n`);
      break;
    }

    case "archive": {
      if (!positional) return die("usage: cb archive <skillId>");
      console.log((await store.archiveSkill(org.id, positional)) ? "\n🗄️  archived\n" : "\nskill not found\n");
      break;
    }

    case "regen": {
      if (!positional) return die("usage: cb regen <skillId>");
      console.log("\nRegenerating from sources...");
      const v = await store.regenerateSkill(org.id, positional);
      console.log(v ? `✓ New AI draft of "${v.current.title}" — re-approve to publish\n` : "skill not found\n");
      break;
    }

    case "stale": {
      console.log("\nDetecting staleness (re-crawling sources)...\n");
      const flags = await store.detectStaleness(org.id, (m) => console.log("  " + m));
      console.log(`\n${flags.length === 0 ? "✓ Nothing stale — all approved skills match their sources." : `⚠️  ${flags.length} skill(s) flagged stale.`}\n`);
      break;
    }

    case "publish": {
      const out = arg("--out", "exports");
      const r = await exportSkills(store, org.id, out);
      console.log(`\n✓ Published ${r.count} skill(s) → ${r.dir}`);
      console.log(`  Manifest: ${r.manifestPath}`);
      console.log(`  MCP endpoint: ${MCP_BASE}/mcp/${org.mcpToken}\n`);
      break;
    }

    default:
      die(
        "commands: org | ingest <url> | list | show <id> | approve <id> | archive <id> | stale | publish",
      );
  }
}

function die(msg: string): void {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
