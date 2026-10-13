/**
 * web_fetch tool — fetch a URL and return its content as readable text.
 *
 * Pairs with the web_search extension. HTML pages are converted to plain
 * text; the result shown to the model is truncated and the full content
 * is written to a temp file whose path is reported.
 *
 * Load with: pi --extension ~/.pi/agent/extensions/web-fetch.ts
 * (or place it in ~/.pi/agent/extensions/ so it loads automatically)
 */
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { Type } from "@earendil-works/pi-ai";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { TOGGLE_CHANNEL, exposureFor, isWebToolsEnabled } from "./web-toggle";

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const DEFAULT_MAX_CHARS = 20000;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/g, " ");
}

function htmlToText(html: string): string {
  let s = html;
  // Drop non-content blocks
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  s = s.replace(/<template[\s\S]*?<\/template>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  // Block-level tags become newlines
  s = s.replace(/<\/(p|div|section|article|li|tr|table|h[1-6]|pre|blockquote|header|footer|nav|main)>/gi, "\n");
  s = s.replace(/<(br|hr)\s*\/?>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "- ");
  // Strip all remaining tags
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  // Collapse whitespace
  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
  return s;
}

const webFetchTool = defineTool({
  name: "web_fetch",
  label: "Web Fetch",
  description:
    "Fetch a web page and return its content as plain text (HTML is converted; other text formats are returned as-is). The result is truncated to max_chars; the complete content is saved to a temp file whose path is included in the response — read that file for the rest. Use after web_search to read a specific result in full.",
  parameters: Type.Object({
    url: Type.String({ description: "Absolute URL to fetch (http:// or https://)" }),
    max_chars: Type.Optional(
      Type.Number({ description: "Maximum characters of content to return (default 20000, max 100000)", minimum: 1, maximum: 100000 }),
    ),
  }),

  async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
    const maxChars = params.max_chars ?? DEFAULT_MAX_CHARS;
    const res = await fetch(params.url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,text/plain,text/markdown,application/json;q=0.9,*/*;q=0.5" },
      signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${res.url}`);

    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();
    let text: string;
    if (/text\/html|application\/xhtml/.test(contentType) || /^\s*</.test(body)) {
      // Try to extract <main> or <article> content first for cleaner output
      const main = body.match(/<main[\s\S]*?<\/main>/i) ?? body.match(/<article[\s\S]*?<\/article>/i);
      text = htmlToText(main ? main[0] : body);
    } else {
      text = decodeEntities(body);
    }

    if (!text.trim()) {
      return { content: [{ type: "text", text: `Fetched ${res.url} but got no readable content (content-type: ${contentType || "unknown"}).` }], details: undefined };
    }

    // Save full content to a temp file and truncate what the model sees
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "web-fetch-"));
    const file = path.join(dir, path.basename(new URL(res.url).pathname).replace(/[^a-zA-Z0-9._-]/g, "_") || "index.html");
    fs.writeFileSync(file, text, "utf8");

    let shown = text;
    let truncatedNote = "";
    if (shown.length > maxChars) {
      shown = shown.slice(0, maxChars);
      truncatedNote = `\n\n[Truncated: showing ${maxChars} of ${text.length} characters. Full content saved to ${file} — use the read tool to get the rest.]`;
    } else {
      truncatedNote = `\n\n[Full content saved to ${file}]`;
    }

    return {
      content: [{ type: "text", text: `Content of ${res.url}\n\n${shown}${truncatedNote}` }],
      details: { url: res.url, contentType, totalChars: text.length, shownChars: shown.length, file },
    };
  },
});

export default function (pi: ExtensionAPI) {
  const register = () => pi.registerTool({ ...webFetchTool, exposure: exposureFor(isWebToolsEnabled()) });
  register();
  pi.events.on(TOGGLE_CHANNEL, register);
}
