/**
 * Unified web + bash-control extension (replaces web-search.ts, web-fetch.ts, web-toggle.ts).
 *
 * Tools:
 *   web_search — search the web via DuckDuckGo (no API key required)
 *   web_fetch  — fetch a URL and return its content as readable text
 *
 * Commands:
 *   /web   — toggle web tools. /web on|off to set. Default: ON.
 *   /bash  — toggle bash-guard. /bash on|off to set. Default: OFF.
 *
 * bash-guard: while enabled, blocks bash-tool commands that invoke JS runtimes
 * (node, bun, deno) — a JS runtime can fetch anything, spawn anything, touch any
 * file, and read all env vars, so it is a full escape hatch from the tool set.
 *
 * Env overrides (take precedence over the state file; used by the agent
 * profiles pifiles/piguared in ~/.bashrc):
 *   PI_WEB=1|0         force web tools on/off
 *   PI_BASH_GUARD=1|0  force bash-guard on/off
 *
 * State persists in ~/.pi/agent/tools-state.json
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Type } from "@earendil-works/pi-ai";
import { defineTool } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// ---------------------------------------------------------------- state

interface State {
  webTools: boolean;
  bashGuard: boolean;
}
const DEFAULTS: State = { webTools: true, bashGuard: false };
const STATE_FILE = path.join(os.homedir(), ".pi", "agent", "tools-state.json");

function loadState(): State {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveState(s: State): void {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2) + "\n");
}

function envOverride(v: string | undefined, fallback: boolean): boolean {
  return v === "1" ? true : v === "0" ? false : fallback;
}

const webEnabled = (): boolean => envOverride(process.env.PI_WEB, loadState().webTools);
const guardEnabled = (): boolean => envOverride(process.env.PI_BASH_GUARD, loadState().bashGuard);
const exposureFor = (on: boolean): "direct" | "hidden" => (on ? "direct" : "hidden");

// ------------------------------------------------------------ web_search

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
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
    "Search the web for current information. Returns a ranked list of results with titles, URLs, and short snippets. Use for recent events, documentation, or facts not in your training data.",
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

// ------------------------------------------------------------- web_fetch

const DEFAULT_MAX_CHARS = 20000;

function htmlToText(html: string): string {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  s = s.replace(/<template[\s\S]*?<\/template>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<\/(p|div|section|article|li|tr|table|h[1-6]|pre|blockquote|header|footer|nav|main)>/gi, "\n");
  s = s.replace(/<(br|hr)\s*\/?>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "- ");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  return s
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
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
      const main = body.match(/<main[\s\S]*?<\/main>/i) ?? body.match(/<article[\s\S]*?<\/article>/i);
      text = htmlToText(main ? main[0] : body);
    } else {
      text = decodeEntities(body);
    }

    if (!text.trim()) {
      return { content: [{ type: "text", text: `Fetched ${res.url} but got no readable content (content-type: ${contentType || "unknown"}).` }], details: undefined };
    }

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

// -------------------------------------------------------------- bash-guard

// JS runtimes blocked in the bash tool while the guard is on.
// Add e.g. "curl", "wget" to also block plain network tools.
const BLOCKED_RUNTIMES = ["node", "bun", "deno"];

function blockedRuntime(cmd: string): string | undefined {
  // Split into segments at shell operators and command substitutions,
  // then inspect the first real token of each segment.
  const segments = cmd
    .replace(/`/g, "\n")
    .replace(/\$\(/g, "\n(")
    .split(/[;&|\n\r]+/);
  for (const seg of segments) {
    const toks = seg.trim().split(/\s+/);
    let i = 0;
    if (toks[i] === "env") {
      i++;
      while (toks[i] && toks[i].includes("=")) i++;
    }
    if (toks[i] === "sudo") {
      i++;
      while (toks[i] && toks[i].startsWith("-")) {
        if (toks[i].startsWith("-u")) i++; // -u takes a user argument
        i++;
      }
    }
    if (toks[i] === "nohup") i++;
    const word = (toks[i] ?? "").replace(/^[^a-zA-Z0-9._-]*/, ""); // strip leading "("
    const base = word.split("/").pop() ?? ""; // handle /path/to/node
    if (BLOCKED_RUNTIMES.includes(base)) return base;
  }
  return undefined;
}

// ------------------------------------------------------------------- main

export default function (pi: ExtensionAPI) {
  const registerWebTools = () => {
    const exposure = exposureFor(webEnabled());
    pi.registerTool({ ...webSearchTool, exposure });
    pi.registerTool({ ...webFetchTool, exposure });
  };
  registerWebTools();

  pi.registerCommand("web", {
    description: "Toggle web tools (web_search + web_fetch). /web to toggle, /web on|off to set. Default: on.",
    handler: (args, ctx) => {
      const a = args.trim().toLowerCase();
      const s = loadState();
      s.webTools = a === "on" || a === "enable" ? true : a === "off" || a === "disable" ? false : !s.webTools;
      saveState(s);
      registerWebTools();
      ctx.ui.notify(`Web tools ${s.webTools ? "enabled" : "disabled"}.`);
    },
  });

  pi.registerCommand("bash", {
    description: "Toggle bash-guard (blocks node/bun/deno in the bash tool). /bash to toggle, /bash on|off to set. Default: off.",
    handler: (args, ctx) => {
      const a = args.trim().toLowerCase();
      const s = loadState();
      s.bashGuard = a === "on" || a === "enable" ? true : a === "off" || a === "disable" ? false : !s.bashGuard;
      saveState(s);
      ctx.ui.notify(`Bash guard ${s.bashGuard ? "enabled" : "disabled"}.`);
    },
  });

  // --------------------------------------------------------------- /tools

  const PRESETS: Record<string, { tools: string[]; guard?: boolean }> = {
    files: { tools: ["read", "edit", "write"] },
    guard: { tools: ["read", "edit", "write", "bash"], guard: true },
    full: { tools: ["*"] },
  };

  pi.registerCommand("tools", {
    description: "Show/toggle the active tool set. /tools = interactive picker, /tools <name,...> = toggle named tools, /tools files|guard|full = presets.",
    handler: async (args, ctx) => {
      const a = args.trim().toLowerCase();
      const all = pi.getAllTools().map((t) => t.name);
      const active = new Set(pi.getActiveTools());

      // Interactive picker: pick tools to toggle them, "apply" to commit.
      if (a === "") {
        const pending = new Set(active);
        for (;;) {
          const options = all.map((n) => (pending.has(n) ? "[x] " : "[ ] ") + n);
          options.push("✓ apply", "cancel");
          const pick = await ctx.ui.select("Tools — pick to toggle, 'apply' to set:", options);
          if (pick === undefined || pick === "cancel") {
            ctx.ui.notify("Tool set unchanged.");
            return;
          }
          if (pick === "✓ apply") {
            pi.setActiveTools([...pending]);
            ctx.ui.notify("Active tools: " + [...pending].join(", "));
            return;
          }
          // select() returns the option string verbatim, including the
          // checkbox prefix — strip it to get the real tool name.
          const name = pick.replace(/^\[(x| )\] /, "");
          if (pending.has(name)) pending.delete(name);
          else pending.add(name);
        }
      }

      // Presets
      if (PRESETS[a]) {
        const p = PRESETS[a];
        const tools = p.tools.includes("*") ? all : p.tools;
        pi.setActiveTools(tools);
        if (p.guard) {
          const s = loadState();
          s.bashGuard = true;
          saveState(s);
        }
        ctx.ui.notify(`Preset '${a}': ${tools.join(", ")}${p.guard ? " (bash-guard on)" : ""}.`);
        return;
      }

      // Toggle named tools
      const names = a.split(",").map((n) => n.trim()).filter(Boolean);
      for (const n of names) {
        if (!all.includes(n)) {
          ctx.ui.notify(`Unknown tool: ${n}. Run /tools to see the list.`);
          return;
        }
        if (active.has(n)) active.delete(n);
        else active.add(n);
      }
      pi.setActiveTools([...active]);
      ctx.ui.notify("Active tools: " + [...active].join(", "));
    },
  });

  pi.on("tool_call", (event) => {
    if (event.toolName !== "bash" || !guardEnabled()) return;
    const hit = blockedRuntime(event.input?.command ?? "");
    if (hit) {
      return {
        block: true,
        reason: `bash-guard: '${hit}' is blocked in the bash tool. Use the web_search/web_fetch tools for network work, or run the unguarded profile.`,
      };
    }
  });
}
