import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  buildLauncherScripts,
  formatTray,
  trayStatus,
  writeLauncherFiles,
} from "../lib/tray.js";

describe("wsl_tray", () => {
  it("status reports dsh path", () => {
    const s = trayStatus({
      wsl: true,
      distro: "Ubuntu",
      home: "/home/dev",
      exists: (p) => p === "/home/dev/.local/bin/dsh",
    });
    assert.equal(s.dshExists, true);
    assert.equal(s.distro, "Ubuntu");
  });

  it("builds launcher scripts with wsl -d and dsh web", () => {
    const { ps1, bat, vbs } = buildLauncherScripts({ distro: "Ubuntu", port: 3080 });
    assert.match(ps1, /wsl\.exe/);
    assert.match(ps1, /dsh web/);
    assert.match(bat, /wsl\.exe -d Ubuntu/);
    assert.match(vbs, /start-dsh-web\.ps1/);
  });

  it("writes files under target dir", () => {
    const root = mkdtempSync(join(tmpdir(), "dsh-tray-"));
    try {
      const written = writeLauncherFiles({ dir: root, distro: "Debian", port: 3080 });
      assert.equal(written.ok, true);
      const ps1 = readFileSync(written.files.ps1, "utf8");
      assert.match(ps1, /Debian/);
      assert.ok(written.files.bat);
      assert.ok(written.files.vbs);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("formats", () => {
    assert.match(formatTray({ action: "status", distro: "Ubuntu", dshPath: "/x", dshExists: false }), /Ubuntu/);
  });
});
