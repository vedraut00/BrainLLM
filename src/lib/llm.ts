/**
 * LLM transport — talks to any OpenAI-compatible Chat Completions API.
 *
 * v1 runs on a FREE provider tier (you sign up and get YOUR OWN free key).
 * Default = Google Gemini (no credit card, large context, free). Groq and
 * OpenRouter work too — just change the env vars (see .env.example). No code change.
 *
 * We use your own free-tier key rather than any shared-key proxy service: those
 * hand out a rotating pool of other people's keys (unreliable) and route your data
 * through an anonymous third party — which would break the product's privacy promise.
 */

/** The raw skill object the model must return (mapped to SkillDraft upstream). */
export interface RawSkill {
  title: string;
  description: string;
  body: string;
  source_tags: string[];
  confidence: "high" | "medium" | "low";
}

export interface LlmConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  hasKey: boolean;
  /** which env var supplied the key (for friendly logging) */
  keySource?: string;
  /** whether to send response_format: json_object (some free models reject it) */
  jsonMode: boolean;
}

const KEY_NAMES = ["CB_LLM_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY"];
const DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/";
const DEFAULT_MODEL = "gemini-3.5-flash";

/** Resolve base URL + key + model from the environment. */
export function getLlmConfig(): LlmConfig {
  let apiKey: string | undefined;
  let keySource: string | undefined;
  for (const name of KEY_NAMES) {
    const v = process.env[name];
    if (v) {
      apiKey = v;
      keySource = name;
      break;
    }
  }
  return {
    baseUrl: process.env.CB_LLM_BASE_URL ?? DEFAULT_BASE,
    model: process.env.CB_LLM_MODEL ?? DEFAULT_MODEL,
    apiKey,
    hasKey: Boolean(apiKey),
    keySource,
    jsonMode: process.env.CB_LLM_JSON_MODE !== "0",
  };
}

const JSON_INSTRUCTION = [
  "",
  "OUTPUT FORMAT (STRICT): Respond with a SINGLE JSON object and nothing else — no prose, no markdown fences. Schema:",
  '{"skills":[{"title":"string","description":"string (when to use this skill)","body":"string (step-by-step markdown procedure)","source_tags":["S1","S2"],"confidence":"high|medium|low"}]}',
  'Return {"skills":[]} if the corpus lacks well-supported procedures. Never invent procedures not grounded in the sources.',
].join("\n");

/** Slice out the first balanced {...} object, ignoring braces inside strings. */
function firstJsonObject(content: string): string | null {
  const start = content.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') {
      inStr = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return content.slice(start, i + 1);
    }
  }
  return null;
}

/** Best-effort parse of a model's text response into the skills array. */
function parseSkills(content: string): RawSkill[] {
  const tryParse = (s: string): RawSkill[] | null => {
    try {
      const obj = JSON.parse(s) as { skills?: RawSkill[] };
      return Array.isArray(obj.skills) ? obj.skills : null;
    } catch {
      return null;
    }
  };
  const direct = tryParse(content.trim());
  if (direct) return direct;
  // The model wrapped the JSON in fences/prose — extract the first balanced object.
  const candidate = firstJsonObject(content);
  if (candidate) {
    const parsed = tryParse(candidate);
    if (parsed) return parsed;
  }
  return [];
}

/** Run extraction against the configured provider and return raw skills. Throws if no key. */
export async function runExtraction(system: string, user: string, modelOverride?: string): Promise<RawSkill[]> {
  const cfg = getLlmConfig();
  if (!cfg.hasKey || !cfg.apiKey) {
    throw new Error("No LLM API key configured. Set a free-tier key in .env (e.g. GEMINI_API_KEY). See .env.example.");
  }
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const body: Record<string, unknown> = {
    model: modelOverride ?? cfg.model,
    temperature: 0.2,
    max_tokens: 4_096,
    messages: [
      { role: "system", content: `${system}\n${JSON_INSTRUCTION}` },
      { role: "user", content: user },
    ],
  };
  if (cfg.jsonMode) body.response_format = { type: "json_object" };

  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body),
  };
  // Retry transient failures (429 rate limit, 5xx overload/UNAVAILABLE, network errors).
  const RETRYABLE = new Set([429, 500, 502, 503, 504]);
  let res: Response | undefined;
  let netErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(url, init);
      netErr = undefined;
      if (res.ok || !RETRYABLE.has(res.status) || attempt === 3) break;
    } catch (e) {
      netErr = e;
      if (attempt === 3) break;
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt)); // 1.5s, 3s backoff
  }
  if (netErr) throw new Error(`LLM network error: ${netErr instanceof Error ? netErr.message : String(netErr)}`);
  if (!res || !res.ok) {
    const text = res ? await res.text() : "";
    throw new Error(
      `LLM request failed (${res?.status ?? "no response"}). ${text.slice(0, 300)}\n` +
        `Tip: transient overload retries 3x; if the model id is wrong set CB_LLM_MODEL; if response_format is rejected set CB_LLM_JSON_MODE=0.`,
    );
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return parseSkills(data.choices?.[0]?.message?.content ?? "");
}
