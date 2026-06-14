import Link from "next/link";
import { store } from "@/lib/store";
import { Card } from "@/app/_ui";

const MCP_BASE = process.env.CB_PUBLIC_MCP_BASE ?? "http://localhost:8787";

export default async function PublishPage() {
  const org = store.getOrCreateDefaultOrg();
  const published = store.getPublishedSkills(org.id);
  const endpoint = `${MCP_BASE}/mcp/${org.mcpToken}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink">Ship</h1>
        <p className="mt-1 text-slate-600">
          Your approved skills, available two ways: a hosted MCP endpoint and a downloadable bundle of SKILL.md files.
        </p>
      </div>

      <Card>
        <h2 className="font-semibold">Hosted MCP endpoint</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add this server to any MCP client. It serves your approved skills as resources and the{" "}
          <code>list_skills</code> / <code>get_skill</code> tools. Start it locally with{" "}
          <code className="rounded bg-slate-100 px-1">npm run mcp</code>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100">{endpoint}</pre>
        <p className="mt-2 text-xs text-slate-500">
          Token (keep secret): <code className="break-all">{org.mcpToken}</code>
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Download skill bundle</h2>
            <p className="mt-1 text-sm text-slate-600">
              A <code>.zip</code> of your approved skills as <code>SKILL.md</code> files (Agent Skill format) plus a{" "}
              <code>skills.json</code> manifest.
            </p>
          </div>
          <a
            href="/api/export"
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              published.length === 0
                ? "pointer-events-none bg-slate-200 text-slate-400"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            Download .zip
          </a>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Currently published ({published.length})</h2>
        {published.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">
            Nothing published yet — approve some skills in{" "}
            <Link href="/skills?status=draft" className="text-slate-900 underline">
              Skills
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {published.map((v) => (
              <li key={v.skill.id} className="flex justify-between">
                <Link href={`/skills/${v.skill.id}`} className="text-slate-700 hover:text-slate-800">
                  {v.current.title}
                </Link>
                <span className="font-mono text-xs text-slate-400">skill://{v.skill.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
