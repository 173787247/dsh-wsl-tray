# Changelog

## 0.2.3

- After restart, open `/tmp/dsh-ui-url` (dsh ≥0.1.2 launch token on :3081). Copy `dsh-web-alive.inc.sh` with health/restart.

## 0.2.2

- Resolve `dsh-wsl-kit` via `kitPath` / `DSH_WSL_KIT` / fallbacks (no single hardcoded Desktop path required).
- Tray menu: **Start / Restart dsh** + **Health check** (`check-dsh-health.sh`).
- Writes `check-dsh-health.ps1` alongside `start-dsh-web.ps1`.

## 0.2.1

- Prefer kit `restart-dsh-web.sh` and browser URL `:3081`.

## 0.1.0

- Initial public release of `dsh-wsl-tray` for DeepSeek Harness on Windows + WSL.
