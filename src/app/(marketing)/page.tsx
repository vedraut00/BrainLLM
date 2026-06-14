import Link from "next/link";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

const SKILL_SNIPPET = `---
name: refund-policy
description: "Answers customer questions about Acme's refund policy."
version: 1.4.0
source: notion://workspace/policies/refunds
---

# Refund Policy Skill

Use this skill when a user asks about returns, refunds,
or order cancellations.

## Rules
- Full refund within 30 days of purchase.
- Digital goods are non-refundable after download.
- Escalate disputes > $500 to a human agent.`;

const STEPS = [
  { n: "01", title: "Connect", body: "Point Brain at docs; continuous indexing keeps them in sync." },
  { n: "02", title: "Compile", body: "Cluster content into skills with YAML frontmatter — automatically." },
  { n: "03", title: "Validate", body: "Schema-check and eval prompts; a human approves before it ships." },
  { n: "04", title: "Ship", body: "Pull via API/SDK/Git for any LLM provider." },
];

const CATEGORY: Record<string, string> = {
  support: "bg-blue-50 text-blue-700",
  marketing: "bg-violet-50 text-violet-700",
  product: "bg-emerald-50 text-emerald-700",
  legal: "bg-amber-50 text-amber-700",
};

const EXAMPLE_SKILLS = [
  { file: "refund-policy.md", category: "support", source: "Intercom" },
  { file: "pricing-tiers.md", category: "marketing", source: "Webflow" },
  { file: "api-authentication.md", category: "product", source: "GitHub" },
  { file: "onboarding-flow.md", category: "product", source: "Notion" },
  { file: "brand-voice.md", category: "marketing", source: "Google Docs" },
  { file: "sla-commitments.md", category: "legal", source: "Confluence" },
];

const INTEGRATIONS = ["Notion", "Google Docs", "Confluence", "GitHub", "Webflow", "HubSpot", "Intercom"];

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  stale: "bg-amber-50 text-amber-700",
};

function hostOf(url?: string): string {
  try {
    return new URL(url ?? "").hostname.replace(/^www\./, "");
  } catch {
    return "compiled";
  }
}

export default function Landing() {
  // Show the org's REAL published skills if any exist; otherwise the curated examples.
  const org = store.getOrCreateDefaultOrg();
  const real = store.getPublishedSkills(org.id);
  const rows =
    real.length > 0
      ? real.slice(0, 6).map((v) => ({
          file: `${v.skill.slug}.md`,
          badge: v.skill.status,
          badgeClass: STATUS_BADGE[v.skill.status] ?? "bg-slate-100 text-slate-600",
          source: hostOf(v.sources[0]?.url),
        }))
      : EXAMPLE_SKILLS.map((e) => ({
          file: e.file,
          badge: e.category,
          badgeClass: CATEGORY[e.category] ?? "bg-slate-100 text-slate-600",
          source: e.source,
        }));
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 text-center sm:pt-24">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-muted">
          <span className="h-2 w-2 rounded-full bg-rust" /> Now in private beta
        </div>
        <h1 className="font-display text-5xl font-medium leading-[1.04] tracking-tight text-ink sm:text-7xl">
          Turn your docs into <em className="italic text-rust">skills</em> any LLM can run.
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted">
          Brain connects your product, support, and marketing docs and compiles them into portable skill files —
          validated, versioned, and ready to drop into any LLM stack without errors.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/connect"
            className="rounded-full bg-navy px-6 py-3.5 text-[15px] font-semibold text-white hover:opacity-90"
          >
            Compile your first skill →
          </Link>
          <a
            href="#how"
            className="rounded-full border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-ink hover:bg-slate-50"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Code card */}
      <section className="mx-auto mt-16 max-w-3xl px-6 pb-24">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_50px_rgba(2,6,23,0.07)]">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ec6a5e]" />
              <span className="h-3 w-3 rounded-full bg-[#f4bf4f]" />
              <span className="h-3 w-3 rounded-full bg-[#61c554]" />
            </div>
            <span className="rounded-md bg-ink px-2.5 py-1 font-mono text-xs font-medium text-white">SKILL.md</span>
            <span className="font-mono text-xs text-muted">manifest.json</span>
            <span className="font-mono text-xs text-muted">validate</span>
          </div>
          <pre className="overflow-x-auto px-6 py-5 font-mono text-[13px] leading-relaxed text-ink">{SKILL_SNIPPET}</pre>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center font-display text-4xl font-medium tracking-tight text-ink">How it works</h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                <div className="font-mono text-sm text-rust">{s.n}</div>
                <div className="mt-4 text-lg font-semibold text-ink">{s.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill files */}
      <section id="skills" className="border-t border-line bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="text-center font-display text-4xl font-medium tracking-tight text-ink">Skill files</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted">
            Deterministic compilation, Git versioning, multi-runtime compatibility, and built-in evaluations.
          </p>
          <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            {rows.map((s, i) => (
              <Link
                key={s.file}
                href="/skills"
                className={`flex items-center justify-between px-5 py-4 hover:bg-slate-50 ${
                  i > 0 ? "border-t border-line" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-ink">{s.file}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badgeClass}`}>
                    {s.badge}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted">
                  <span className="text-xs">{s.source}</span>
                  <span aria-hidden>›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="border-t border-line bg-white">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-medium tracking-tight text-ink">Integrations</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Compile from the tools you already use. Ship to OpenAI, Anthropic, or Gemini runtimes.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {INTEGRATIONS.map((name) => (
              <span
                key={name}
                className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink/80"
              >
                {name}
              </span>
            ))}
          </div>
          <div className="mt-14">
            <Link
              href="/connect"
              className="rounded-full bg-navy px-6 py-3.5 text-[15px] font-semibold text-white hover:opacity-90"
            >
              Compile your first skill →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
