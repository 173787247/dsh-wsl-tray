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
    // PowerShell single-quoted string. Both halves have been wrong in ways that
    // produced no error at all: Start-Process -ArgumentList split the command on
    // its own spaces and ran only the tail, and an unescaped quote ended the
    // string early.
    assert.ok(!ps1.includes("Start-Process wsl.exe"), "ArgumentList form splits the command");

    // Read the bash command the way PowerShell would, and require the content to
    // be what bash should receive.
    //
    // Counting quotes is not enough ('bash 'x.sh'' has an even number and is
    // still broken) and neither is stripping the outer pair, because that broken
    // string happens to unquote to the right text. What separates them is where
    // the string ENDS: a lone quote closes it and the remainder is parsed as
    // PowerShell rather than as part of the argument, so the content is
    // truncated. Scan for the real end, then compare the content.
    //
    // Text after the closing quote is legitimate and does occur:
    //   ... bash -lc 'cat /tmp/x 2>/dev/null').Trim()
    const psSingleQuoted = (line) => {
      const start = line.indexOf("bash -lc '");
      assert.ok(start >= 0, `no bash -lc argument: ${line}`);
      let i = start + "bash -lc '".length;
      let out = "";
      while (i < line.length) {
        if (line[i] !== "'") { out += line[i++]; continue; }
        if (line[i + 1] === "'") { out += "'"; i += 2; continue; }
        return out; // lone quote: the string ends here
      }
      assert.fail(`unterminated PowerShell string: ${line}`);
    };
    const lines = ps1.split("\n").filter((l) => l.includes("bash -lc "));
    assert.equal(lines.length, 3, "GetDshTokenUrl, Start-DshWsl, Show-DshHealth");
    assert.equal(psSingleQuoted(lines[0]), "cat /tmp/dsh-ui-url 2>/dev/null");
    // 自 c0c5278 起，Start-DshWsl 先试着用 kit 的 revive 脚本，没有再退回 restart。
    // 两个分支都要在，缺任一个都意味着恢复路径少了一半。
    const startCmd = psSingleQuoted(lines[1]);
    assert.match(startCmd, /revive-dsh\.sh/, 'revive 分支应在（能修半装状态）');
    assert.match(startCmd, /restart-dsh-web\.sh/, 'restart 兜底应在（只装了本插件的主机也要能用）');
    assert.match(startCmd, /^if \[ -f /, '应为运行时的存在性判断，而不是无条件调用');
    assert.equal(psSingleQuoted(lines[2]), `bash '${kit}/scripts/check-dsh-health.sh'; echo; read -n 1 -p 'Press any key...'`);

    // Call the kit script directly. The sed detour existed only because the
    // scripts used to be read from a CRLF checkout under /mnt/c; from the WSL
    // clone it is unnecessary, and it carried a PATH assignment whose unquoted
    // $PATH contained "Program Files (x86)" -- a bash syntax error that made the
    // launcher do nothing.
    assert.ok(!ps1.includes("export PATH="), "PATH is not set here any more");
    assert.ok(!ps1.includes("sed 's/"), "no CRLF stripping needed from a WSL path");

    const health = healthPs1Body("Ubuntu-24.04", kit);
    assert.match(health, /check-dsh-health\.sh/);
    assert.match(health, /& wsl\.exe -d \$distro -- bash -lc /);
    assert.ok(!health.includes("export PATH="));
    for (const line of health.split("\n").filter((l) => l.includes("bash -lc "))) {
      assert.equal(psSingleQuoted(line), `bash '${kit}/scripts/check-dsh-health.sh'; echo; read -n 1 -p 'Press any key...'`);
    }

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
