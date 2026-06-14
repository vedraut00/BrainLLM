import { store } from "@/lib/store";
import { Card } from "@/app/_ui";
import { ingestAction } from "@/app/actions";

const ERRORS: Record<string, string> = {
  "missing-url": "Please enter a help-center URL.",
  "bad-url": "That doesn't look like a valid URL.",
  "ingest-failed":
    "Couldn't ingest that site — it may be down, blocking crawlers, or the LLM key/quota failed. Check your GEMINI_API_KEY in .env and try again.",
};

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const org = await store.getOrCreateDefaultOrg();
  const sources = await store.listSources(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink">Connect a source</h1>
        <p className="mt-1 text-muted">
          v1 reads <strong>public help centers</strong> (Zendesk, Intercom, most docs sites) — no login
          required. Slack, Google Drive, Notion and Intercom/Zendesk ticket connectors come next.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERRORS[error] ?? "Something went wrong."}
        </div>
      )}

      <Card>
        <form action={ingestAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Help-center URL</label>
            <input
              name="url"
              type="url"
              required
              placeholder="https://support.acme.com/hc/en-us"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Max articles to read</label>
            <input
              name="max"
              type="number"
              min={1}
              max={25}
              defaultValue={8}
              className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <button className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Ingest &amp; draft skills
          </button>
          <p className="text-xs text-slate-500">
            This crawls the site and runs extraction — it can take ~30–60 seconds. You&apos;ll land on the
            Skills page when it&apos;s done.
          </p>
        </form>
      </Card>

      {sources.length > 0 && (
        <Card>
          <h2 className="font-semibold">Connected sources</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {sources.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>
                  <span className="font-mono text-xs text-slate-400">[{s.type}]</span> {s.ref}
                </span>
                <span className="text-xs text-slate-400">
                  {s.lastSyncedAt ? `synced ${s.lastSyncedAt.slice(0, 10)}` : "not synced"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
