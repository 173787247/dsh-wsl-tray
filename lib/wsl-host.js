// Canonical copy — sync to plugins via dsh-wsl-kit/scripts/sync-wsl-common.mjs
import { existsSync, readFileSync } from "node:fs";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const WINDOWS_BINS = {
  "powershell.exe": ["/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"],
  "cmd.exe": ["/mnt/c/Windows/System32/cmd.exe"],
  "explorer.exe": ["/mnt/c/Windows/explorer.exe"],
};

export function windowsBin(name, { exists = existsSync } = {}) {
  for (const p of WINDOWS_BINS[name] || []) {
    if (exists(p)) return p;
  }
  return name;
}

export function detectWsl({ env = process.env, readRelease = readOsRelease } = {}) {
  if (env.WSL_DISTRO_NAME || env.WSL_INTEROP) return true;
  try {
    return /microsoft/i.test(readRelease());
  } catch {
    return false;
  }
}

/**
 * The distro name as Windows knows it.
 *
 * WSL_DISTRO_NAME is set when a process starts from Windows, which covers the
 * common case and is why the variable was the only source. It is absent from a
 * process started by systemd -- so after the first detached restart dsh had no
 * distro name, this returned the literal "WSL", and the desktop shortcut was
 * regenerated pointing at \\wsl.localhost\WSL\..., a host that does not exist.
 * Double-clicking it did nothing at all: no window, no error, no clue.
 *
 * wslpath asks Windows itself, so it is right regardless of how this process
 * started. /proc/sys/kernel/hostname is not a substitute -- WSL2 sets it to the
 * machine hostname ("grandocean"), not the distro.
 *
 * Verified with Test-Path: \\wsl.localhost\Ubuntu-24.04\... resolves,
 * \\wsl.localhost\WSL\... does not.
 */
export function distroName({ env = process.env, run = defaultWslpath } = {}) {
  if (env.WSL_DISTRO_NAME) return env.WSL_DISTRO_NAME;
  const fromWslpath = run();
  if (fromWslpath) return fromWslpath;
  return "WSL";
}

function defaultWslpath() {
  try {
    // \\wsl.localhost\<distro>\   or the older \\wsl$\<distro>\
    const out = execFileSync("wslpath", ["-w", "/"], { encoding: "utf8", timeout: 5000 }).trim();
    const m = out.match(/^\\\\wsl(?:\.localhost|\$)\\([^\\]+)\\/);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

export async function runPowerShell(script, { timeoutMs = 15_000 } = {}) {
  const bin = windowsBin("powershell.exe");
  const { stdout, stderr } = await execFileAsync(
    bin,
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { timeout: timeoutMs, windowsHide: true, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  return { stdout: String(stdout ?? ""), stderr: String(stderr ?? "") };
}

export async function runCmd(args, { timeoutMs = 15_000 } = {}) {
  const bin = windowsBin("cmd.exe");
  const { stdout, stderr } = await execFileAsync(bin, args, {
    timeout: timeoutMs,
    windowsHide: true,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  return { stdout: String(stdout ?? ""), stderr: String(stderr ?? "") };
}

function readOsRelease() {
  return readFileSync("/proc/sys/kernel/osrelease", "utf8");
}
