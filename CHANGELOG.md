# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] - 2026-09-09

### Added

- **Auto-repair watchdog (GitHub package only, `platform/pcl-watchdog.ps1`).**
  `npm i -g openclaw@<version>` replaces the whole `dist/control-ui/` directory, deleting
  both the injected tag and the enhancement asset — the picker silently reverts to the
  stock list. The watchdog compares the injected tag against the packaged script (filename
  **and** content fingerprint) and re-runs the installer only when something is missing or
  stale. Registered as the scheduled task `BigLobster-PclModelPickerRepair` (default every
  15 minutes) it heals an upgrade within minutes; the enhancement's own self-update watchdog
  then reloads the open tab, so no manual step is needed.
  - `-Check` (exit `0` healthy / `10` needs repair), `-Repair`, `-Install`, `-Uninstall`,
    `-Status`; log at `%USERPROFILE%\.openclaw\logs\pcl-model-picker-watchdog.log`.
  - Read-only when healthy: it writes nothing unless the injection is actually missing.
  - Not part of the ClawHub artifact; the repository README documents the boundary.

### Verified

- Watchdog exercised end-to-end: healthy `-Check` (exit 0) → simulated upgrade wipe
  (tag and asset removed) → `-Check` exit 10 → `-Repair` restored the injection → `-Check`
  exit 0 → `-Install` registered the task (next run confirmed by `schtasks`).
- Compatibility re-checked against OpenClaw **2026.9.3**, which now renders the picker as a
  controlled `<details>` (`?open=` driven by component state; the trigger carries
  `--disabled`/`aria-disabled` until the session is ready). The enhancement does not depend
  on click events: with the menu open the probe reports `state: "two-col"`, `railFound: true`
  and 10 provider chips.

## [1.2.0] - 2026-09-09

### Added

- **Self-update watchdog.** An already-open Control UI tab keeps running the script it
  loaded, so a freshly patched server looked "unpatched" until the user reloaded by hand
  (symptom: click the picker → still the old layout; refresh → new layout). The enhancement
  now fetches the app shell (`./`, a network-first path the Service Worker never caches)
  30s after load and then every 5 minutes, parses the injected tag's version and content
  fingerprint, and reloads the page automatically when the server is newer.
  - Never downgrades: an older served build is ignored.
  - Loop-safe: the attempted build is recorded in `sessionStorage`.
  - Non-disruptive: waits while an input/textarea is focused (retries in 60s); background
    tabs reload immediately.
  - Manual check: `await window.pclModelPickerCheckUpdate()`.

### Changed

- Enhancement file is now `pcl-model-picker.v6.js`; `window.pclModelPickerDiag()` also
  reports `selfFp` (the content fingerprint the running script was loaded with).

### Verified

- End-to-end in a real authenticated Control UI: with the page open on v6, deploying v7
  server-side caused an automatic reload within ~25s and the picker came up as v7 with the
  two-column layout intact; reverting the server to v6 did **not** downgrade the page.

## [1.1.1] - 2026-09-09

### Changed

- Updated the attribution signature to `Pondsi (+MiMo-v2.5 +deepseek-v4.1-flash-expires-on-0910 +GLM5.3-flash) — automatically committed by OpenClaw` across `README.md`, `SKILL.md`, `说明.md`, `SPONSORS.md` and this changelog.

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

Pondsi (+MiMo-v2.5 +deepseek-v4.1-flash-expires-on-0910 +GLM5.3-flash) — automatically committed by OpenClaw
