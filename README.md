# dsh-wsl-tray
> **Install set:** part of [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit). Prefer `KIT_SET=daily` | `llm` | `github` | `full` (see kit README). Fault tree: [TROUBLESHOOTING.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.md).


DeepSeek Harness plugin: Install or report a Windows tray/shortcut launcher for dsh web running in WSL.

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-tray
# or local:
dsh plugin --profile web add /absolute/path/to/dsh-wsl-tray
```

Restart `dsh web` and open a **new** session. Tool: `wsl_tray`.

Set `DSH_WSL_KIT` to your kit checkout (or pass `kitPath`). Tray menu includes **Start / Restart** and **Health check** (`scripts/check-dsh-health.sh`).

## License

MIT
