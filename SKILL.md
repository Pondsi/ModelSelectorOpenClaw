---
name: pcl-model-picker
description: "Use when the OpenClaw Control UI chat model picker is a long flat provider-grouped list, when the user wants a two-column supplier/model master-detail picker, when the per-chat account row (e.g. deepseek:default) should be hidden, or when a previously installed picker enhancement disappeared after an OpenClaw upgrade. Installs, repairs, verifies or uninstalls a browser-side enhancement injected into Control UI's index.html."
license: MIT
compatibility: "Any host that loads a standard SKILL.md and can run PowerShell 5.1+ (or pwsh): DeepSeek Harness (dsh), OpenClaw, Claude Code, Cursor, Dify, Ollama, custom agents. Target is the OpenClaw Control UI web app (browser side). Windows recommended - npm global path auto-detection is built in; -Dist covers non-standard layouts."
allowed-tools: Bash Read Write
metadata:
  author: "Pondsi"
  version: "1.0.0"
  attribution: "Pondsi - attribution is mandatory for any use, including modified variants"
  license: "MIT"
---

# PCL Model Picker

> ## Disclosure (Intended Behavior)
>
> This skill patches the local OpenClaw installation. By design it performs exactly these
> local file operations inside the OpenClaw package directory (`<npm-global>/node_modules/openclaw/dist/control-ui/`):
>
> | Operation | Scope control |
> |-----------|---------------|
> | Append/replace ONE `<script>` line at the end of `index.html` | first run saves `index.html.bak-pcl` next to it; idempotent; `-Remove` reverts |
> | Copy `pcl-model-picker.v4.js` into `assets/` | versioned filename; SW cache-first safe |
> | Delete older `pcl-model-picker.v*.js` files | keeps the latest TWO versions, deletes only files matching `pcl-model-picker.v*.js` |
>
> Nothing else is touched: no packaged JS/CSS/SW files are modified, no network access,
> no telemetry. The injected script runs in the **browser** only, on the model picker DOM.
> The patch is lost when OpenClaw is upgraded (npm overwrites `dist/`); re-run to restore.
> **Installing means accepting these local file modifications.**

Two-column master-detail model picker for the OpenClaw Control UI chat input:

- **Left column**: provider navigation chips (auto-follows the current model's provider)
- **Right column**: only the selected provider's models, its own scroll container
- **Hides** the official per-chat account control (`chat-model-account`, e.g. `deepseek:default`)
  inside the model menu - it is unrelated to picking a provider/model
- Theme-accurate: uses official design tokens (`--bg-hover`, `--accent`, `--border`), dark/light/custom themes follow automatically
- Falls back to the native flat list when search filtering is active or the viewport is < 520px
- Zero self-excitation: every DOM write is state-gated (no mutation loops)

## Install

Run the patch script from this skill's `scripts/` directory:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/pcl-patch.ps1
```

- The script auto-detects the Control UI directory (npm root -g, common prefixes, or the
  `openclaw` CLI on PATH). Non-standard layout: pass `-Dist "<...>\dist\control-ui"`.
- Done when it prints `[PCL] 完成` / `Done` and the injected tag line.
- Then the user presses **Ctrl+F5** in the Control UI browser tab (Service Worker keeps
  cached assets; a hard reload guarantees the new script loads).
- Verify: open the chat model picker - it now shows provider chips on the left and the
  provider's models on the right, with no account row above the model list.

## After an OpenClaw upgrade

npm overwrites `dist/control-ui/`, so the tag and the asset disappear. Re-run the same
command; it is idempotent and re-injects. Done when the script reports the tag replaced.

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File scripts/pcl-patch.ps1 -Remove
```

Removes the tag from `index.html` and all `pcl-model-picker.v*.js` assets. The backup
`index.html.bak-pcl` stays on disk for reference.

## Versioning rule (do not violate)

Control UI's Service Worker is **cache-first for `/assets/`**: if you ever edit
`pcl-model-picker.v4.js`, you MUST rename the file to the next version (v5, v6, ...)
and update `$jsName` in `pcl-patch.ps1`, or browsers keep the stale cached script.
The patch script keeps the two newest versions to avoid 404s from briefly cached old HTML.

## Troubleshooting

- **Picker looks default again after it worked**: an OpenClaw upgrade restored the stock
  `index.html` (no injected tag). Re-run the patch script, then Ctrl+F5.
- **Layout changes did not apply after editing the JS**: versioned-filename rule above was
  violated; bump the filename and re-run.
- **Script cannot find the Control UI**: pass `-Dist` explicitly. On Linux/macOS use pwsh
  and the POSIX candidate paths (already built in).
- **Restock check**: `Select-String pcl-model-picker <dist>\index.html` should show exactly
  one `<script defer src="./assets/pcl-model-picker.v4.js">` line.

## Files

- `scripts/pcl-patch.ps1` - idempotent installer/remover (auto-detects the install dir)
- `scripts/pcl-model-picker.v4.js` - the browser-side enhancement (IIFE, no dependencies)

MIT License with mandatory attribution - credit **Pondsi**. See [LICENSE](LICENSE).
