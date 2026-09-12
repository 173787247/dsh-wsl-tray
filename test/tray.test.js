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
    assert.match(ps1, /dsh-web-alive\.inc\.sh/);
    assert.match(ps1, /dsh-ui-url/);
    assert.match(ps1, /Start-DshWsl/);
    assert.match(ps1, /Get-DshTokenUrl/);
    assert.match(ps1, /token=/);
    assert.ok(!ps1.includes("Start-Process 'http://127.0.0.1:3081'"));
    assert.ok(!ps1.includes("AIFullStackDevelopment") || ps1.includes(kit));

    const health = healthPs1Body("Ubuntu-24.04", kit);
    assert.match(health, /check-dsh-health\.sh/);

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
