import { detectWsl, distroName } from "./lib/wsl-host.js";
import {
  defaultDir,
  formatTray,
  openShortcutDir,
  trayStatus,
  writeLauncherFiles,
  linuxToWindowsPath,
} from "./lib/tray.js";

export const name = "dsh-wsl-tray";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const port = positive(config.port, 3080);
  const configDistro = typeof config.distro === "string" ? config.distro.trim() : "";
  const configDir = typeof config.dir === "string" ? config.dir.trim() : "";
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:wsl_tray",
    order: 118,
    text: [
      "Use wsl_tray to generate Windows shortcut/launcher scripts that start `dsh web` inside WSL.",
      "It writes .ps1 / .vbs / .bat only — it does NOT auto-install tray apps.",
      "After write_launcher, the user can pin or run the scripts from Explorer.",
    ].join(" "),
  });

  ctx.tools.register({
    name: "wsl_tray",
    description: "Status for dsh binary; write Windows launcher scripts; open the shortcut folder in Explorer.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["action"],
      properties: {
        action: {
          type: "string",
          enum: ["status", "write_launcher", "open_shortcut_dir"],
          description: "status | write_launcher | open_shortcut_dir",
        },
        showMessageBox: {
          type: "boolean",
          description: "For write_launcher: show a MessageBox after start (default true).",
        },
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          ok: { type: "boolean" },
          wsl: { type: "boolean" },
          action: { type: "string" },
          error: { type: "string" },
        },
      },
      render: (_args, value) => [{ type: "text", text: formatTray(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => false,
    async execute(args) {
      const action = String(args?.action || "").toLowerCase();
      if (!wsl) {
        return { ok: false, wsl: false, action, error: "not running in WSL" };
      }
      const distro = configDistro || distroName() || process.env.WSL_DISTRO_NAME || "";
      try {
        if (action === "status") {
          return { action, ...trayStatus({ wsl: true, distro }) };
        }
        if (action === "write_launcher") {
          if (!distro) {
            return { ok: false, wsl: true, action, error: "distro unknown; set config.distro or WSL_DISTRO_NAME" };
          }
          const written = writeLauncherFiles({
            dir: configDir || defaultDir(),
            distro,
            port,
            showMessageBox: args?.showMessageBox !== false,
          });
          let windowsPath = "";
          try {
            windowsPath = await linuxToWindowsPath(written.dir, { timeoutMs });
          } catch {
            windowsPath = "";
          }
          return {
            action,
            ...written,
            windowsPath,
            hint: "Scripts only — no tray app installed. Run the .vbs/.bat from Windows or pin them.",
          };
        }
        if (action === "open_shortcut_dir") {
          const dir = configDir || defaultDir();
          const opened = await openShortcutDir(dir, { timeoutMs });
          return { action, ...opened };
        }
        return { ok: false, wsl: true, action, error: "unknown action" };
      } catch (err) {
        return {
          ok: false,
          wsl: true,
          action,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    presentCall: () => ({ card: "generic", title: "WSL tray" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "WSL tray failed", content: result.content }
        : { card: "generic", title: "WSL tray", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
