/**
 * Lightweight, polite help-center crawler.
 *
 * Given a public help-center URL it discovers article URLs (via sitemap, with a
 * same-host link fallback) and extracts readable article text as markdown.
 * No auth, no browser — works against the static HTML that Zendesk / Intercom /
 * most help centers serve. JS-only sites (e.g. notion.site) will return little
 * text; that's a known v1 limitation, surfaced to the caller.
 *
 * Reused later by the product's ingestion layer.
 */
import * as cheerio from "cheerio";
import TurndownService from "turndown";

const UA = "CompanyBrainBot/0.1 (+https://companybrain.dev/bot; free skill audit)";
const DEFAULT_TIMEOUT_MS = 15_000;
/** politeness gap between requests to the same host */
export const CRAWL_DELAY_MS = 1_200;

export interface Article {
  url: string;
  title: string;
  markdown: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function politeFetch(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/xml" },
      redirect: "follow",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** True for an actual article page (vs a home/category/section landing page). */
function isArticleUrl(url: string): boolean {
  return /\/articles?\/\d+/i.test(url) || /\/articles?\//i.test(url);
}

/** Path segments that indicate a help/KB area at all (used by the link fallback). */
const HELP_HINTS = ["/articles/", "/article/", "/hc/", "/help/", "/kb/", "/support/", "/docs/"];

function looksLikeHelp(url: string): boolean {
  const lower = url.toLowerCase();
  return HELP_HINTS.some((h) => lower.includes(h));
}

/** Home pages, category/section indexes — NOT something to extract a procedure from. */
function isHomeOrCategoryUrl(url: string): boolean {
  let path: string;
  try {
    path = new URL(url).pathname.toLowerCase().replace(/\/+$/, "");
  } catch {
    return true;
  }
  if (path === "" || path === "/hc") return true;
  if (/\/(categories|sections)\//.test(path)) return true;
  // e.g. /hc/da, /hc/en-us, /en, /fr  -> a locale landing page, not an article
  if (/^\/hc\/[a-z]{2}(-[a-z]{2})?$/.test(path)) return true;
  if (/^\/[a-z]{2}(-[a-z]{2})?$/.test(path)) return true;
  return false;
}

/** 0 for English locales (preferred), 1 otherwise — so we don't email a prospect Danish skills. */
function localeRank(url: string): number {
  return /\/(en-us|en-gb|en)(\/|$)/i.test(url) || !/\/hc\/[a-z]{2}(-[a-z]{2})?\//i.test(url) ? 0 : 1;
}

/** Locale-agnostic identity so the same article in 10 languages collapses to one. */
function localeAgnosticKey(url: string): string {
  let path: string;
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
  path = path.replace(/\/hc\/[a-z]{2}(-[a-z]{2})?\//, "/hc/");
  const m = path.match(/\/articles?\/(\d+)/);
  return m ? `art:${m[1]}` : path;
}

/** Rank + dedupe discovered URLs down to the best `max` article candidates. */
function selectArticleUrls(urls: string[], max: number): string[] {
  const usable = urls.filter((u) => !isHomeOrCategoryUrl(u));
  const articles = usable.filter(isArticleUrl);
  const pool = articles.length > 0 ? articles : usable;
  // English first, then dedupe across locales keeping the first (English) variant.
  const sorted = [...pool].sort((a, b) => localeRank(a) - localeRank(b));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of sorted) {
    const key = localeAgnosticKey(u);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u);
    if (out.length >= max) break;
  }
  return out;
}

/* --------------------------------- robots --------------------------------- */

/** Parse robots.txt and return Disallow path-prefixes that apply to us (User-agent: *). */
async function loadDisallows(origin: string): Promise<string[]> {
  try {
    const res = await politeFetch(`${origin}/robots.txt`, 8_000);
    if (!res.ok) return [];
    const text = await res.text();
    const disallows: string[] = [];
    let appliesToUs = false;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/#.*$/, "").trim();
      if (!line) continue;
      const [field, ...rest] = line.split(":");
      const key = (field ?? "").toLowerCase().trim();
      const value = rest.join(":").trim();
      if (key === "user-agent") {
        appliesToUs = value === "*" || value.toLowerCase().includes("companybrain");
      } else if (key === "disallow" && appliesToUs && value) {
        disallows.push(value);
      }
    }
    return disallows;
  } catch {
    return [];
  }
}

function isAllowed(url: string, disallows: string[]): boolean {
  try {
    const path = new URL(url).pathname;
    return !disallows.some((d) => d !== "" && path.startsWith(d));
  } catch {
    return false;
  }
}

/* -------------------------------- sitemaps -------------------------------- */

function buildSitemapCandidates(base: URL): string[] {
  const origin = base.origin;
  const candidates = new Set<string>([
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/hc/sitemap.xml`, // Zendesk
    `${origin}/robots-sitemap.xml`,
  ]);
  // If the user passed a path (e.g. https://x.com/help), try a sitemap beside it.
  if (base.pathname && base.pathname !== "/") {
    const trimmed = base.pathname.replace(/\/+$/, "");
    candidates.add(`${origin}${trimmed}/sitemap.xml`);
  }
  return [...candidates];
}

/** Extract <loc> URLs from a sitemap or sitemap-index document. Returns {urls, isIndex}. */
function parseSitemap(xml: string): { locs: string[]; isIndex: boolean } {
  const $ = cheerio.load(xml, { xml: true });
  const isIndex = $("sitemapindex").length > 0;
  const locs: string[] = [];
  $("loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) locs.push(loc);
  });
  return { locs, isIndex };
}

async function discoverFromSitemaps(base: URL, max: number, disallows: string[]): Promise<string[]> {
  for (const candidate of buildSitemapCandidates(base)) {
    try {
      const res = await politeFetch(candidate);
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") ?? "";
      const body = await res.text();
      if (!ct.includes("xml") && !body.trimStart().startsWith("<")) continue;

      const { locs, isIndex } = parseSitemap(body);
      let pageUrls = locs;

      if (isIndex) {
        // Fetch nested sitemaps (cap to a few) and merge their page URLs.
        pageUrls = [];
        for (const child of locs.slice(0, 5)) {
          await sleep(CRAWL_DELAY_MS);
          try {
            const cres = await politeFetch(child);
            if (!cres.ok) continue;
            pageUrls.push(...parseSitemap(await cres.text()).locs);
          } catch {
            /* skip bad child sitemap */
          }
          if (pageUrls.length > max * 6) break;
        }
      }

      const sameHost = pageUrls.filter((u) => {
        try {
          return new URL(u).host === base.host;
        } catch {
          return false;
        }
      });
      const allowed = sameHost.filter((u) => isAllowed(u, disallows));
      const selected = selectArticleUrls(allowed, max);
      if (selected.length > 0) return selected;
    } catch {
      /* try next candidate */
    }
  }
  return [];
}

/** Fallback: scrape same-host article-ish links off the landing page. */
async function discoverFromLinks(base: URL, max: number, disallows: string[]): Promise<string[]> {
  try {
    const res = await politeFetch(base.href);
    if (!res.ok) return [];
    const $ = cheerio.load(await res.text());
    const found = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      let abs: URL;
      try {
        abs = new URL(href, base.href);
      } catch {
        return;
      }
      if (abs.host !== base.host) return;
      abs.hash = "";
      if (looksLikeHelp(abs.href) && !isHomeOrCategoryUrl(abs.href) && isAllowed(abs.href, disallows)) {
        found.add(abs.href);
      }
    });
    return selectArticleUrls([...found], max);
  } catch {
    return [];
  }
}

/** Discover up to `max` candidate article URLs for a help-center base URL. */
export async function discoverArticleUrls(baseUrl: string, max = 8): Promise<string[]> {
  const base = new URL(baseUrl);
  const disallows = await loadDisallows(base.origin);
  const fromSitemap = await discoverFromSitemaps(base, max, disallows);
  if (fromSitemap.length > 0) return fromSitemap;
  return discoverFromLinks(base, max, disallows);
}

/* ------------------------------- extraction ------------------------------- */

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

const MAX_ARTICLE_CHARS = 8_000;
const CONTENT_SELECTORS = [
  "article",
  "main",
  "[role=main]",
  ".article-body",
  ".article__body",
  ".article-content",
  "#article-content",
  ".help-article",
];

/** Fetch one article URL and return its title + readable markdown. */
export async function fetchArticle(url: string): Promise<Article | null> {
  try {
    const res = await politeFetch(url);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("title").text().trim() ||
      url;

    $("script, style, nav, header, footer, aside, form, noscript, svg").remove();

    let contentHtml = $("body").html() ?? "";
    for (const sel of CONTENT_SELECTORS) {
      const el = $(sel).first();
      if (el.length && el.text().trim().length > 200) {
        contentHtml = el.html() ?? contentHtml;
        break;
      }
    }

    const md = turndown.turndown(contentHtml).replace(/\n{3,}/g, "\n\n").trim();
    if (md.length < 80) return null; // too thin to be useful (likely JS-rendered)

    return { url, title, markdown: md.slice(0, MAX_ARTICLE_CHARS) };
  } catch {
    return null;
  }
}

/**
 * Crawl a help center: discover articles, then fetch them politely (serially,
 * with a delay). Returns the successfully-extracted articles. `onProgress` lets
 * a CLI log each step.
 */
export async function crawlHelpCenter(
  baseUrl: string,
  max = 8,
  onProgress?: (msg: string) => void,
): Promise<Article[]> {
  const urls = await discoverArticleUrls(baseUrl, max);
  onProgress?.(`Discovered ${urls.length} candidate article URL(s).`);
  const articles: Article[] = [];
  for (const [i, url] of urls.entries()) {
    if (i > 0) await sleep(CRAWL_DELAY_MS);
    const article = await fetchArticle(url);
    if (article) {
      articles.push(article);
      onProgress?.(`  [${articles.length}] ${article.title}`);
    } else {
      onProgress?.(`  (skipped, no readable text) ${url}`);
    }
  }
  return articles;
}
