# dsh-wsl-tray

DeepSeek Harness tool: **`wsl_tray`** â€?generate Windows launcher/shortcut scripts that start `dsh web` inside WSL.

Counterpart (own implementation) to community [liyu34/dsh-wsl-tray](https://github.com/liyu34/dsh-wsl-tray).

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[ä¸­æ–‡è¯´æ˜Ž â†?README.zh.md](./README.zh.md)

---

## Safety

This plugin **does not** auto-install tray apps. It only writes `.ps1` + hidden `.vbs` + `.bat` under `~/dsh-wsl-tray/` (or `config.dir`).

## Tool

| Arg | Required | Meaning |
|-----|----------|---------|
| `action` | yes | `status` \| `write_launcher` \| `open_shortcut_dir` |
| `showMessageBox` | no | For `write_launcher` (default true) |

- `status` â€?WSL/distro + whether `~/.local/bin/dsh` exists
- `write_launcher` â€?scripts that run `wsl.exe -d DISTRO -- bash -lc 'dsh web'`; returns Windows path via `wslpath -w`
- `open_shortcut_dir` â€?`explorer.exe` that folder

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-tray
```

## Config

```yaml
- id: dsh-wsl-tray
  name: dsh-wsl-tray
  config:
    timeoutMs: 15000
    port: 3080
    # distro: Ubuntu   # default: env WSL_DISTRO_NAME
    # dir: ~/dsh-wsl-tray
```

## Test

```sh
npm test
```

## License

MIT

Restart `dsh web` after installing so Tools lists the new plugin.
