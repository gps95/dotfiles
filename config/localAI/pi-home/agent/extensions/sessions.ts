import type { ExtensionAPI, SessionInfo } from "@earendil-works/pi-coding-agent";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { appendFile, readFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";

/**
 * /sessions [filter] — lists all sessions for the current project with a one-sentence
 * summary of the first user message. Select a session to switch to it, rename it, or
 * delete it.
 *
 * /sessions clean — lists all unnamed sessions, asks for confirmation, then deletes
 * them in one go (the current session is always skipped).
 */
export default function (pi: ExtensionAPI) {
  pi.registerCommand("sessions", {
    description: "List sessions with a one-line summary; switch to one, rename it, or delete it. Usage: /sessions [filter] | /sessions clean (delete all unnamed sessions)",
    handler: async (args, ctx) => {
      const filter = args.trim().toLowerCase();

      const sessions = await SessionManager.list(ctx.cwd, undefined, undefined, ctx.signal);

      // Bulk-delete all unnamed sessions, with a list + confirmation.
      if (filter === "clean" || filter === "delete-unnamed") {
        const currentFile = ctx.sessionManager.getSessionFile();
        const unnamed = sessions.filter((s) => !s.name && s.path !== currentFile);
        if (unnamed.length === 0) {
          ctx.ui.notify("No unnamed sessions to delete", "info");
          return;
        }
        const list = [...unnamed]
          .sort((a, b) => b.modified.getTime() - a.modified.getTime())
          .map((s, i) => `${i + 1}. ${summarize(s)}\n    ${s.path}  (${s.modified.toISOString().slice(0, 16).replace("T", " ")} UTC, ${s.messageCount} msgs)`)
          .join("\n");
        const confirmed = await ctx.ui.confirm(
          "Delete unnamed sessions",
          `Permanently delete these ${unnamed.length} unnamed session(s)?\n\n${list}`,
          { signal: ctx.signal },
        );
        if (!confirmed) return;
        let deleted = 0;
        const failed: string[] = [];
        for (const s of unnamed) {
          try {
            await rm(s.path);
            deleted++;
          } catch {
            failed.push(s.path);
          }
        }
        ctx.ui.notify(
          `Deleted ${deleted} unnamed session(s).${failed.length ? ` Failed: ${failed.join(", ")}` : ""}`,
          failed.length ? "warning" : "info",
        );
        return;
      }
      let shown = sessions;
      if (filter) {
        shown = sessions.filter(
          (s) =>
            s.firstMessage.toLowerCase().includes(filter) ||
            (s.name?.toLowerCase().includes(filter) ?? false),
        );
      }
      shown = [...shown].sort((a, b) => b.modified.getTime() - a.modified.getTime()).slice(0, 100);

      if (shown.length === 0) {
        ctx.ui.notify(filter ? `No sessions matching "${filter}"` : "No sessions found", "warning");
        return;
      }

      const labels = shown.map((s, i) => {
        const name = s.name ? `${s.name} | ` : "";
        return `${i + 1}. ${name}${summarize(s)}`;
      });

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const choice = await ctx.ui.select(`Sessions (${shown.length} found)`, labels, { signal: ctx.signal });
        const idx = choice === undefined ? -1 : labels.indexOf(choice);
        if (idx === -1) return;

        const chosen = shown[idx];
        const isCurrent = chosen.path === ctx.sessionManager.getSessionFile();

        let action = "switch";
        {
          const options = isCurrent
            ? ["Rename this session"]
            : ["Switch to this session", "Rename this session", "Delete this session"];
          const opt = await ctx.ui.select(
            `What do you want to do with session ${chosen.name ?? chosen.id.slice(0, 8)}?`,
            options,
            { signal: ctx.signal },
          );
          if (opt === undefined) return;
          if (opt === "Delete this session") action = "delete";
          else if (opt === "Rename this session") action = "rename";
          else action = "switch";
        }

        if (action === "rename") {
          const name = (
            await ctx.ui.input("Rename session", `New name for ${chosen.name ?? chosen.id.slice(0, 8)}`, { signal: ctx.signal })
          )?.replace(/[\r\n]+/g, " ").trim();
          if (!name) return; // cancelled or empty
          try {
            if (isCurrent) {
              // Live session: use the manager so in-memory state stays in sync
              (ctx.sessionManager as unknown as SessionManager).appendSessionInfo(name);
            } else {
              await appendSessionInfoToFile(chosen.path, name);
            }
          } catch (err) {
            ctx.ui.notify(`Failed to rename session: ${err instanceof Error ? err.message : String(err)}`, "error");
            return;
          }
          ctx.ui.notify(`Session renamed to "${name}"`, "info");
          const refreshed = await SessionManager.list(ctx.cwd, undefined, undefined, ctx.signal);
          shown = filter
            ? refreshed.filter(
                (s) =>
                  s.firstMessage.toLowerCase().includes(filter) ||
                  (s.name?.toLowerCase().includes(filter) ?? false),
              )
            : refreshed;
          shown = [...shown].sort((a, b) => b.modified.getTime() - a.modified.getTime()).slice(0, 100);
          if (shown.length === 0) {
            ctx.ui.notify("Session not found in list anymore", "warning");
            return;
          }
          labels.splice(0, labels.length, ...shown.map((s, i) => {
            const name = s.name ? `${s.name} | ` : "";
            return `${i + 1}. ${name}${summarize(s)}`;
          }));
          continue;
        }

        if (action === "delete") {
        const confirmed = await ctx.ui.confirm(
          "Delete session",
          `Permanently delete session "${chosen.name ?? chosen.id.slice(0, 8)}" (${chosen.path})?`,
          { signal: ctx.signal },
        );
        if (!confirmed) return;
          try {
            await rm(chosen.path);
            ctx.ui.notify("Session deleted", "info");
            // Refresh and go back to the updated list
            const refreshed = await SessionManager.list(ctx.cwd, undefined, undefined, ctx.signal);
            shown = filter
              ? refreshed.filter(
                  (s) =>
                    s.firstMessage.toLowerCase().includes(filter) ||
                    (s.name?.toLowerCase().includes(filter) ?? false),
                )
              : refreshed;
            shown = [...shown].sort((a, b) => b.modified.getTime() - a.modified.getTime()).slice(0, 100);
            if (shown.length === 0) {
              ctx.ui.notify("No sessions left", "info");
              return;
            }
            labels.splice(0, labels.length, ...shown.map((s, i) => {
              const name = s.name ? `${s.name} | ` : "";
              return `${i + 1}. ${name}${summarize(s)}`;
            }));
            continue;
          } catch (err) {
            ctx.ui.notify(`Failed to delete session: ${err instanceof Error ? err.message : String(err)}`, "error");
            return;
          }
        }

        if (isCurrent) {
          ctx.ui.notify("Already in that session", "info");
          return;
        }

        const targetName = chosen.name ?? chosen.id.slice(0, 8);
        await ctx.switchSession(chosen.path, {
          withSession: (replacementCtx) => {
            replacementCtx.ui.notify(`Switched to ${targetName}`, "info");
          },
        });
        return;
      }
    },
  });
}

/**
 * Rename a non-live session by appending a session_info entry to its JSONL file.
 * The last session_info entry in the file determines the displayed name
 * (an empty name clears it), mirroring SessionManager.appendSessionInfo.
 */
async function appendSessionInfoToFile(path: string, name: string): Promise<void> {
  const raw = await readFile(path, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  let parentId: string | null = null;
  const seen = new Set<string>();
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (typeof entry.id === "string") {
        seen.add(entry.id);
        parentId = entry.id;
      }
    } catch {
      // skip unparseable line
    }
  }
  let id = randomUUID().slice(0, 8);
  while (seen.has(id)) id = randomUUID().slice(0, 8);
  const entry = {
    type: "session_info",
    id,
    parentId,
    timestamp: new Date().toISOString(),
    name,
  };
  await appendFile(path, (raw.endsWith("\n") ? "" : "\n") + JSON.stringify(entry) + "\n", "utf8");
}

function summarize(s: SessionInfo): string {
  const text = (s.firstMessage || s.name || s.id).trim();
  const line = text.split("\n").find((l) => l.trim().length > 0) ?? s.id;
  const oneLine = line.replace(/\s+/g, " ").trim();
  return oneLine.length > 70 ? oneLine.slice(0, 67) + "…" : oneLine;
}
