/**
 * Domain + persistence layer for Company Brain.
 *
 * Implements the core data model (plan §4.5) and the full skill lifecycle:
 *   ingest (help-center) -> extract drafts -> review/edit/approve/version
 *   -> publish (export + MCP) -> keep-current (staleness detection).
 *
 * `SkillStore` is the (async) interface the rest of the app talks to.
 *   - `FileStore`     — dev backend (a single JSON file under .data/).
 *   - `SupabaseStore` — production backend (Postgres). Same interface, no caller changes.
 * The exported `store` selects one via env `CB_STORE` (file | supabase).
 */
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { crawlHelpCenter, type Article } from "./crawl";
import { extractSkills } from "./extract";
import { SupabaseStore } from "./supabase-store";

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
  getOrCreateDefaultOrg(): Promise<Org>;
  getOrg(id: string): Promise<Org | undefined>;
  getOrgByToken(token: string): Promise<Org | undefined>;
  listSources(orgId: string): Promise<Source[]>;
  ingestHelpCenter(orgId: string, url: string, max: number, onProgress?: (m: string) => void): Promise<IngestResult>;
  listSkills(orgId: string, status?: SkillStatus): Promise<Skill[]>;
  getSkillView(orgId: string, skillId: string): Promise<SkillView | undefined>;
  approveSkill(orgId: string, skillId: string, approver: string): Promise<SkillView | undefined>;
  saveEdit(orgId: string, skillId: string, edit: { title?: string; description?: string; bodyMd: string }, editor: string): Promise<SkillView | undefined>;
  archiveSkill(orgId: string, skillId: string): Promise<boolean>;
  regenerateSkill(orgId: string, skillId: string): Promise<SkillView | undefined>;
  detectStaleness(orgId: string, onProgress?: (m: string) => void): Promise<StalenessFlag[]>;
  getPublishedSkills(orgId: string): Promise<SkillView[]>;
}

/* ------------------------------- helpers ----------------------------------- */

export const now = () => new Date().toISOString();
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const newId = (p: string) => `${p}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
export const newToken = () => (randomUUID() + randomUUID()).replace(/-/g, "");

/** Shared extraction step used by ingest + regenerate (kept here so both stores reuse it). */
export function buildArticlesFromDocs(docs: Document[]): Article[] {
  return docs.map((d) => ({ url: d.externalId, title: d.title, markdown: d.content }));
}

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

  async getOrCreateDefaultOrg(): Promise<Org> {
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

  async getOrg(id: string): Promise<Org | undefined> {
    return this.read().orgs.find((o) => o.id === id);
  }

  async getOrgByToken(token: string): Promise<Org | undefined> {
    return this.read().orgs.find((o) => o.mcpToken === token);
  }

  /* ------- sources ------- */

  async listSources(orgId: string): Promise<Source[]> {
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
    const base = new URL(url);
    const articles = await crawlHelpCenter(base.href, max, onProgress);
    onProgress?.(`Extracting skills from ${articles.length} article(s)...`);
    const drafts = await extractSkills(articles);

    const db = this.read();
    const source = this.upsertSource(db, orgId, "helpcenter", base.origin + base.pathname);

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
      const generatedFrom = d.sources.map((s) => urlToDoc.get(s.url)?.id).filter((x): x is string => Boolean(x));
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

    return { source, articlesFound: articles.length, documentsUpserted, skillsCreated, skillsSkipped };
  }

  /* ------- skills ------- */

  async listSkills(orgId: string, status?: SkillStatus): Promise<Skill[]> {
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

  async getSkillView(orgId: string, skillId: string): Promise<SkillView | undefined> {
    const db = this.read();
    const skill = db.skills.find((s) => s.id === skillId && s.orgId === orgId);
    if (!skill) return undefined;
    return this.buildView(db, skill);
  }

  async approveSkill(orgId: string, skillId: string, approver: string): Promise<SkillView | undefined> {
    const db = this.read();
    const skill = db.skills.find((s) => s.id === skillId && s.orgId === orgId);
    if (!skill) return undefined;
    const version = db.versions.find((v) => v.id === skill.currentVersionId);
    if (!version) return undefined;
    version.approvedBy = approver;
    version.approvedAt = now();
    skill.status = "approved";
    skill.updatedAt = now();
    for (const f of db.flags) if (f.skillId === skill.id && !f.resolvedAt) f.resolvedAt = now();
    this.write(db);
    return this.buildView(db, skill);
  }

  async saveEdit(
    orgId: string,
    skillId: string,
    edit: { title?: string; description?: string; bodyMd: string },
    editor: string,
  ): Promise<SkillView | undefined> {
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
    skill.status = "draft";
    skill.updatedAt = ts;
    this.write(db);
    return this.buildView(db, skill);
  }

  async archiveSkill(orgId: string, skillId: string): Promise<boolean> {
    const db = this.read();
    const skill = db.skills.find((s) => s.id === skillId && s.orgId === orgId);
    if (!skill) return false;
    skill.status = "archived";
    skill.updatedAt = now();
    this.write(db);
    return true;
  }

  async regenerateSkill(orgId: string, skillId: string): Promise<SkillView | undefined> {
    const db = this.read();
    const skill = db.skills.find((s) => s.id === skillId && s.orgId === orgId);
    if (!skill) return undefined;
    const version = db.versions.find((v) => v.id === skill.currentVersionId);
    const docs = (version?.generatedFrom ?? [])
      .map((id) => db.documents.find((d) => d.id === id))
      .filter((d): d is Document => Boolean(d));
    if (docs.length === 0) return this.buildView(db, skill);
    const drafts = await extractSkills(buildArticlesFromDocs(docs));
    const best = drafts[0];
    if (!best) return this.buildView(this.read(), skill);
    return this.saveEdit(orgId, skillId, { title: best.title, description: best.description, bodyMd: best.body }, "ai");
  }

  /* ------- staleness ------- */

  async detectStaleness(orgId: string, onProgress?: (m: string) => void): Promise<StalenessFlag[]> {
    const sources = (await this.listSources(orgId)).filter((s) => s.type === "helpcenter");
    const created: StalenessFlag[] = [];

    for (const source of sources) {
      onProgress?.(`Re-crawling ${source.ref} ...`);
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
        if (!fresh) continue;
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
      const dbSource = db.sources.find((s) => s.id === source.id);
      if (dbSource) dbSource.lastSyncedAt = now();
      this.write(db);
    }
    return created;
  }

  /* ------- publish ------- */

  async getPublishedSkills(orgId: string): Promise<SkillView[]> {
    const db = this.read();
    return db.skills
      .filter((s) => s.orgId === orgId && (s.status === "approved" || s.status === "stale"))
      .map((s) => this.buildView(db, s))
      .filter((v): v is SkillView => Boolean(v));
  }
}

/* ------------------------------- selector ---------------------------------- */

/** The app/CLI/MCP all import this singleton. `CB_STORE=supabase` switches to Postgres. */
export const store: SkillStore =
  (process.env.CB_STORE ?? "file").toLowerCase() === "supabase" ? new SupabaseStore() : new FileStore();
