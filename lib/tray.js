import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { distroName, runExec, windowsBin } from "./wsl-host.js";

export function defaultDir({ home = homedir() } = {}) {
  return join(home, "dsh-wsl-tray").replace(/\\/g, "/");
}

export function dshBinaryPath({ home = homedir() } = {}) {
  return join(home, ".local", "bin", "dsh").replace(/\\/g, "/");
}

export function trayStatus({
  wsl,
  distro,
  home = homedir(),
  exists = existsSync,
  env = process.env,
} = {}) {
  const name = distro || distroName({ env }) || env.WSL_DISTRO_NAME || "";
  const dshPath = dshBinaryPath({ home });
  return {
    ok: true,
    wsl: Boolean(wsl),
    distro: name || null,
    dshPath,
    dshExists: exists(dshPath),
  };
}

export function buildLauncherScripts({ distro, port = 3080, showMessageBox = true }) {
  const d = String(distro || "").replace(/"/g, "");
  if (!d) throw new Error("distro name required");
  const p = Number(port) || 3080;
  const ps1 = [
    `$ErrorActionPreference = 'Stop'`,
    `$distro = '${d.replace(/'/g, "''")}'`,
    `$port = ${p}`,
    `Start-Process -FilePath 'wsl.exe' -ArgumentList @('-d', $distro, '--', 'bash', '-lc', 'dsh web') -WindowStyle Hidden`,
    showMessageBox
      ? `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show(\"Started dsh web in WSL ($distro). Try http://127.0.0.1:$port/\", 'dsh-wsl-tray') | Out-Null`
      : `# no MessageBox`,
  ].join("\n") + "\n";

  const bat = [
    `@echo off`,
    `wsl.exe -d ${d} -- bash -lc "dsh web"`,
    `rem Optional: start http://127.0.0.1:${p}/ in your browser`,
    "",
  ].join("\r\n");

  // VBS launches the ps1 hidden (no console flash)
  const vbs = [
    `Set sh = CreateObject("WScript.Shell")`,
    `ps1 = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\\start-dsh-web.ps1"`,
    `sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & ps1 & """", 0, False`,
    "",
  ].join("\r\n");

  return { ps1, bat, vbs };
}

export function writeLauncherFiles({
  dir,
  distro,
  port = 3080,
  showMessageBox = true,
  mkdir = mkdirSync,
  write = writeFileSync,
} = {}) {
  const target = (dir && String(dir).trim()) || defaultDir();
  mkdir(target, { recursive: true });
  const scripts = buildLauncherScripts({ distro, port, showMessageBox });
  const ps1Path = join(target, "start-dsh-web.ps1").replace(/\\/g, "/");
  const batPath = join(target, "start-dsh-web.bat").replace(/\\/g, "/");
  const vbsPath = join(target, "start-dsh-web-hidden.vbs").replace(/\\/g, "/");
  write(ps1Path, scripts.ps1, "utf8");
  write(batPath, scripts.bat, "utf8");
  write(vbsPath, scripts.vbs, "utf8");
  return {
    ok: true,
    dir: target,
    files: { ps1: ps1Path, bat: batPath, vbs: vbsPath },
  };
}

export async function linuxToWindowsPath(linuxPath, { timeoutMs = 15_000, run = runExec } = {}) {
  const { stdout } = await run("wslpath", ["-w", linuxPath], { timeoutMs });
  return String(stdout || "").trim();
}

export async function openShortcutDir(linuxDir, { timeoutMs = 15_000, run = runExec } = {}) {
  const winPath = await linuxToWindowsPath(linuxDir, { timeoutMs, run });
  if (!winPath) throw new Error("wslpath returned empty");
  const explorer = windowsBin("explorer.exe");
  await run(explorer, [winPath], { timeoutMs });
  return { ok: true, linuxDir, windowsPath: winPath };
}

export function formatTray(value) {
  if (value?.error && value.ok === false) {
    return `wsl_tray failed: ${value.error}`;
  }
  const lines = [`wsl_tray ${value.action || "result"}`];
  if (value.distro !== undefined) lines.push(`distro: ${value.distro || "(none)"}`);
  if (value.dshPath) lines.push(`dsh: ${value.dshPath} (exists=${value.dshExists})`);
  if (value.dir) lines.push(`dir: ${value.dir}`);
  if (value.windowsPath) lines.push(`windowsPath: ${value.windowsPath}`);
  if (value.files) {
    lines.push("files:");
    for (const [k, v] of Object.entries(value.files)) lines.push(`- ${k}: ${v}`);
  }
  if (value.hint) lines.push(value.hint);
  if (value.error) lines.push(`error: ${value.error}`);
  return lines.join("\n");
}
