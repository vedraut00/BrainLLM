/**
 * Production storage backend — Postgres via Supabase's REST API (PostgREST),
 * called with plain `fetch` (no supabase-js, so no WebSocket/Node-version issues).
 * Uses the server-side SECRET key (service_role), which bypasses RLS; org scoping
 * is enforced in code. Implements the same `SkillStore` interface as FileStore.
 */
import { createHash, randomUUID } from "node:crypto";
import { crawlHelpCenter, type Article } from "./crawl";
import { extractSkills } from "./extract";
import type {
  SkillStore,
  Org,
  Source,
  SourceType,
  Document,
  Skill,
  SkillStatus,
  SkillVersion,
  StalenessFlag,
  SkillView,
  IngestResult,
} from "./store";

const now = () => new Date().toISOString();
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const newId = (p: string) => `${p}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
const newToken = () => (randomUUID() + randomUUID()).replace(/-/g, "");
const enc = encodeURIComponent;

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
const toOrg = (r: Row): Org => ({ id: r.id, name: r.name, slug: r.slug, plan: r.plan, mcpToken: r.mcp_token, createdAt: r.created_at });
const toSource = (r: Row): Source => ({ id: r.id, orgId: r.org_id, type: r.type, ref: r.ref, syncState: r.sync_state, lastSyncedAt: r.last_synced_at });
const toDoc = (r: Row): Document => ({ id: r.id, sourceId: r.source_id, externalId: r.external_id, title: r.title, content: r.content, contentHash: r.content_hash, fetchedAt: r.fetched_at });
const toSkill = (r: Row): Skill => ({ id: r.id, orgId: r.org_id, slug: r.slug, title: r.title, description: r.description, status: r.status, currentVersionId: r.current_version_id, createdAt: r.created_at, updatedAt: r.updated_at });
const toVersion = (r: Row): SkillVersion => ({ id: r.id, skillId: r.skill_id, bodyMd: r.body_md, description: r.description, title: r.title, generatedFrom: r.generated_from ?? [], createdBy: r.created_by, createdAt: r.created_at, approvedBy: r.approved_by, approvedAt: r.approved_at });
const toFlag = (r: Row): StalenessFlag => ({ id: r.id, skillId: r.skill_id, documentId: r.document_id, reason: r.reason, detectedAt: r.detected_at, resolvedAt: r.resolved_at });
/* eslint-enable @typescript-eslint/no-explicit-any */

export class SupabaseStore implements SkillStore {
  private readonly rest: string;
  private readonly headers: Record<string, string>;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SupabaseStore needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY. See .env.example.");
    }
    this.rest = `${url.replace(/\/+$/, "")}/rest/v1`;
    this.headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  }

  /* ---- low-level PostgREST helpers ---- */

  private async sel(path: string): Promise<Row[]> {
    const res = await fetch(`${this.rest}/${path}`, { headers: this.headers });
    if (!res.ok) throw new Error(`Supabase GET ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return (await res.json()) as Row[];
  }

  private async insert(table: string, row: Row): Promise<void> {
    const res = await fetch(`${this.rest}/${table}`, {
      method: "POST",
      headers: { ...this.headers, Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(`Supabase POST ${table} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  private async patch(table: string, filter: string, body: Row): Promise<void> {
    const res = await fetch(`${this.rest}/${table}?${filter}`, {
      method: "PATCH",
      headers: { ...this.headers, Prefer: "return=minimal" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Supabase PATCH ${table} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  /* ------- orgs ------- */

  async getOrCreateDefaultOrg(): Promise<Org> {
    const rows = await this.sel("orgs?select=*&order=created_at.asc&limit=1");
    if (rows[0]) return toOrg(rows[0]);
    const row = { id: newId("org"), name: "My Company", slug: "my-company", plan: "free", mcp_token: newToken(), created_at: now() };
    await this.insert("orgs", row);
    return toOrg(row);
  }

  async getOrg(id: string): Promise<Org | undefined> {
    const rows = await this.sel(`orgs?select=*&id=eq.${enc(id)}&limit=1`);
    return rows[0] ? toOrg(rows[0]) : undefined;
  }

  async getOrgByToken(token: string): Promise<Org | undefined> {
    const rows = await this.sel(`orgs?select=*&mcp_token=eq.${enc(token)}&limit=1`);
    return rows[0] ? toOrg(rows[0]) : undefined;
  }

  /* ------- sources ------- */

  async listSources(orgId: string): Promise<Source[]> {
    return (await this.sel(`sources?select=*&org_id=eq.${enc(orgId)}`)).map(toSource);
  }

  private async upsertSource(orgId: string, type: SourceType, ref: string): Promise<Source> {
    const rows = await this.sel(`sources?select=*&org_id=eq.${enc(orgId)}&type=eq.${enc(type)}&ref=eq.${enc(ref)}&limit=1`);
    if (rows[0]) return toSource(rows[0]);
    const row = { id: newId("src"), org_id: orgId, type, ref, sync_state: "idle", last_synced_at: null as string | null };
    await this.insert("sources", row);
    return toSource(row);
  }

  /* ------- ingest ------- */

  async ingestHelpCenter(orgId: string, url: string, max: number, onProgress?: (m: string) => void): Promise<IngestResult> {
    const base = new URL(url);
    const articles = await crawlHelpCenter(base.href, max, onProgress);
    onProgress?.(`Extracting skills from ${articles.length} article(s)...`);
    const drafts = await extractSkills(articles);

    const source = await this.upsertSource(orgId, "helpcenter", base.origin + base.pathname);

    const existingDocs = await this.sel(`documents?select=*&source_id=eq.${enc(source.id)}`);
    const byExternal = new Map<string, Document>(existingDocs.map((r) => [r.external_id as string, toDoc(r)]));

    const urlToDoc = new Map<string, Document>();
    let documentsUpserted = 0;
    for (const a of articles) {
      const hash = sha256(a.markdown);
      const existing = byExternal.get(a.url);
      if (existing) {
        await this.patch("documents", `id=eq.${enc(existing.id)}`, { title: a.title, content: a.markdown, content_hash: hash, fetched_at: now() });
        urlToDoc.set(a.url, existing);
      } else {
        const row = { id: newId("doc"), source_id: source.id, external_id: a.url, title: a.title, content: a.markdown, content_hash: hash, fetched_at: now() };
        await this.insert("documents", row);
        urlToDoc.set(a.url, toDoc(row));
      }
      documentsUpserted++;
    }
    await this.patch("sources", `id=eq.${enc(source.id)}`, { last_synced_at: now(), sync_state: "idle" });

    const existingSkills = await this.sel(`skills?select=slug&org_id=eq.${enc(orgId)}`);
    const existingSlugs = new Set<string>(existingSkills.map((r) => r.slug as string));

    let skillsCreated = 0;
    let skillsSkipped = 0;
    for (const d of drafts) {
      if (existingSlugs.has(d.slug)) {
        skillsSkipped++;
        continue;
      }
      existingSlugs.add(d.slug);
      const skillId = newId("skl");
      const versionId = newId("ver");
      const generatedFrom = d.sources.map((s) => urlToDoc.get(s.url)?.id).filter((x): x is string => Boolean(x));
      const ts = now();
      // Insert the skill BEFORE its version — skill_versions.skill_id has a FK to skills(id).
      // (current_version_id is a plain column with no FK, so pointing it at the not-yet-inserted version is fine.)
      await this.insert("skills", {
        id: skillId, org_id: orgId, slug: d.slug, title: d.title, description: d.description,
        status: "draft", current_version_id: versionId, created_at: ts, updated_at: ts,
      });
      await this.insert("skill_versions", {
        id: versionId, skill_id: skillId, body_md: d.body, description: d.description, title: d.title,
        generated_from: generatedFrom, created_by: "ai", created_at: ts, approved_by: null, approved_at: null,
      });
      skillsCreated++;
    }

    return { source, articlesFound: articles.length, documentsUpserted, skillsCreated, skillsSkipped };
  }

  /* ------- skills ------- */

  async listSkills(orgId: string, status?: SkillStatus): Promise<Skill[]> {
    const statusFilter = status ? `&status=eq.${enc(status)}` : "";
    return (await this.sel(`skills?select=*&org_id=eq.${enc(orgId)}${statusFilter}&order=updated_at.desc`)).map(toSkill);
  }

  private async getSkill(orgId: string, skillId: string): Promise<Skill | undefined> {
    const rows = await this.sel(`skills?select=*&id=eq.${enc(skillId)}&org_id=eq.${enc(orgId)}&limit=1`);
    return rows[0] ? toSkill(rows[0]) : undefined;
  }

  private async buildView(skill: Skill): Promise<SkillView | undefined> {
    const versions = (await this.sel(`skill_versions?select=*&skill_id=eq.${enc(skill.id)}&order=created_at.desc`)).map(toVersion);
    const current = versions.find((v) => v.id === skill.currentVersionId) ?? versions[0];
    if (!current) return undefined;
    let sources: { url: string; title: string }[] = [];
    if (current.generatedFrom.length > 0) {
      const ids = current.generatedFrom.map(enc).join(",");
      sources = (await this.sel(`documents?select=*&id=in.(${ids})`)).map(toDoc).map((d) => ({ url: d.externalId, title: d.title }));
    }
    const openFlags = (await this.sel(`staleness_flags?select=*&skill_id=eq.${enc(skill.id)}&resolved_at=is.null`)).map(toFlag);
    return { skill, current, versions, sources, openFlags };
  }

  async getSkillView(orgId: string, skillId: string): Promise<SkillView | undefined> {
    const skill = await this.getSkill(orgId, skillId);
    return skill ? this.buildView(skill) : undefined;
  }

  async approveSkill(orgId: string, skillId: string, approver: string): Promise<SkillView | undefined> {
    const skill = await this.getSkill(orgId, skillId);
    if (!skill) return undefined;
    await this.patch("skill_versions", `id=eq.${enc(skill.currentVersionId)}`, { approved_by: approver, approved_at: now() });
    await this.patch("skills", `id=eq.${enc(skill.id)}`, { status: "approved", updated_at: now() });
    await this.patch("staleness_flags", `skill_id=eq.${enc(skill.id)}&resolved_at=is.null`, { resolved_at: now() });
    return this.buildView({ ...skill, status: "approved" });
  }

  async saveEdit(
    orgId: string,
    skillId: string,
    edit: { title?: string; description?: string; bodyMd: string },
    editor: string,
  ): Promise<SkillView | undefined> {
    const skill = await this.getSkill(orgId, skillId);
    if (!skill) return undefined;
    const prevRows = await this.sel(`skill_versions?select=*&id=eq.${enc(skill.currentVersionId)}&limit=1`);
    const prev = prevRows[0] ? toVersion(prevRows[0]) : undefined;
    const versionId = newId("ver");
    const ts = now();
    await this.insert("skill_versions", {
      id: versionId, skill_id: skill.id, body_md: edit.bodyMd,
      description: edit.description ?? prev?.description ?? "",
      title: edit.title ?? prev?.title ?? skill.title,
      generated_from: prev?.generatedFrom ?? [], created_by: editor === "ai" ? "ai" : "user",
      created_at: ts, approved_by: null, approved_at: null,
    });
    const title = edit.title ?? skill.title;
    const description = edit.description ?? skill.description;
    await this.patch("skills", `id=eq.${enc(skill.id)}`, { current_version_id: versionId, title, description, status: "draft", updated_at: ts });
    return this.buildView({ ...skill, currentVersionId: versionId, title, description, status: "draft" });
  }

  async archiveSkill(orgId: string, skillId: string): Promise<boolean> {
    const skill = await this.getSkill(orgId, skillId);
    if (!skill) return false;
    await this.patch("skills", `id=eq.${enc(skill.id)}`, { status: "archived", updated_at: now() });
    return true;
  }

  async regenerateSkill(orgId: string, skillId: string): Promise<SkillView | undefined> {
    const skill = await this.getSkill(orgId, skillId);
    if (!skill) return undefined;
    const view = await this.buildView(skill);
    const docIds = view?.current.generatedFrom ?? [];
    if (docIds.length === 0) return view;
    const articles: Article[] = (await this.sel(`documents?select=*&id=in.(${docIds.map(enc).join(",")})`))
      .map(toDoc)
      .map((d) => ({ url: d.externalId, title: d.title, markdown: d.content }));
    if (articles.length === 0) return view;
    const drafts = await extractSkills(articles);
    const best = drafts[0];
    if (!best) return view;
    return this.saveEdit(orgId, skillId, { title: best.title, description: best.description, bodyMd: best.body }, "ai");
  }

  /* ------- staleness ------- */

  async detectStaleness(orgId: string, onProgress?: (m: string) => void): Promise<StalenessFlag[]> {
    const sources = (await this.listSources(orgId)).filter((s) => s.type === "helpcenter");
    const created: StalenessFlag[] = [];

    for (const source of sources) {
      onProgress?.(`Re-crawling ${source.ref} ...`);
      const docs = (await this.sel(`documents?select=*&source_id=eq.${enc(source.id)}`)).map(toDoc);
      let articles: Article[] = [];
      try {
        articles = await crawlHelpCenter(source.ref, Math.max(docs.length, 8), onProgress);
      } catch {
        continue;
      }
      const byUrl = new Map(articles.map((a) => [a.url, a]));

      const changedDocIds: string[] = [];
      for (const doc of docs) {
        const fresh = byUrl.get(doc.externalId);
        if (!fresh) continue;
        const hash = sha256(fresh.markdown);
        if (hash !== doc.contentHash) {
          await this.patch("documents", `id=eq.${enc(doc.id)}`, { content: fresh.markdown, content_hash: hash, fetched_at: now() });
          changedDocIds.push(doc.id);
        }
      }

      if (changedDocIds.length > 0) {
        const approved = await this.listSkills(orgId, "approved");
        for (const skill of approved) {
          const view = await this.buildView(skill);
          const version = view?.current;
          if (!version) continue;
          const hitDocs = version.generatedFrom.filter((id) => changedDocIds.includes(id));
          for (const docId of hitDocs) {
            const exists = await this.sel(`staleness_flags?select=id&skill_id=eq.${enc(skill.id)}&document_id=eq.${enc(docId)}&resolved_at=is.null&limit=1`);
            if (exists[0]) continue;
            const flag: StalenessFlag = { id: newId("flg"), skillId: skill.id, documentId: docId, reason: `Source changed: ${docId}`, detectedAt: now(), resolvedAt: null };
            await this.insert("staleness_flags", { id: flag.id, skill_id: flag.skillId, document_id: flag.documentId, reason: flag.reason, detected_at: flag.detectedAt, resolved_at: null });
            created.push(flag);
          }
          if (hitDocs.length > 0) {
            await this.patch("skills", `id=eq.${enc(skill.id)}`, { status: "stale", updated_at: now() });
          }
        }
      }
      await this.patch("sources", `id=eq.${enc(source.id)}`, { last_synced_at: now() });
    }
    return created;
  }

  /* ------- publish ------- */

  async getPublishedSkills(orgId: string): Promise<SkillView[]> {
    const skills = (await this.sel(`skills?select=*&org_id=eq.${enc(orgId)}&status=in.(approved,stale)`)).map(toSkill);
    const views = await Promise.all(skills.map((s) => this.buildView(s)));
    return views.filter((v): v is SkillView => Boolean(v));
  }
}
