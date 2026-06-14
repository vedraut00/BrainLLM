/** Shared "Brain" glyph mark used in both the marketing and app headers. */
export function BrainMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`grid ${className} place-items-center rounded-xl bg-ink`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 6 L9 18 L3 12 Z" fill="white" />
        <rect x="11" y="5" width="2" height="14" rx="1" fill="white" />
        <path d="M15 6 L15 18 L21 12 Z" fill="white" />
      </svg>
    </span>
  );
}
