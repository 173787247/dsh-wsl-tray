import { detectWsl } from "./lib/wsl-host.js";
import * as core from "./lib/tray.js";

export const name = "dsh-wsl-tray";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:wsl_tray",
    order: 112,
    text: "Use wsl_tray for WSL/Windows interop: Install or report a Windows tray/shortcut launcher for dsh web in WSL.",
  });

  ctx.tools.register({
    name: "wsl_tray",
    description: "Install or report a Windows tray/shortcut launcher for dsh web in WSL.",
    parameters: core.parameters(config),
    output: {
      schema: core.outputSchema(),
      render: (_args, value) => [{ type: "text", text: core.format(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      if (!wsl) return core.notWsl ? core.notWsl() : { ok: false, error: "not running in WSL" };
      return core.execute(args, config);
    },
    presentCall: () => ({ card: "generic", title: "wsl_tray" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "wsl_tray failed", content: result.content }
        : { card: "generic", title: "wsl_tray", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
