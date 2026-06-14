import Link from "next/link";
import { store } from "@/lib/store";
import type { SkillStatus } from "@/lib/store";
import { StatusBadge, Card } from "@/app/_ui";

const TABS: { key: SkillStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "approved", label: "Approved" },
  { key: "stale", label: "Stale" },
  { key: "archived", label: "Archived" },
];

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; ingested?: string; checked?: string }>;
}) {
  const sp = await searchParams;
  const org = await store.getOrCreateDefaultOrg();
  const filter = (sp.status as SkillStatus | undefined) ?? undefined;
  const skills = await store.listSkills(org.id, filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink">Skills</h1>
        <Link
          href="/connect"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          + Connect source
        </Link>
      </div>

      {sp.ingested !== undefined &&
        (Number(sp.ingested) > 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Ingest complete — {sp.ingested} new draft skill(s) below. Review and approve the ones you trust.
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ingest finished but produced no new skills. The site may be JavaScript-rendered, thin, or already
            ingested. Try a different help center or raise “max articles”.
          </div>
        ))}
      {sp.checked && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          Staleness check complete. Any approved skill whose source changed is now marked Stale.
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const active = (filter ?? "all") === t.key;
          const href = t.key === "all" ? "/skills" : `/skills?status=${t.key}`;
          return (
            <Link
              key={t.key}
              href={href}
              className={`border-b-2 px-3 py-2 text-sm ${
                active ? "border-slate-900 font-medium text-slate-800" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {skills.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">
            No skills{filter ? ` with status "${filter}"` : ""} yet.{" "}
            <Link href="/connect" className="text-slate-900 underline">
              Connect a source
            </Link>{" "}
            to generate some.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {skills.map((s) => (
            <li key={s.id}>
              <Link
                href={`/skills/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  <div className="font-medium text-slate-900">{s.title}</div>
                  <div className="text-xs text-slate-500">{s.description}</div>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
