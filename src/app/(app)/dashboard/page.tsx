import Link from "next/link";
import { store } from "@/lib/store";
import type { SkillStatus } from "@/lib/store";
import { Card, Stat } from "@/app/_ui";
import { detectStaleAction } from "@/app/actions";

const MCP_BASE = process.env.CB_PUBLIC_MCP_BASE ?? "http://localhost:8787";

export default async function Dashboard() {
  const org = await store.getOrCreateDefaultOrg();
  const skills = await store.listSkills(org.id);
  const sources = await store.listSources(org.id);
  const count = (s: SkillStatus) => skills.filter((k) => k.status === s).length;
  const endpoint = `${MCP_BASE}/mcp/${org.mcpToken}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink">Welcome to {org.name}</h1>
        <p className="mt-1 text-muted">
          Turn your scattered docs into human-approved skills your AI agents can trust.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Sources" value={sources.length} />
        <Stat label="Draft" value={count("draft")} />
        <Stat label="Approved" value={count("approved")} />
        <Stat label="Stale" value={count("stale")} />
        <Stat label="Archived" value={count("archived")} />
      </div>

      {skills.length === 0 ? (
        <Card>
          <h2 className="font-semibold">Get started</h2>
          <p className="mt-1 text-sm text-muted">
            Connect a public help center and we&apos;ll draft skills from it in about a minute.
          </p>
          <Link
            href="/connect"
            className="mt-4 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Connect your first source →
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Next step</h2>
            <p className="mt-1 text-sm text-muted">
              {count("draft") > 0
                ? `You have ${count("draft")} draft skill(s) waiting for review.`
                : "All caught up. Connect another source or check for stale skills."}
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/skills?status=draft"
                className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Review drafts
              </Link>
              <Link
                href="/connect"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Connect source
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Keep current</h2>
            <p className="mt-1 text-sm text-muted">
              Re-check your sources; we flag approved skills whose source changed.
            </p>
            <form action={detectStaleAction} className="mt-4">
              <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Check for stale skills
              </button>
            </form>
          </Card>
        </div>
      )}

      <Card>
        <h2 className="font-semibold">Your MCP endpoint</h2>
        <p className="mt-1 text-sm text-muted">
          Point any MCP-capable AI agent here to use your <strong>approved</strong> skills:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-navy px-4 py-3 text-xs text-slate-100">{endpoint}</pre>
        <p className="mt-2 text-xs text-slate-500">
          Only approved (and stale-but-approved) skills are served. Manage in{" "}
          <Link href="/publish" className="text-slate-900 underline">
            Publish
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
