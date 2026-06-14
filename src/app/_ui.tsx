import type { ReactNode } from "react";
import type { SkillStatus } from "@/lib/store";

const STATUS_STYLES: Record<SkillStatus, { label: string; cls: string }> = {
  draft: { label: "📝 Draft", cls: "bg-amber-100 text-amber-800" },
  approved: { label: "✅ Approved", cls: "bg-emerald-100 text-emerald-800" },
  stale: { label: "⚠️ Stale", cls: "bg-orange-100 text-orange-800" },
  archived: { label: "🗄️ Archived", cls: "bg-slate-200 text-slate-600" },
};

export function StatusBadge({ status }: { status: SkillStatus }) {
  const s = STATUS_STYLES[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}>{children}</div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-4">
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
