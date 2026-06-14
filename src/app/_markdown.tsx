import type { ReactNode } from "react";

/**
 * Minimal, SAFE markdown → React renderer for skill previews.
 * Renders to React elements (never dangerouslySetInnerHTML), so crawled/third-party
 * content can't inject HTML. Handles the structures our SKILL.md bodies use:
 * headings, ordered/unordered lists, blockquotes, fenced code, bold, inline code, links.
 */

/** Allow only safe link schemes; reject javascript:/data:/etc. Returns null if unsafe. */
function safeHref(url: string): string | null {
  const u = url.trim();
  if (/^(https?:|mailto:)/i.test(u)) return u; // explicit safe schemes
  if (/^[/#.]/.test(u)) return u; // relative / anchor
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return null; // any other scheme (javascript:, data:, …) → reject
  return u; // scheme-less (treated as relative by the browser) — not an exec vector
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-i${i++}`;
    if (tok.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em]">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("**")) {
      nodes.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    } else {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = lm ? safeHref(lm[2] ?? "") : null;
      if (lm && href) {
        nodes.push(
          <a key={key} href={href} target="_blank" rel="noreferrer" className="text-slate-900 underline">
            {lm[1] ?? tok}
          </a>,
        );
      } else if (lm) {
        // unsafe scheme — render the link text only, never a live anchor
        nodes.push(<span key={key}>{lm[1] ?? tok}</span>);
      } else {
        nodes.push(tok);
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    // fenced code
    if (line.trimStart().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").trimStart().startsWith("```")) buf.push(lines[i] ?? ""), i++;
      i++; // closing fence
      blocks.push(
        <pre key={key++} className="overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100">
          {buf.join("\n")}
        </pre>,
      );
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = (h[1] ?? "#").length;
      const content = renderInline(h[2] ?? "", `h${key}`);
      const cls = level <= 1 ? "text-xl font-semibold" : level === 2 ? "text-lg font-semibold" : "text-base font-semibold";
      blocks.push(
        <p key={key++} className={`mt-4 ${cls}`}>
          {content}
        </p>,
      );
      i++;
      continue;
    }

    // blockquote
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith(">")) buf.push((lines[i] ?? "").replace(/^>\s?/, "")), i++;
      blocks.push(
        <blockquote key={key++} className="my-2 border-l-4 border-amber-300 bg-amber-50 px-3 py-2 text-sm text-slate-700">
          {renderInline(buf.join(" "), `bq${key}`)}
        </blockquote>,
      );
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-2 list-decimal space-y-1 pl-6 text-sm">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ol${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-6 text-sm">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ul${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // paragraph (gather consecutive plain lines)
    const buf: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !/^(#{1,6}\s|>|\s*\d+\.\s|\s*[-*]\s|```)/.test(lines[i] ?? "")
    ) {
      buf.push(lines[i] ?? "");
      i++;
    }
    blocks.push(
      <p key={key++} className="my-2 text-sm leading-relaxed text-slate-700">
        {renderInline(buf.join(" "), `p${key}`)}
      </p>,
    );
  }

  return <div className="prose-sm">{blocks}</div>;
}
