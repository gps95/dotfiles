/**
 * Shared toggle state for the web_search / web_fetch tools.
 *
 * The /web command (registered by web-search.ts) flips this state and emits
 * TOGGLE_CHANNEL on the extension event bus; the tool extensions re-register
 * themselves with the matching exposure ("direct" = active, "hidden" = off).
 *
 * Default (no state file) is disabled. State persists across sessions.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const TOGGLE_CHANNEL = "web-tools-toggle";
const STATE_FILE = path.join(os.homedir(), ".pi", "agent", "web-tools.json");

export function isWebToolsEnabled(): boolean {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")).webToolsEnabled === true;
  } catch {
    return false;
  }
}

export function setWebToolsEnabled(enabled: boolean): void {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ webToolsEnabled: enabled }, null, 2) + "\n");
}

export function exposureFor(enabled: boolean): "direct" | "hidden" {
  return enabled ? "direct" : "hidden";
}

export default function (_pi: ExtensionAPI) {
  // Helper module only — no extension behavior of its own.
}
