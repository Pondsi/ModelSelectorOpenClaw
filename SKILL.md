---
name: modelselector-openclaw
description: "Use when the OpenClaw Control UI chat model picker is one long flat provider-grouped list and picking a model is slow, when you have many providers each with many models, when the user wants a two-column provider/model picker (left = provider navigation, right = only that provider's models), when the per-chat account row (e.g. deepseek:default) should be hidden, or when a previously installed picker enhancement disappeared after an upgrade. Installs, repairs, verifies or uninstalls a browser-side enhancement injected into the Control UI's index.html."
license: MIT
compatibility: "Any host that loads a standard SKILL.md and can run PowerShell 5.1+ (or pwsh): DeepSeek Harness (dsh), OpenClaw, Claude Code, Cursor, Dify, Ollama, custom agents. Target is the OpenClaw Control UI web app (browser side). Windows recommended - npm global path auto-detection is built in; -Dist covers non-standard layouts."
allowed-tools: Bash Read Write
metadata:
  author: "Pondsi"
  version: "1.1.0"
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
  flat list is used only below 340px viewport width or while the official search filter
  is active.

> ## Disclosure (Intended Behavior)
>
> This skill patches the local OpenClaw installation. By design it performs exactly these
> local file operations inside the OpenClaw package directory
> (`<npm-global>/node_modules/openclaw/dist/control-ui/`):
>
> | Operation | Scope control |
> |-----------|---------------|
> | Append/replace ONE `<script>` line at the end of `index.html` | first run saves `index.html.bak-pcl` next to it; idempotent; `-Remove` reverts |
> | Copy `pcl-model-picker.v5.js` into `assets/` | versioned filename + content fingerprint in the URL |
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
- Then reload the Control UI tab (**F5 is enough**; the injected URL carries a content
  fingerprint, so a normal reload fetches the new script).
- Verify: open the chat model picker — provider chips on the left, that provider's models
  on the right, no account row above the list.

## Verify in one line

In the Control UI browser console:

```js
window.pclModelPickerDiag()
```

Returns `{version, innerWidth, pickerFound, menuFound, state, sections, railFound, chips, twoCol}`.
`state` is `two-col` when active, `fallback-narrow` below 340px, `fallback-filter` while the
official search filter is on. The document also carries `<html data-pcl-model-picker="v5">`.

## After an OpenClaw upgrade

npm overwrites `dist/control-ui/`, so the tag and the asset disappear. Re-run the same
command; it is idempotent and re-injects. Done when the script reports the tag replaced.

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File scripts/pcl-patch.ps1 -Remove
```

Removes the tag from `index.html` and all `pcl-model-picker.v*.js` assets. The backup
`index.html.bak-pcl` stays on disk for reference.

## Cache rule (do not violate)

Control UI's Service Worker is **cache-first for `/assets/`** and the HTTP response is
`immutable`. The installer therefore puts a content fingerprint in the injected URL
(`./assets/pcl-model-picker.v5.js?h=<sha256-8>`) and bumps the filename on content changes.
If you edit the JS yourself, either re-run `pcl-patch.ps1` (it recomputes the fingerprint)
or rename the file to the next version. Skipping this leaves browsers on the stale script.

## Troubleshooting

- **Picker looks default again after it worked**: check `window.pclModelPickerDiag()`.
  `state: "fallback-narrow"` means the viewport is below 340px (zoom/high DPI/split view);
  no `state` means the injected script is not running — re-run the patch script, then reload.
- **Enhancement gone after an OpenClaw upgrade**: npm restored the stock `index.html`.
  Re-run the patch script, then reload.
- **Layout changes did not apply after editing the JS**: the fingerprint/version rule above
  was skipped; re-run `pcl-patch.ps1`.
- **Script cannot find the Control UI**: pass `-Dist` explicitly. On Linux/macOS use pwsh
  and the POSIX candidate paths (already built in).
- **Restock check**: `Select-String pcl-model-picker <dist>\index.html` should show exactly
  one `<script defer src="./assets/pcl-model-picker.v5.js?h=…">` line.

## Files

- `scripts/pcl-patch.ps1` — idempotent installer/remover (auto-detects the install dir)
- `scripts/pcl-model-picker.v5.js` — the browser-side enhancement (IIFE, no dependencies)

MIT License with mandatory attribution — credit **Pondsi**. See [LICENSE](LICENSE).

Pondsi (+MiMo-v2.5/v2.5pro+deepseek-v4-flash/pro+deepseek-v4.1-flash-expires-on-0910+GLM5.3-flash+Gemini3.1-pro+Qwen3.8-27b+Gemini3.8-flash) — automatically committed by OpenClaw
