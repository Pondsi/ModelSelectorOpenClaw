# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-09-09

### Added

- Two-column master-detail model picker for the OpenClaw Control UI chat input:
  provider navigation chips (left) + the selected provider's models only (right),
  each column an independent scroll container (structural CSS Grid — no scroll coupling).
- Hides the official per-chat account control (`.chat-model-account`, e.g. `deepseek:default`)
  inside the model menu — unrelated to provider/model picking.
- Official design tokens throughout (`--bg-hover`, `--accent` mix, `--border`,
  `--scrollbar-*`); dark/light/custom `data-theme` follows automatically.
- Automatic fallback to the native flat list when search filtering is active or the
  viewport is narrower than 520px.
- State-gated DOM writes (zero no-op writes) — no MutationObserver self-excitation.
- Idempotent installer `scripts/pcl-patch.ps1`: auto-detects the OpenClaw Control UI
  directory (npm root, common prefixes, CLI on PATH, `-Dist` override), backs up
  `index.html` on first run, replaces the injected tag in place across versions,
  and keeps the two newest `pcl-model-picker.v*.js` assets to avoid stale-HTML 404s.
- `-Remove` switch for a clean uninstall.

### Engineering notes

- Control UI's Service Worker is cache-first for `/assets/`: any content change must bump
  the versioned filename (v4 → v5 …) or browsers keep serving the stale script.
- Verified with a local harness (mirror of the official DOM) via headless Edge:
  24 assertions green, including layout, independent scrolling, theme probes,
  search fallback and the hidden account control.
