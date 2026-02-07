# Daily Compliment — implementation plan (Astro + Svelte)

This file is the canonical plan for building the **Daily Compliment** web app.

Goals (Phase 1)
- Public site, **no user accounts**.
- Homepage loads fast (mostly static HTML).
- Compliment can be **different per device**.
- Avoid repeats per device via client-side storage (prefer `localStorage`).
- Fully testable: unit tests + end-to-end + **visual regression**.
- Free-first deployment.

Non-goals (Phase 1)
- Runtime backend (API/database) unless required.
- Server-side user identity.

---

## Milestone 0 — Repo bootstrap + CI + GitHub Pages deploy

Deliverables
- Monorepo scaffold with pnpm workspaces.
- Astro app at `apps/web` with Svelte islands.
- Tooling wired:
  - Typecheck (`astro check`)
  - Lint (ESLint)
  - Unit tests (Vitest)
  - E2E tests (Playwright)
- GitHub Actions CI workflow that runs on PRs/pushes.
- GitHub Pages deployment workflow.

Notes on GitHub Pages
- **GitHub Pages is free for public repos**. For private repos, it typically requires a paid plan.
- If we want Pages to be fully free, we should make this repository **public**.
- We will set Astro `site`/`base` for **project pages** (URL: `https://<user>.github.io/daily-compliment/`).

Commit checkpoints
1) pnpm workspace skeleton + `apps/web` scaffolding
2) add CI workflow
3) add Pages deploy workflow + Astro base config

---

## Milestone 1 — Data + picker core (pure logic)

Deliverables
- Static dataset file: `apps/web/public/data/compliments.v1.json`.
- Validation script: `scripts/validate-data.ts` and CI step.
- Pure picker logic in `packages/core`:
  - deterministic given `(seed, date, dataset, seenIds)`
  - avoids repeats; resets when exhausted
- Unit tests for picker + dataset validation.

Commit checkpoints
- core package + tests
- dataset + validation script

---

## Milestone 2 — UI MVP + persistence

Deliverables
- `index.astro` renders fast with a small Svelte island for interactivity.
- Local persistence:
  - `dc:deviceSeed`
  - `dc:seenIds` (bounded)
  - `dc:lastShown` (optional for refresh stability)
- Basic interactions:
  - shows a compliment
  - “Next” button selects next unseen
  - optional “Reset history” for debugging
- Playwright E2E functional tests:
  - deterministic seed/date injection (query params or storage init)

Commit checkpoints
- UI island + storage
- E2E functional tests

---

## Milestone 3 — Visual regression + accessibility smoke tests

Deliverables
- Playwright screenshot baselines:
  - desktop and mobile
  - light/dark (optional)
- CI uploads Playwright reports/artifacts.
- Make visuals stable for diffs:
  - pinned fonts (local woff2)
  - disable animations in test mode
  - deterministic rendering (viewport/locale/timezone)
- Basic accessibility assertions (Playwright or axe).

Commit checkpoints
- visual tests + baselines
- a11y smoke checks

---

## Milestone 4 — AI compliment pipeline (optional)

Deliverables
- Local script to generate candidate AI compliments into JSON.
- GitHub Action (manual trigger or scheduled) that:
  - generates new items
  - opens a PR (human review)
- No runtime AI calls in production for Phase 1.

---

## Future (Phase 2+) — optional backend + Android path

When needed
- Edge/serverless API (Cloudflare Workers) or ASP.NET Core Minimal API.
- Storage (D1/Postgres) if we add accounts, favorites sync, analytics, moderation.
- Android:
  - PWA → Capacitor wrapper → Kotlin/Compose native, as needed.
