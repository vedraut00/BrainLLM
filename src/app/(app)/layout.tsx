import type { ReactNode } from "react";
import Link from "next/link";
import { BrainMark } from "@/app/_brand";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connect", label: "Connect" },
  { href: "/skills", label: "Skills" },
  { href: "/publish", label: "Ship" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <BrainMark className="h-8 w-8" />
            <span className="font-display text-xl font-semibold tracking-tight text-ink">Brain</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-md px-3 py-1.5 text-muted hover:bg-slate-100 hover:text-ink"
              >
                {n.label}
              </Link>
            ))}
            <Link href="/" className="ml-2 text-xs text-muted/70 hover:text-ink">
              View site ↗
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-6 py-8 text-xs text-muted/70">
        Brain · skills are human-approved before any agent uses them.
      </footer>
    </div>
  );
}
