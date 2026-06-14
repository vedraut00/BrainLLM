/**
 * Domain + persistence layer for Company Brain.
 *
 * Implements the core data model (plan §4.5) and the full skill lifecycle:
 *   ingest (help-center) -> extract drafts -> review/edit/approve/version
 *   -> publish (export + MCP) -> keep-current (staleness detection).
 *
 * `SkillStore` is the interface the rest of the app talks to. `FileStore` is the
 * dev backend (a single JSON file under .data/). A `SupabaseStore` implementing
 * the same interface drops in later for production — no caller changes.
 *
 * FileStore reads+writes the whole DB on each op (trivial at this scale) so the
 * Next.js app never serves stale in-memory state across requests.
 */
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { crawlHelpCenter, type Article } from "./crawl";
import { extractSkills } from "./extract";

/* --------------------------------- types ---------------------------------- */

export type Plan = "free" | "starter" | "growth" | "scale";
export type SourceType = "helpcenter" | "slack" | "gdrive" | "notion" | "intercom" | "zendesk";
export type SkillStatus = "draft" | "approved" | "stale" | "archived";
export type Author = "ai" | "user";

export interface Org {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  mcpToken: string;
  createdAt: string;
}

export interface Source {
  id: string;
  orgId: string;
  type: SourceType;
  ref: string; // e.g. help-center base URL
  syncState: "idle" | "syncing" | "error";
  lastSyncedAt: string | null;
}

export interface Document {
  id: string;
  sourceId: string;
  externalId: string; // the article URL
  title: string;
  content: string; // extracted markdown
  contentHash: string;
  fetchedAt: string;
}

export interface SkillVersion {
  id: string;
  skillId: string;
  bodyMd: string;
  description: string;
  title: string;
  generatedFrom: string[]; // document ids
  createdBy: Author;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface Skill {
  id: string;
  orgId: string;
  slug: string;
  title: string;
  description: string;
  status: SkillStatus;
  currentVersionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StalenessFlag {
  id: string;
  skillId: string;
  documentId: string;
  reason: string;
  detectedAt: string;
  resolvedAt: string | null;
}

interface DB {
  orgs: Org[];
  sources: Source[];
  documents: Document[];
  skills: Skill[];
  versions: SkillVersion[];
  flags: StalenessFlag[];
}

/** A skill joined with its current version + sources + open flags, for views. */
export interface SkillView {
  skill: Skill;
  current: SkillVersion;
  versions: SkillVersion[];
  sources: { url: string; title: string }[];
  openFlags: StalenessFlag[];
}

export interface IngestResult {
  source: Source;
  articlesFound: number;
  documentsUpserted: number;
  skillsCreated: number;
  skillsSkipped: number;
}

export interface SkillStore {
  getOrCreateDefaultOrg(): Org;
  getOrg(id: string): Org | undefined;
  getOrgByToken(token: string): Org | undefined;
  listSources(orgId: string): Source[];
  ingestHelpCenter(orgId: string, url: string, max: number, onProgress?: (m: string) => void): Promise<IngestResult>;
  listSkills(orgId: string, status?: SkillStatus): Skill[];
  getSkillView(orgId: string, skillId: string): SkillView | undefined;
  approveSkill(orgId: string, skillId: string, approver: string): SkillView | undefined;
  saveEdit(orgId: string, skillId: string, edit: { title?: string; description?: string; bodyMd: string }, editor: string): SkillView | undefined;
  archiveSkill(orgId: string, skillId: string): boolean;
  regenerateSkill(orgId: string, skillId: string): Promise<SkillView | undefined>;
  detectStaleness(orgId: string, onProgress?: (m: string) => void): Promise<StalenessFlag[]>;
  getPublishedSkills(orgId: string): SkillView[];
}

/* ------------------------------- helpers ----------------------------------- */

const now = () => new Date().toISOString();
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const newId = (p: string) => `${p}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
const newToken = () => (randomUUID() + randomUUID()).replace(/-/g, "");

/* ------------------------------- FileStore --------------------------------- */

export class FileStore implements SkillStore {
  private readonly path: string;

  constructor(dataDir = process.env.CB_DATA_DIR ?? ".data") {
    this.path = resolve(dataDir, "db.json");
  }

  private read(): DB {
    if (!existsSync(this.path)) {
      return { orgs: [], sources: [], documents: [], skills: [], versions: [], flags: [] };
    }
    const db = JSON.parse(readFileSync(this.path, "utf8")) as DB;
    // tolerate older/partial files
    db.orgs ??= [];
    db.sources ??= [];
    db.documents ??= [];
    db.skills ??= [];
    db.versions ??= [];
    db.flags ??= [];
    return db;
  }

  private write(db: DB): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(db, null, 2), "utf8");
  }

  /* ------- orgs ------- */

  getOrCreateDefaultOrg(): Org {
    const db = this.read();
    let org = db.orgs[0];
    if (!org) {
      org = {
        id: newId("org"),
        name: "My Company",
        slug: "my-company",
        plan: "free",
        mcpToken: newToken(),
        createdAt: now(),
      };
      db.orgs.push(org);
      this.write(db);
    }
    return org;
  }

  getOrg(id: string): Org | undefined {
    return this.read().orgs.find((o) => o.id === id);
  }

  getOrgByToken(token: string): Org | undefined {
    return this.read().orgs.find((o) => o.mcpToken === token);
  }

  /* ------- sources ------- */

  listSources(orgId: string): Source[] {
    return this.read().sources.filter((s) => s.orgId === orgId);
  }

  private upsertSource(db: DB, orgId: string, type: SourceType, ref: string): Source {
    let src = db.sources.find((s) => s.orgId === orgId && s.type === type && s.ref === ref);
    if (!src) {
      src = { id: newId("src"), orgId, type, ref, syncState: "idle", lastSyncedAt: null };
      db.sources.push(src);
    }
    return src;
  }

  /* ------- ingest ------- */

  async ingestHelpCenter(
    orgId: string,
    url: string,
    max: number,
    onProgress?: (m: string) => void,
  ): Promise<IngestResult> {
    const base = new URL(url); // throws on bad input — caller handles
    // Do all slow/awaited work (crawl + LLM) BEFORE touching the DB, so the
    // actual persistence is a single synchronous read-modify-write that can't
    // interleave with — and clobber — another operation's write.
    const articles = await crawlHelpCenter(base.href, max, onProgress);
    onProgress?.(`Extracting skills from ${articles.length} article(s)...`);
    const drafts = await extractSkills(articles);

    const db = this.read();
    const source = this.upsertSource(db, orgId, "helpcenter", base.origin + base.pathname);

    // upsert documents (content hashes power staleness detection)
    const urlToDoc = new Map<string, Document>();
    let documentsUpserted = 0;
    for (const a of articles) {
      const hash = sha256(a.markdown);
      let doc = db.documents.find((d) => d.sourceId === source.id && d.externalId === a.url);
      if (doc) {
        doc.title = a.title;
        doc.content = a.markdown;
        doc.contentHash = hash;
        doc.fetchedAt = now();
      } else {
        doc = {
          id: newId("doc"),
          sourceId: source.id,
          externalId: a.url,
          title: a.title,
          content: a.markdown,
          contentHash: hash,
          fetchedAt: now(),
        };
        db.documents.push(doc);
      }
      urlToDoc.set(a.url, doc);
      documentsUpserted++;
    }
    source.lastSyncedAt = now();
    source.syncState = "idle";

    // create draft skills (skip slugs already present — never clobber an existing,
    // possibly human-edited, skill on re-ingest; staleness detection handles refresh)
    const existing = new Set(db.skills.filter((s) => s.orgId === orgId).map((s) => s.slug));
    let skillsCreated = 0;
    let skillsSkipped = 0;
    for (const d of drafts) {
      if (existing.has(d.slug)) {
        skillsSkipped++;
        continue;
      }
      existing.add(d.slug);
      const skillId = newId("skl");
      const versionId = newId("ver");
      const generatedFrom = d.sources
        .map((s) => urlToDoc.get(s.url)?.id)
        .filter((x): x is string => Boolean(x));
      const ts = now();
      db.versions.push({
        id: versionId,
        skillId,
        bodyMd: d.body,
        description: d.description,
        title: d.title,
        generatedFrom,
        createdBy: "ai",
        createdAt: ts,
        approvedBy: null,
        approvedAt: null,
      });
      db.skills.push({
        id: skillId,
        orgId,
        slug: d.slug,
        title: d.title,
        description: d.description,
        status: "draft",
        currentVersionId: versionId,
        createdAt: ts,
        updatedAt: ts,
      });
      skillsCreated++;
    }
    this.write(db);

    return {
      source,
      articlesFound: articles.length,
      documentsUpserted,
      skillsCreated,
      skillsSkipped,
    };
  }

  /* ------- skills ------- */

  listSkills(orgId: string, status?: SkillStatus): Skill[] {
    return this.read()
      .skills.filter((s) => s.orgId === orgId && (!status || s.status === status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private buildView(db: DB, skill: Skill): SkillView | undefined {
    const versions = db.versions
      .filter((v) => v.skillId === skill.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const current = versions.find((v) => v.id === skill.currentVersionId) ?? versions[0];
    if (!current) return undefined;
    const sources = current.generatedFrom
      .map((docId) => db.documents.find((d) => d.id === docId))
      .filter((d): d is Document => Boolean(d))
      .map((d) => ({ url: d.externalId, title: d.title }));
    const openFlags = db.flags.filter((f) => f.skillId === skill.id && !f.resolvedAt);
    return { skill, current, versions, sources, openFlags };
  }

  getSkillView(orgId: string, skillId: string): SkillView | undefined {
    const db = this.read();
    const skill = db.skills.find((s) => s.id === skillId && s.orgId === orgId);
    if (!skill) return undefined;
    return this.buildView(db, skill);
  }

  approveSkill(orgId: string, skillId: string, approver: string): SkillView | undefined {
    const db = this.read();
    const skill = db.skills.find((s) => s.id === skillId && s.orgId === orgId);
    if (!skill) return undefined;
    const version = db.versions.find((v) => v.id === skill.currentVersionId);
    if (!version) return undefined;
    version.approvedBy = approver;
    version.approvedAt = now();
    skill.status = "approved";
    skill.updatedAt = now();
    // approving the current version resolves any open staleness flags
    for (const f of db.flags) if (f.skillId === skill.id && !f.resolvedAt) f.resolvedAt = now();
    this.write(db);
    return this.buildView(db, skill);
  }

  saveEdit(
    orgId: string,
    skillId: string,
    edit: { title?: string; description?: string; bodyMd: string },
    editor: string,
  ): SkillView | undefined {
    const db = this.read();
    const skill = db.skills.find((s) => s.id === skillId && s.orgId === orgId);
    if (!skill) return undefined;
    const prev = db.versions.find((v) => v.id === skill.currentVersionId);
    const versionId = newId("ver");
    const ts = now();
    db.versions.push({
      id: versionId,
      skillId: skill.id,
      bodyMd: edit.bodyMd,
      description: edit.description ?? prev?.description ?? "",
      title: edit.title ?? prev?.title ?? skill.title,
      generatedFrom: prev?.generatedFrom ?? [],
      createdBy: editor === "ai" ? "ai" : "user",
      createdAt: ts,
      approvedBy: null,
      approvedAt: null,
    });
    skill.currentVersionId = versionId;
    skill.title = edit.title ?? skill.title;
    skill.description = edit.description ?? skill.description;
    skill.status = "draft"; // an edit needs (re-)approval before publishing
    skill.updatedAt = ts;
    this.write(db);
    return this.buildView(db, skill);
  }

  archiveSkill(orgId: string, skillId: string): boolean {
    const db = this.read();
    const skill = db.skills.find((s) => s.id === skillId && s.orgId === orgId);
    if (!skill) return false;
    skill.status = "archived";
    skill.updatedAt = now();
    this.write(db);
    return true;
  }

  /** Re-run extraction from this skill's source documents → a fresh AI draft version. */
  async regenerateSkill(orgId: string, skillId: string): Promise<SkillView | undefined> {
    const db = this.read();
    const skill = db.skills.find((s) => s.id === skillId && s.orgId === orgId);
    if (!skill) return undefined;
    const version = db.versions.find((v) => v.id === skill.currentVersionId);
    const docs = (version?.generatedFrom ?? [])
      .map((id) => db.documents.find((d) => d.id === id))
      .filter((d): d is Document => Boolean(d));
    if (docs.length === 0) return this.buildView(db, skill); // nothing to regenerate from
    const articles: Article[] = docs.map((d) => ({ url: d.externalId, title: d.title, markdown: d.content }));
    const drafts = await extractSkills(articles);
    const best = drafts[0];
    if (!best) return this.buildView(this.read(), skill);
    // saveEdit creates a new (unapproved) AI version and resets status to draft
    return this.saveEdit(orgId, skillId, { title: best.title, description: best.description, bodyMd: best.body }, "ai");
  }

  /* ------- staleness ------- */

  async detectStaleness(orgId: string, onProgress?: (m: string) => void): Promise<StalenessFlag[]> {
    const sources = this.listSources(orgId).filter((s) => s.type === "helpcenter");
    const created: StalenessFlag[] = [];

    for (const source of sources) {
      onProgress?.(`Re-crawling ${source.ref} ...`);
      // Re-crawl at least as many articles as we ingested, so skills built from
      // lower-ranked articles are still checked (not just the first N).
      const storedDocCount = this.read().documents.filter((d) => d.sourceId === source.id).length;
      let articles: Article[] = [];
      try {
        articles = await crawlHelpCenter(source.ref, Math.max(storedDocCount, 8), onProgress);
      } catch {
        continue;
      }
      const byUrl = new Map(articles.map((a) => [a.url, a]));

      const db = this.read();
      const docs = db.documents.filter((d) => d.sourceId === source.id);
      const changedDocIds: string[] = [];
      for (const doc of docs) {
        const fresh = byUrl.get(doc.externalId);
        if (!fresh) continue; // article removed — leave for now
        const hash = sha256(fresh.markdown);
        if (hash !== doc.contentHash) {
          doc.content = fresh.markdown;
          doc.contentHash = hash;
          doc.fetchedAt = now();
          changedDocIds.push(doc.id);
        }
      }

      if (changedDocIds.length > 0) {
        for (const skill of db.skills.filter((s) => s.orgId === orgId && s.status === "approved")) {
          const version = db.versions.find((v) => v.id === skill.currentVersionId);
          if (!version) continue;
          const hitDocs = version.generatedFrom.filter((id) => changedDocIds.includes(id));
          for (const docId of hitDocs) {
            const already = db.flags.some((f) => f.skillId === skill.id && f.documentId === docId && !f.resolvedAt);
            if (already) continue;
            const doc = db.documents.find((d) => d.id === docId);
            const flag: StalenessFlag = {
              id: newId("flg"),
              skillId: skill.id,
              documentId: docId,
              reason: `Source changed: ${doc?.title ?? docId}`,
              detectedAt: now(),
              resolvedAt: null,
            };
            db.flags.push(flag);
            created.push(flag);
          }
          if (hitDocs.length > 0) {
            skill.status = "stale";
            skill.updatedAt = now();
          }
        }
      }
      // mutate the source record inside THIS db snapshot (the loop's `source`
      // came from a different read and wouldn't be persisted).
      const dbSource = db.sources.find((s) => s.id === source.id);
      if (dbSource) dbSource.lastSyncedAt = now();
      this.write(db);
    }
    return created;
  }

  /* ------- publish ------- */

  /** Approved + stale skills (stale = approved-but-source-changed; still served, flagged). */
  getPublishedSkills(orgId: string): SkillView[] {
    const db = this.read();
    return db.skills
      .filter((s) => s.orgId === orgId && (s.status === "approved" || s.status === "stale"))
      .map((s) => this.buildView(db, s))
      .filter((v): v is SkillView => Boolean(v));
  }
}

/** Default singleton store for the app/CLI. */
export const store: SkillStore = new FileStore();
