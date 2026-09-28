import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ahkBody, format, healthPs1Body, ps1Body, resolveKitPath } from "../lib/tray.js";

describe("wsl_tray", () => {
  it("formats", () => {
    assert.match(format({ ok: true }), /ok/i);
  });

  it("resolves kit path from arg then env then fallback", () => {
    const looksLike = (p, needle) => String(p).replace(/\\/g, "/").includes(needle);
    const viaArg = resolveKitPath({
      kitPath: "/kit",
      exists: (p) => looksLike(p, "/kit/scripts/restart-dsh-web.sh"),
      candidates: [],
    });
    assert.equal(viaArg.ok, true);
    assert.equal(viaArg.source, "arg");

    const viaEnv = resolveKitPath({
      env: { DSH_WSL_KIT: "/envkit" },
      exists: (p) => looksLike(p, "/envkit/scripts/restart-dsh-web.sh"),
      candidates: [],
    });
    assert.equal(viaEnv.source, "env");

    const miss = resolveKitPath({ exists: () => false, candidates: ["/nope"] });
    assert.equal(miss.ok, false);
  });

  it("ps1 and ahk open token URL only (never bare :3081 as fallback open)", () => {
    const kit = "/mnt/c/work/dsh-wsl-kit";
    const ps1 = ps1Body("Ubuntu-24.04", "http://127.0.0.1:3081", kit);
    assert.match(ps1, /restart-dsh-web\.sh/);
    assert.match(ps1, /check-dsh-health\.sh/);
    assert.match(ps1, /dsh-ui-url/);
    assert.match(ps1, /Start-DshWsl/);
    assert.match(ps1, /Get-DshTokenUrl/);
    assert.match(ps1, /token=/);
    assert.ok(!ps1.includes("Start-Process 'http://127.0.0.1:3081'"));
    assert.ok(!ps1.includes("AIFullStackDevelopment") || ps1.includes(kit));

    // The command handed to bash is invoked with & and embedded in a
    // PowerShell single-quoted string, so any single quote inside it has to be
    // doubled. Both halves have been wrong in ways that produced no error at
    // all: Start-Process -ArgumentList split the command on its own spaces and
    // ran only the tail, and an unescaped quote ended the string early.
    assert.match(ps1, /& wsl\.exe -d \$distro -- bash -lc /);
    assert.ok(!ps1.includes("Start-Process wsl.exe"), "ArgumentList form splits the command");
    for (const line of ps1.split("\n").filter((l) => l.includes("bash -lc"))) {
      const body = line.slice(line.indexOf("bash -lc '") + "bash -lc '".length);
      assert.match(body, /''/, `single quotes must be doubled for PowerShell: ${line}`);
    }

    // Call the kit script directly. The sed detour existed only because the
    // scripts used to be read from a CRLF checkout under /mnt/c; from the WSL
    // clone that is unnecessary, and it carried a PATH assignment whose
    // unquoted $PATH contained "Program Files (x86)" -- a bash syntax error
    // that made the launcher do nothing.
    assert.ok(!ps1.includes("export PATH="), "PATH is not set here any more");
    assert.ok(!ps1.includes("sed 's/"), "no CRLF stripping needed from a WSL path");

    const health = healthPs1Body("Ubuntu-24.04", kit);
    assert.match(health, /check-dsh-health\.sh/);
    assert.match(health, /& wsl\.exe -d \$distro -- bash -lc /);
    assert.ok(!health.includes("export PATH="));

    const ahk = ahkBody(
      "Ubuntu-24.04",
      "http://127.0.0.1:3081",
      "C:\\Users\\u\\.dsh\\tray\\start-dsh-web.ps1",
      kit,
      "C:\\Users\\u\\.dsh\\tray\\check-dsh-health.ps1",
      "C:\\Users\\u\\.dsh\\tray\\open-dsh-ui.ps1",
    );
    assert.match(ahk, /Health check/);
    assert.match(ahk, /Restart dsh/);
    assert.match(ahk, /open-dsh-ui\.ps1/);
    assert.match(ahk, /token URL/);
    assert.ok(!ahk.includes("explorer.exe http://127.0.0.1:3081"));
    assert.match(ahk, /kitPath: \/mnt\/c\/work\/dsh-wsl-kit/);
  });
});
