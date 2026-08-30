# dsh-wsl-tray

DeepSeek Harness 工具：**`wsl_tray`** — 生成在 WSL 中启动 `dsh web` 的 Windows 快捷脚本。

对应社区 [liyu34/dsh-wsl-tray](https://github.com/liyu34/dsh-wsl-tray) 的自有实现。

属于 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**。

[English → README.md](./README.md)

---

## 安全说明

本插件**不会**自动安装托盘程序，只在 `~/dsh-wsl-tray/`（或 `config.dir`）写入 `.ps1` / 隐藏 `.vbs` / `.bat`。

## 工具参数

| 参数 | 必需 | 含义 |
|------|------|------|
| `action` | 是 | `status` \| `write_launcher` \| `open_shortcut_dir` |
| `showMessageBox` | 否 | `write_launcher` 时是否弹 MessageBox（默认 true） |

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-tray
```

## 配置

```yaml
- id: dsh-wsl-tray
  name: dsh-wsl-tray
  config:
    timeoutMs: 15000
    port: 3080
```

## 测试

```sh
npm test
```

## 许可

MIT
