/**
 * Extraction domain logic: messy help-center articles -> procedure-shaped
 * SKILL.md drafts. The actual model call is delegated to ./llm.ts (provider-
 * agnostic), so this module is about WHAT we ask for, not WHICH model answers.
 * This is the seed of the product's Week-3 extraction pipeline.
 *
 * Reliability principles baked into the prompt (they ARE the product):
 *  - procedure-shape output ("how we handle X"), not summaries
 *  - every skill cites the source articles it came from
 *  - "insufficient evidence" is valid — the model is told NOT to invent
 *    procedures unsupported by the corpus (no hallucinated skills)
 */
import type { Article } from "./crawl";
import { slugify, type SkillDraft } from "./skillmd";
import { runExtraction } from "./llm";

export const SYSTEM_PROMPT = [
  "You are Company Brain's extraction engine.",
  "You convert a customer-support team's help-center articles into reusable, procedure-shaped SKILL files for AI agents.",
  "",
  "Rules:",
  "1. Extract PROCEDURES the support team follows (\"How we handle refund requests\", \"Escalation path for billing disputes\"), not topic summaries.",
  "2. Write each skill body as clear, imperative, step-by-step markdown an AI agent could follow to answer or act correctly.",
  "3. Cite evidence. Every skill must reference the source tag(s) (e.g. S1, S3) of the article(s) it is built from. Never invent steps not supported by the sources.",
  "4. Refuse gracefully. If the corpus does not contain enough evidence for a real procedure, produce FEWER skills rather than fabricating. Returning only the well-supported ones is correct.",
  "5. Set confidence honestly: 'high' when the article spells out the procedure, 'low' when you inferred it from thin evidence.",
].join("\n");

/** Build the user message: a tagged corpus the model cites back to. */
export function buildCorpus(articles: Article[]): { text: string; tagToUrl: Map<string, Article> } {
  const tagToUrl = new Map<string, Article>();
  const blocks = articles.map((a, i) => {
    const tag = `S${i + 1}`;
    tagToUrl.set(tag, a);
    return `### [${tag}] ${a.title}\nURL: ${a.url}\n\n${a.markdown}`;
  });
  const text = [
    "Here is a customer-support help center, as a set of source articles.",
    "Extract the procedure-shaped skills a support AI agent would need. Cite source tags.",
    "",
    blocks.join("\n\n---\n\n"),
  ].join("\n");
  return { text, tagToUrl };
}

/** Run extraction against the configured provider and resolve cited sources. */
export async function extractSkills(articles: Article[], modelOverride?: string): Promise<SkillDraft[]> {
  if (articles.length === 0) return [];
  const { text, tagToUrl } = buildCorpus(articles);
  const raw = await runExtraction(SYSTEM_PROMPT, text, modelOverride);

  // Free-tier models occasionally emit a malformed item; skip those rather than
  // letting one bad object throw and discard the whole (otherwise good) batch.
  return raw
    .filter((s) => s && typeof s.title === "string" && s.title.trim() !== "" && typeof s.body === "string")
    .map((s) => {
      const sources = (s.source_tags ?? [])
        .map((tag) => tagToUrl.get(String(tag).replace(/[[\]]/g, "").trim()))
        .filter((a): a is Article => Boolean(a))
        .map((a) => ({ url: a.url, title: a.title }));
      return {
        slug: slugify(s.title),
        title: s.title,
        description: typeof s.description === "string" ? s.description : "",
        body: s.body,
        sources,
        confidence: s.confidence,
      } satisfies SkillDraft;
    });
}
