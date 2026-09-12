# dsh-wsl-tray

> **套件安装：** 见 [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)。推荐 `KIT_SET=llm` | `full`。故障树：[TROUBLESHOOTING.zh.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.zh.md)。

DeepSeek Harness 插件：为跑在 WSL 里的 `dsh web` 安装或报告 **Windows 托盘 / 快捷方式**启动器（启停、健康检查）。

配套 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**。

[English → README.md](./README.md)

## 兼容性

| 项 | 值 |
|----|----|
| **插件** | `dsh-wsl-tray` **0.2.3** |
| **最低 dsh** | ≥ **0.1.2**（Windows 中继 `:3081` 一次性 `?token=`） |
| **最新验证** | 以 [dsh-wsl-kit 兼容性](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) 为准（当前 **`0.1.5-rc.1`**）— 套件唯一真源 |
| **套件档位** | `llm` / `full`（也可单独装） |
| **云端 Flash** | settings / `llm-deepseek` 使用 **`deepseek-flash`**（V4.1 Flash）；本插件不配置模型 id |
| **Agent Teams** | 上游实验包；本插件不依赖 |

套件版本地板：[`check-plugin-versions.sh`](https://github.com/173787247/dsh-wsl-kit/blob/master/scripts/check-plugin-versions.sh)。故障树：[TROUBLESHOOTING.zh.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.zh.md)。

**范围：** Windows 托盘/快捷方式封装套件启停与健康检查。打开带 `?token=` 的 URL（restart 输出或 `/tmp/dsh-ui-url`，dsh ≥0.1.2）。

## 为什么需要

点托盘比每次进 WSL 敲 `restart-dsh-web.sh` 方便。dsh **0.1.2** 之后难点是**一次性 launch token**：裸开 `http://127.0.0.1:3081/` 会 **401**。托盘动作应打开带 token 的 URL（或重新 restart 拿新 token）。

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-tray
# 或本地：
dsh plugin --profile web add /absolute/path/to/dsh-wsl-tray
```

重启 `dsh web` 并开**新**会话。工具名：`wsl_tray`。

设置 `DSH_WSL_KIT` 指向 kit 检出目录（或传 `kitPath`）。托盘菜单含 **Start / Restart** 与 **Health check**（[`scripts/check-dsh-health.sh`](https://github.com/173787247/dsh-wsl-kit/blob/master/scripts/check-dsh-health.sh)）。

## 使用注意

- 优先用套件 [`restart-dsh-web.sh`](https://github.com/173787247/dsh-wsl-kit/blob/master/scripts/restart-dsh-web.sh)，保证代理环境与中继正确。
- 重启后打开打印的 `ui=` URL（也在 WSL `/tmp/dsh-ui-url`）。不要收藏裸 `:3081`。
- Token **按进程一次性**——重启 dsh 会使旧 token 失效。

## 许可

MIT
