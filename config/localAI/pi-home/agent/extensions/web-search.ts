/**
 * web_search tool — search the web via DuckDuckGo (no API key required).
 *
 * Load with: pi --extension ~/.pi/agent/extensions/web-search.ts
 * (or place it in ~/.pi/agent/extensions/ so it loads automatically)
 */
import { Type } from "@earendil-works/pi-ai";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/g, "");
}

function unwrapDdgRedirect(href: string): string {
  const m = href.match(/[?&]uddg=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  if (href.startsWith("//")) return "https:" + href;
  return href;
}

async function ddgSearch(query: string, maxResults: number, signal: AbortSignal): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal });
  if (!res.ok) throw new Error(`DuckDuckGo returned HTTP ${res.status}`);
  const html = await res.text();

  const results: { title: string; url: string; snippet: string }[] = [];
  // Each result lives in a <div class="result ..."> block
  const blocks = html.split(/class="[^"]*result results_links/).slice(1);
  for (const block of blocks.slice(0, maxResults)) {
    const linkMatch = block.match(/class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (!linkMatch) continue;
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/)
      ?? block.match(/class="result__snippet"[^>]*>([\s\S]*?)</);
    const title = decodeEntities(linkMatch[2].replace(/<[^>]+>/g, "").trim());
    const snippet = snippetMatch ? decodeEntities(snippetMatch[1].replace(/<[^>]+>/g, "").trim()) : "";
    results.push({ title, url: unwrapDdgRedirect(linkMatch[1]), snippet });
  }
  return results;
}

const webSearchTool = defineTool({
  name: "web_search",
  label: "Web Search",
  description:
    "Search the web for current information. Returns a ranked list of results with titles, URLs, and short snippets. Use for recent events, documentation, or facts not in your training data. After a search, you can fetch a specific page (e.g. via bash: curl -sL <url>) if you need full content.",
  parameters: Type.Object({
    query: Type.String({ description: "Search query" }),
    max_results: Type.Optional(Type.Number({ description: "Maximum number of results to return (default 5, max 10)", minimum: 1, maximum: 10 })),
  }),

  async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
    const maxResults = params.max_results ?? 5;
    const results = await ddgSearch(params.query, maxResults, signal);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `No results found for: ${params.query}` }], details: undefined };
    }
    const text = results
      .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`)
      .join("\n\n");
    return {
      content: [{ type: "text", text: `Search results for: ${params.query}\n\n${text}` }],
      details: { query: params.query, results },
    };
  },
});

export default function (pi: ExtensionAPI) {
  pi.registerTool(webSearchTool);
}
