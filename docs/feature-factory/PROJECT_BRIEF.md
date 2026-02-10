# Project Brief — Daily Compliment

## Product
**Daily Compliment** is a static-first web app that shows one compliment at a time and lets you cycle to the next. The MVP is public and does **not** use user accounts; state is per-device.

**Live (GitHub Pages):** https://clauwie1337.github.io/daily-compliment/

## Users & Roles
- **Anonymous visitor (per-device experience)** — no login.

## Core Behaviors (current)
- Show a compliment.
- “Next” shows another compliment.
- Per-device history of “seen” compliments (to avoid repeats) using `localStorage`.
- Theme toggle: system / light / dark.
- Style (skin) toggle: Aurora (default), Bathroom wisdom, Azulejo.

## Non-Goals (for now)
- Accounts, syncing across devices, backend storage.

## Tech Stack
- **Astro + Svelte islands** (static-first; selective hydration).
- UI base: **Pico.css** + custom CSS.
- Testing:
  - Unit: Vitest
  - E2E + Visual: Playwright (Chromium)
- Deploy: **GitHub Pages** via GitHub Actions.

## Key Constraints
- **No sudo** on the host; Playwright OS dependencies must be handled repo-locally.
- Visual regression must be deterministic and CI-stable.

## Data & Storage
### Dataset
- `packages/core/data/compliments.en.json`

### localStorage keys
- Theme: `dc:theme` (`light` | `dark` | absence => system)
- Skin: `dc:skin` (`bathroom` default when absent/unknown; `default` = Aurora; `azulejo`)
- Device seed/history:
  - `dc:deviceSeed`
  - `dc:seenIds`
  - `dc:lastShown`

## UI Conventions
- Theme applied pre-paint via `data-theme` on `<html>`.
- Skin applied pre-paint via `data-skin` on `<html>`.

## Repo Layout (high-signal)
- Web app: `apps/web`
  - UI: `apps/web/src/components/*`
  - Layout prepaint logic: `apps/web/src/layouts/BaseLayout.astro`
  - Global styles/skins: `apps/web/src/styles/global.css`
  - Playwright E2E: `apps/web/tests/e2e/*`
- Core lib + data: `packages/core`

## Common Commands
- Install: `pnpm install`
- Validate dataset: `pnpm validate:data`
- Web app E2E (repo-local deps):
  - `pnpm -C apps/web test:e2e:local`
  - Update snapshots: `pnpm -C apps/web test:e2e:local:update`

## Release / Deployment
- Default branch: `main`
- Deploys from CI via GitHub Actions to GitHub Pages.
