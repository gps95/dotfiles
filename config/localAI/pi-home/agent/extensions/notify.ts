import { execFile } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const BUS = process.env.PI_DBUS_SOCKET ?? "/run/user/1000/bus";

function notify(summary: string, text: string, urgency = "normal", category = "pi-done"): void {
	execFile(
		"notify-send",
		["-a", "pi", "-u", urgency, "-c", category, summary, text],
		{ env: { ...process.env, DBUS_SESSION_BUS_ADDRESS: `unix:path=${BUS}` } },
		(err) => {
			if (err) console.error(`[notify] ${err.message}`);
		},
	);
}

export default function (pi: ExtensionAPI): void {
	pi.on("agent_settled", (e) => {
		if (!e.aborted) notify("Pi finished", "Agent run complete — switch to the terminal.");
	});

	pi.on("tool_call", (e) => {
		if (e.toolName !== "ask_user_question") return;
		const q = String(e.input?.question ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
		notify("Pi needs your input", q || "Answer a question in the pi terminal.", "normal", "pi-question");
	});

	pi.on("session_before_compact", (e) =>
		notify("Compacting session…", `Context is being compacted (${e.reason}).`, "low", "pi-compact"),
	);

	pi.on("session_compact", (e) =>
		notify("Compaction finished", `Session context compacted (${e.reason}).`, "low", "pi-compact"),
	);

	pi.registerCommand("notify", {
		description: "Send a test desktop notification to the host",
		handler: () => notify("Pi notification test", "Host notifications are working."),
	});
}