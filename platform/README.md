# Auto-repair watchdog (GitHub package only)

> **This directory is not part of the ClawHub artifact.** The ClawHub package ships the
> portable core (`SKILL.md`, docs, `scripts/`, `sponsors/`). The watchdog below is a
> Windows-only convenience that lives in the GitHub repository.

## The problem it solves

`npm i -g openclaw@<version>` replaces the whole `dist/control-ui/` directory. That deletes
both the injected `<script>` tag in `index.html` and the enhancement asset in `assets/`, so
the two-column model picker silently disappears after every OpenClaw upgrade. The core
installer is idempotent, but somebody has to run it again.

`pcl-watchdog.ps1` closes that gap: it checks whether the injection still matches the
packaged script (filename **and** content fingerprint) and re-runs the installer only when
something is missing or stale. Registered as a scheduled task it repairs an upgrade within
minutes, and the browser side (the enhancement's own self-update watchdog) then reloads the
open tab automatically — no manual step at all.

## Usage

```powershell
# report only; exit 0 = healthy, 10 = needs repair, 1 = error
powershell -ExecutionPolicy Bypass -File platform\pcl-watchdog.ps1 -Check

# check and repair if needed
powershell -ExecutionPolicy Bypass -File platform\pcl-watchdog.ps1 -Repair

# register the scheduled task (default: every 15 minutes)
powershell -ExecutionPolicy Bypass -File platform\pcl-watchdog.ps1 -Install
powershell -ExecutionPolicy Bypass -File platform\pcl-watchdog.ps1 -Install -IntervalMinutes 30

# inspect / remove
powershell -ExecutionPolicy Bypass -File platform\pcl-watchdog.ps1 -Status
powershell -ExecutionPolicy Bypass -File platform\pcl-watchdog.ps1 -Uninstall
```

| Item | Value |
|------|-------|
| Scheduled task name | `BigLobster-PclModelPickerRepair` |
| Launcher | `platform/pcl-run-hidden.vbs` — registered as `wscript.exe //B //nologo "<launcher>"` |
| Default cadence | every 15 minutes (first run ~2 minutes after registration) |
| Log | `%USERPROFILE%\.openclaw\logs\pcl-model-picker-watchdog.log` (last 200 lines kept) |
| Exit codes | `0` healthy · `10` repaired / needs repair · `1` error |

### Why a VBS launcher instead of `powershell.exe` directly

A scheduled task that runs `powershell.exe` directly makes Task Scheduler allocate a
console window in the interactive session, which can flash on screen every cycle —
even with `-WindowStyle Hidden`, because the console exists before PowerShell can hide
it. `wscript.exe` is a GUI-subsystem host (no console is created at all) and
`WshShell.Run(cmd, 0, False)` starts PowerShell with the window already hidden, so the
task is completely invisible. `-Install` registers that launcher automatically.

> If the task was first registered from an **elevated** shell, its ACL only grants write
> access to Administrators. Re-register it from an elevated PowerShell (one time):
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File platform\pcl-watchdog.ps1 -Install
> ```

## What it touches

Only the same two paths as the core installer — it never edits OpenClaw's packaged code:

1. `<control-ui>\index.html` (one `<script>` line, via `scripts\pcl-patch.ps1`)
2. `<control-ui>\assets\pcl-model-picker.v*.js`

When everything already matches, it writes nothing (read-only check, no installer run).

## Chinese summary / 中文说明

**问题**：`npm i -g openclaw@新版本` 会整个替换 `dist/control-ui/`，注入标签和增强脚本一起被删，
模型选择器就悄悄退回原样。

**做法**：本看门狗比对 `index.html` 里的注入标签与包内脚本（文件名 + 内容指纹），只有缺失或
过期时才重跑安装器；注册成计划任务后，升级几分钟内自动修复，浏览器端再自动重载页面 ——
全程无需手动操作。

**常用命令**：`-Check` 只检查（0=正常 / 10=需修复）、`-Repair` 检查并修复、`-Install` 注册
计划任务（默认每 15 分钟）、`-Uninstall` 删除任务、`-Status` 查看任务与最近日志。

**无黑窗**：`-Install` 注册的是自带的 `pcl-run-hidden.vbs`（经 `wscript.exe` 启动，不会创建
控制台），避免 Task Scheduler 直接启动 `powershell.exe` 时每 15 分钟闪一次黑窗。若该任务当初
是以管理员身份注册的，需要**用管理员 PowerShell 重跑一次 `-Install`** 才能改成无窗口方式。

**只碰两处文件**：`index.html` 一行注入标签 + `assets/` 里的增强脚本；一切正常时零写入。

Pondsi (+MiMo-v2.5 +deepseek-v4.1-flash-expires-on-0910 +GLM5.3-flash) — automatically committed by OpenClaw
