---
name: modelselector-openclaw
description: "Use when the OpenClaw Control UI chat model picker is one long flat provider-grouped list and picking a model is slow, when you have many providers each with many models, when the user wants a two-column provider/model picker (left = provider navigation, right = only that provider's models), when the per-chat account row (e.g. deepseek:default) should be hidden, or when a previously installed picker enhancement disappeared after an upgrade. Installs, repairs, verifies or uninstalls a browser-side enhancement injected into the Control UI's index.html."
license: MIT
compatibility: "Any host that loads a standard SKILL.md and can run PowerShell 5.1+ (or pwsh): DeepSeek Harness (dsh), OpenClaw, Claude Code, Cursor, Dify, Ollama, custom agents. Target is the OpenClaw Control UI web app (browser side). Windows recommended - npm global path auto-detection is built in; -Dist covers non-standard layouts."
allowed-tools: Bash Read Write
metadata:
  author: "Pondsi"
  version: "1.4.0"
  attribution: "Pondsi - attribution is mandatory for any use, including modified variants"
  license: "MIT"
---

# ModelSelectorOpenClaw

**Pick the right model in two clicks, even with dozens of providers and hundreds of models.**

The OpenClaw Control UI renders its model picker as one long flat list, grouped by
provider. With many providers — each carrying many models — finding a model means a lot
of scrolling and eyeballing. This skill turns that list into a **two-column master-detail
picker with a provider navigation column**:

```
┌─────────────┬────────────────────────────────┐
│ All         │  [ search ]                     │
│ ▸ DeepSeek  │  deepseek-v4-flash              │
│ ▸ Qwen      │  deepseek-v4-pro                │
│ ▸ GLM       │  deepseek-reasoner              │
│ ▸ Mistral   │  … only this provider's models  │
└─────────────┴────────────────────────────────┘
```

- **Left column = provider navigation.** Click a provider, the right column shows only
  that provider's models. Auto-follows the provider of the model currently in use.
- **Right column = that provider's models only**, in its own scroll container. The two
  columns scroll independently (structural CSS Grid, not absolute positioning hacks).
- **Hides the official per-chat account row** (`.chat-model-account`, e.g.
  `deepseek:default`) inside the menu — it is unrelated to picking a provider/model.
- **Theme-accurate**: uses official design tokens (`--bg-hover`, `--accent`, `--border`),
  so dark / light / custom themes follow automatically.
- **Zero self-excitation**: every DOM write is state-gated; no mutation loops.
- **Responsive**: the provider column narrows with `clamp(84px, 26%, 132px)`; the native
  flat list is used only below 340px viewport width. The official search filter keeps the
  two-column layout and simply hides provider groups with no visible match.
- **Instance-safe**: if the app mounts several pickers (main chat, side/session views,
  cached views), only the rendered one is enhanced — a hidden sibling can never steal it.
- **Self-healing**: the stylesheet is re-injected if the document loses it, and a
  state-gated 1-second heartbeat re-runs the pass, so any silent loss recovers within a
  second.
- **Self-updating**: an already-open tab notices server-side updates by itself and reloads
  (never downgrades, never interrupts typing), so a patched install never looks stale.

> ## Disclosure (Intended Behavior)
>
> This skill patches the local OpenClaw installation. By design it performs exactly these
> local file operations inside the OpenClaw package directory
> (`<npm-global>/node_modules/openclaw/dist/control-ui/`):
>
> | Operation | Scope control |
> |-----------|---------------|
> | Append/replace ONE `<script>` line at the end of `index.html` | first run saves `index.html.bak-pcl` next to it; idempotent; `-Remove` reverts |
> | Copy `pcl-model-picker.v7.js` into `assets/` | versioned filename + content fingerprint in the URL |
> | Delete older `pcl-model-picker.v*.js` files | keeps the latest TWO versions, deletes only files matching `pcl-model-picker.v*.js` |
>
> Nothing else is touched: no packaged JS/CSS/SW files are modified, no network access,
> no telemetry. The injected script runs in the **browser** only, on the model picker DOM.
> The patch is lost when OpenClaw is upgraded (npm overwrites `dist/`); re-run to restore.
> **Installing means accepting these local file modifications.**

## Install

Run the patch script from this skill's `scripts/` directory:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/pcl-patch.ps1
```

- The script auto-detects the Control UI directory (npm root -g, common prefixes, or the
  `openclaw` CLI on PATH). Non-standard layout: pass `-Dist "<...>\dist\control-ui"`.
- Done when it prints `[PCL] 完成` / `Done` plus the injected tag line.
- Then reload the Control UI tab once (**F5 is enough**). From this version on, later patches
  are picked up automatically: the injected script polls the app shell and reloads the tab
  when the server is newer (never downgrades, never interrupts typing).
- Verify: open the chat model picker — provider chips on the left, that provider's models
  on the right, no account row above the list.

## Verify in one line

In the Control UI browser console:

```js
window.pclModelPickerDiag()
```

Returns `{version, selfFp, innerWidth, stylePresent, heartbeats, lastEvent, pickers, menus, instances[]}`.
`instances[]` reports each picker instance (`state`, `twoCol`, `filtering`, `rendered`, `rail`,
`chips`). `state` is `two-col` when active, `two-col-filtering` while the official search
filter is on (layout stays two-column), `fallback-narrow` below 340px.
The document also carries `<html data-pcl-model-picker="v7">`.
Self-heal events: `window.pclModelPickerLog()`. To force an update check:
`await window.pclModelPickerCheckUpdate()`.

## After an OpenClaw upgrade

npm overwrites `dist/control-ui/`, so the tag and the asset disappear. Re-run the same
command; it is idempotent and re-injects. Done when the script reports the tag replaced.

The GitHub repository additionally ships an optional Windows auto-repair watchdog
(`platform/pcl-watchdog.ps1`) that detects this wipe and re-runs the installer on a
schedule. It is **not** part of this ClawHub artifact.

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File scripts/pcl-patch.ps1 -Remove
```

Removes the tag from `index.html` and all `pcl-model-picker.v*.js` assets. The backup
`index.html.bak-pcl` stays on disk for reference.

## Cache rule (do not violate)

Control UI's Service Worker is **cache-first for `/assets/`** and the HTTP response is
`immutable`. The installer therefore puts a content fingerprint in the injected URL
(`./assets/pcl-model-picker.v7.js?h=<sha256-8>`) and bumps the filename on content changes.
If you edit the JS yourself, re-run `pcl-patch.ps1` (it recomputes the fingerprint) or rename
the file to the next version. Since 1.2.0 a missed reload is self-healing: open tabs detect
the newer build and reload themselves.

## Troubleshooting

- **Picker looks default again after it worked**: check `window.pclModelPickerDiag()`.
  `stylePresent: false` or a `lastEvent` of `style-injected` means the document had lost the
  stylesheet and the heartbeat just restored it. `state: "fallback-narrow"` means the
  viewport is below 340px (zoom/high DPI/split view). If `instances[]` shows a rendered
  instance with `twoCol: false` for more than a second, the script is not running — re-run
  the patch script. If the server was patched but the tab is old, the tab reloads itself
  within ~5 minutes (or run `await window.pclModelPickerCheckUpdate()`).
- **Only one of two open composers is enhanced**: expected. Only the rendered picker is
  enhanced; a hidden composer's picker is skipped until it is shown.
- **Enhancement gone after an OpenClaw upgrade**: npm restored the stock `index.html`.
  Re-run the patch script, then reload.
- **Layout changes did not apply after editing the JS**: the fingerprint/version rule above
  was skipped; re-run `pcl-patch.ps1`.
- **Script cannot find the Control UI**: pass `-Dist` explicitly. On Linux/macOS use pwsh
  and the POSIX candidate paths (already built in).
- **Restock check**: `Select-String pcl-model-picker <dist>\index.html` should show exactly
  one `<script defer src="./assets/pcl-model-picker.v7.js?h=…">` line.

## Files

- `scripts/pcl-patch.ps1` — idempotent installer/remover (auto-detects the install dir)
- `scripts/pcl-model-picker.v7.js` — the browser-side enhancement (IIFE, no dependencies)

MIT License with mandatory attribution — credit **Pondsi**. See [LICENSE](LICENSE).

Pondsi (+MiMo-v2.5 +deepseek-v4.1-flash-expires-on-0910 +GLM5.3-flash) — automatically committed by OpenClaw
