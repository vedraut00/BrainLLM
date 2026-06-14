import type { ReactNode } from "react";
import Link from "next/link";
import { BrainMark } from "@/app/_brand";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <BrainMark />
            <span className="font-display text-2xl font-semibold tracking-tight text-ink">Brain</span>
          </Link>
          <nav className="hidden items-center gap-9 text-[15px] text-muted sm:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#skills" className="hover:text-ink">Skill files</a>
            <a href="#integrations" className="hover:text-ink">Integrations</a>
          </nav>
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Get early access
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2.5">
            <BrainMark />
            <span className="font-display text-lg font-semibold text-ink">Brain</span>
          </div>
          <span>© 2026 Brain Company</span>
          <div className="flex gap-6">
            <Link href="/dashboard" className="hover:text-ink">App</Link>
            <a href="#how" className="hover:text-ink">Docs</a>
            <a href="#skills" className="hover:text-ink">Changelog</a>
            <a href="#integrations" className="hover:text-ink">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
