/**
 * Publish layer: turn approved skills into the two outputs buyers consume —
 *   1. downloadable SKILL.md files (Agent Skill folders)
 *   2. a skills.json manifest (also what the MCP server serves)
 *
 * Stale skills (approved, but a source changed) are still published but carry a
 * visible warning — the agent keeps working while a human re-approves.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import type { SkillStore, SkillView } from "./store";

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ").trim()}"`;
}

/** Render a published skill as a complete SKILL.md (Agent Skill format). */
export function skillToMarkdown(view: SkillView): string {
  const { skill, current, sources } = view;
  const stale = skill.status === "stale" || view.openFlags.length > 0;
  const lines: string[] = [
    "---",
    `name: ${skill.slug}`,
    `description: ${yamlString(current.description)}`,
    "---",
    "",
    `# ${current.title}`,
    "",
  ];
  if (stale) {
    lines.push(
      "> ⚠️ **Source changed since approval — pending re-approval.** Treat with extra caution.",
      "",
    );
  }
  lines.push(current.bodyMd.trim(), "");
  if (sources.length > 0) {
    lines.push("## Sources", "");
    for (const s of sources) lines.push(`- [${s.title || s.url}](${s.url})`);
    lines.push("");
  }
  const approved = current.approvedAt
    ? `approved by ${current.approvedBy ?? "a teammate"} on ${current.approvedAt.slice(0, 10)}`
    : "not yet approved";
  lines.push("---", `_Company Brain · ${approved} · skill \`${skill.slug}\`._`, "");
  return lines.join("\n");
}

export interface ExportResult {
  dir: string;
  files: string[];
  manifestPath: string;
  count: number;
}

/** Export an org's published skills to a folder of SKILL.md files + skills.json. */
export function exportSkills(store: SkillStore, orgId: string, outDir = "exports"): ExportResult {
  const org = store.getOrg(orgId);
  const views = store.getPublishedSkills(orgId);
  const base = resolve(outDir, org?.slug ?? orgId);
  mkdirSync(base, { recursive: true });

  const files: string[] = [];
  const manifest = views.map((v) => {
    const dir = join(base, v.skill.slug);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "SKILL.md");
    writeFileSync(file, skillToMarkdown(v), "utf8");
    files.push(file);
    return {
      slug: v.skill.slug,
      title: v.current.title,
      description: v.current.description,
      status: v.skill.status,
      sources: v.sources,
      body: v.current.bodyMd,
    };
  });

  const manifestPath = join(base, "skills.json");
  writeFileSync(manifestPath, JSON.stringify({ org: org?.slug, skills: manifest }, null, 2), "utf8");
  return { dir: base, files, manifestPath, count: views.length };
}
