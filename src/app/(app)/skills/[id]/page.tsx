import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { StatusBadge, Card } from "@/app/_ui";
import { Markdown } from "@/app/_markdown";
import { approveAction, archiveAction, regenerateAction, saveEditAction } from "@/app/actions";

export default async function SkillDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = store.getOrCreateDefaultOrg();
  const view = store.getSkillView(org.id, id);
  if (!view) notFound();

  const { skill, current, versions, sources, openFlags } = view;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/skills" className="text-sm text-slate-500 hover:text-slate-800">
          ← All skills
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink">{current.title}</h1>
          <StatusBadge status={skill.status} />
        </div>
        <p className="mt-1 font-mono text-xs text-slate-400">{skill.slug}</p>
      </div>

      {openFlags.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          ⚠️ <strong>Source changed since approval.</strong> Re-review and approve to clear{" "}
          {openFlags.length} flag(s). The skill is still served to agents but marked stale.
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <form action={approveAction}>
          <input type="hidden" name="skillId" value={skill.id} />
          <button
            disabled={skill.status === "approved"}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {skill.status === "approved" ? "✅ Approved" : "Approve current version"}
          </button>
        </form>
        {sources.length > 0 && (
          <form action={regenerateAction}>
            <input type="hidden" name="skillId" value={skill.id} />
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              ↻ Regenerate from sources
            </button>
          </form>
        )}
        {skill.status !== "archived" && (
          <form action={archiveAction}>
            <input type="hidden" name="skillId" value={skill.id} />
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Archive
            </button>
          </form>
        )}
      </div>

      {/* Rendered preview */}
      <Card>
        <h2 className="font-semibold">Preview</h2>
        <p className="mt-1 text-xs text-slate-500">How this skill reads to a reviewer. Edit the source below.</p>
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <Markdown text={current.bodyMd} />
        </div>
      </Card>

      {/* Edit form */}
      <Card>
        <h2 className="font-semibold">Review &amp; edit</h2>
        <p className="mt-1 text-sm text-slate-600">
          Editing creates a new version and resets status to <em>draft</em> — approve again to publish it.
        </p>
        <form action={saveEditAction} className="mt-4 space-y-4">
          <input type="hidden" name="skillId" value={skill.id} />
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              name="title"
              defaultValue={current.title}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description (when to use)</label>
            <input
              name="description"
              defaultValue={current.description}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">SKILL.md body</label>
            <textarea
              name="bodyMd"
              defaultValue={current.bodyMd}
              rows={16}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs leading-relaxed focus:border-slate-400 focus:outline-none"
            />
          </div>
          <button className="rounded-lg border border-slate-900 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100">
            Save new version
          </button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Sources</h2>
          {sources.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">No linked sources.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                    {s.title || s.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold">Version history ({versions.length})</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between">
                <span className="text-slate-700">
                  {v.id === skill.currentVersionId && <span className="mr-1 text-slate-900">●</span>}
                  by {v.createdBy} · {v.createdAt.slice(0, 16).replace("T", " ")}
                </span>
                <span className="text-xs text-slate-400">
                  {v.approvedAt ? `approved ${v.approvedAt.slice(0, 10)}` : "unapproved"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
