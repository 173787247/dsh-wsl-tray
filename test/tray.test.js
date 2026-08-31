import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { format } from "../lib/tray.js";

describe("wsl_tray", () => {
  it("formats", () => {
    assert.match(format({ ok: true }), /ok/i);
  });
});
