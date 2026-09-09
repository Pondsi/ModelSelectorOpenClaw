# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-09-09

### Changed

- **Renamed the project to ModelSelectorOpenClaw** (previously published as *PCL Model
  Picker*). Skill slug: `modelselector-openclaw`. The enhancement file is now
  `pcl-model-picker.v5.js`; the installer is unchanged in name (`pcl-patch.ps1`).
- Documentation rewritten around the core selling point: a **provider navigation column**
  that makes picking a model two clicks even with many providers, each with many models.

### Fixed

- **Silent disappearance of the enhancement on narrower viewports.** The old guard used a
  hard `MIN_WIDTH = 520`; high-DPI scaling, a narrow window or a split view drops
  `window.innerWidth` below 520 CSS px, at which point the script silently reverted to the
  native flat list (`clearFilterState()`) — the user saw "the enhancement is gone" with no
  hint. The threshold is now **340px**, and the provider column width is responsive
  (`grid-template-columns: clamp(84px, 26%, 132px) minmax(0, 1fr)`), so narrow layouts keep
  the two-column behaviour instead of collapsing.
- **Same-filename content changes were pinned by the browser cache.** Control UI's Service
  Worker is cache-first for `/assets/` and the asset response is `immutable`. The injected
  URL now carries a content fingerprint (`./assets/pcl-model-picker.v5.js?h=<sha256-8>`),
  so any content change is a new cache key; `pcl-patch.ps1` recomputes it on every run.

### Added

- **Observability**: `<html data-pcl-model-picker="v5">`, menu attribute
  `data-pcl-state` (`two-col` / `fallback-narrow` / `fallback-filter`) and a one-line
  browser-console diagnostic `window.pclModelPickerDiag()`.
- **Menu lookup fallback**: if a future Control UI renders the menu in a top-layer portal
  instead of inside the `<details>` element, the enhancement still resolves it document-wide
  instead of failing silently.
- `.github/` issue templates and security policy (GitHub repository only).

### Verified

- End-to-end in a **real, authenticated Control UI** (fresh browser profile, headless Edge
  over CDP): at 1440px, 480px and 360px viewport widths the picker reports
  `state: "two-col"`, `railFound: true`, 10 provider chips, two-column grid, and the
  per-chat account row hidden. Previously 480px fell back to the native list.
- The fingerprint URL and the injected tag were confirmed on the live gateway
  (`/assets/pcl-model-picker.v5.js?h=…` returns HTTP 200).

## [1.0.0] - 2026-09-09

### Added

- Two-column master-detail model picker for the OpenClaw Control UI chat input:
  provider navigation chips (left) + the selected provider's models only (right),
  each column an independent scroll container (structural CSS Grid — no scroll coupling).
- Hides the official per-chat account control (`.chat-model-account`, e.g. `deepseek:default`)
  inside the model menu — unrelated to provider/model picking.
- Official design tokens throughout (`--bg-hover`, `--accent` mix, `--border`,
  `--scrollbar-*`); dark/light/custom `data-theme` follows automatically.
- State-gated DOM writes (zero no-op writes) — no MutationObserver self-excitation.
- Idempotent installer `scripts/pcl-patch.ps1`: auto-detects the OpenClaw Control UI
  directory (npm root, common prefixes, CLI on PATH, `-Dist` override), backs up
  `index.html` on first run, replaces the injected tag in place across versions,
  and keeps the two newest `pcl-model-picker.v*.js` assets to avoid stale-HTML 404s.
- `-Remove` switch for a clean uninstall.

### Engineering notes

- Control UI's Service Worker is cache-first for `/assets/`: content changes must change the
  URL (versioned filename, and since 1.1.0 also a content fingerprint) or browsers keep
  serving the stale script.
- Verified with a local harness (mirror of the official DOM) via headless Edge:
  24 assertions green, including layout, independent scrolling, theme probes,
  search fallback and the hidden account control.

---

Pondsi (+MiMo-v2.5/v2.5pro+deepseek-v4-flash/pro+deepseek-v4.1-flash-expires-on-0910+GLM5.3-flash+Gemini3.1-pro+Qwen3.8-27b+Gemini3.8-flash) — automatically committed by OpenClaw
