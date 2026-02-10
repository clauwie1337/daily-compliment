# Architecture Improvement Plan — Daily Compliment

Date: 2026-02-10

This document proposes a small set of architecture and test-harness improvements addressing known pain points, without changing product scope.

## 1) Goals

1. **Centralize client persistence** so the app has a single, typed storage API with:
   - consistent key naming
   - schema versioning
   - forward migrations
   - safe defaults and validation
2. **Remove time-based sleeps from Playwright** for text-fitting and other async UI behavior; replace with deterministic waits.
3. **Increase meaningful unit test coverage** by testing the non-UI state/logic that currently lives inside Svelte components.
4. **Harden and document the repo-local Playwright dependency strategy** with explicit supported modes, diagnostics, and guardrails.

## 2) Non-goals

- No backend / accounts / cross-device sync.
- No change to visible UX or to the compliment dataset.
- No broad refactor of UI components beyond extracting testable logic modules.
- No new visual snapshot baselines unless necessary to keep the suite deterministic.

## 3) Current-state overview (high-signal)

### 3.1 localStorage usage is scattered

Persistence is currently performed directly in multiple places:

- `apps/web/src/layouts/BaseLayout.astro` (pre-paint theme + skin application)
- `apps/web/src/components/ThemeToggle.svelte` (read/write `dc:theme`)
- `apps/web/src/components/SkinToggle.svelte` (read/write `dc:skin`)
- `apps/web/src/components/ComplimentIsland.svelte` (read/write `dc:deviceSeed`, `dc:seenIds`, `dc:lastShown`)

Pain:
- no shared parsing/validation
- no schema version (hard to evolve state)
- no migrations (future key changes risk breaking existing users)
- hard to unit test (logic is embedded in component files and uses global `localStorage`)

### 3.2 Playwright E2E/visual uses `waitForTimeout(50)`

Files include:
- `apps/web/tests/e2e/skin-toggle.spec.ts`
- `apps/web/tests/e2e/bathroom-fit.spec.ts`
- `apps/web/tests/e2e/bathroom.visual.spec.ts`
- `apps/web/tests/e2e/bathroom.dark.visual.spec.ts`

The sleeps exist to “allow rAF fitting to run” (circle-fit algorithm in `ComplimentIsland.svelte`).

Pain:
- flaky on slower CI
- slows tests unnecessarily
- hides real readiness conditions

### 3.3 Web unit tests are a smoke test

- `apps/web/tests/unit/smoke.test.ts` only asserts `1 + 1 = 2`.

Pain:
- core logic (storage parsing, daily selection inputs, reset behavior, text-fitting constraints) is not unit-tested
- regressions tend to show up late (E2E) and are harder to debug

### 3.4 Repo-local Playwright deps approach is clever but brittle

- `apps/web/scripts/install-playwright-deps-local.mjs` downloads and extracts `.deb` packages into `.cache/playwright-deps/` and writes `.cache/playwright-deps.env`.
- `apps/web/playwright.config.ts` reads `.cache/playwright-deps.env` when `PW_LOCAL_DEPS=1`.

Pain:
- “supported modes” are not explicitly documented
- failure modes are non-obvious (missing `apt-get download`, missing `ldd`, wrong distro key, fonts mismatch)
- no “doctor” command to validate the environment

## 4) Proposed solutions

### 4.1 Introduce a single storage abstraction + schema versioning

Create a small storage package used by the web app.

**New module(s) (proposed paths):**

- `packages/core/src/storage/`
  - `schema.ts` — schema version constant(s), key registry, types
  - `migrations.ts` — migration steps `(fromVersion) -> (toVersion)`
  - `codec.ts` — safe JSON parse/serialize helpers + runtime validation
  - `index.ts` — exported API

Optionally keep web-only behavior in the web app:

- `apps/web/src/lib/storage/`
  - `adapter.ts` — `StorageLike` interface + browser adapter
  - `clientStore.ts` — thin wrapper for browser use (uses `window.localStorage`)

**Key ideas:**

- Maintain a single schema version key, e.g. `dc:schemaVersion`.
- Centralize known keys and defaults, e.g.:
  - `dc:theme` (default: system)
  - `dc:skin` (default: bathroom)
  - `dc:deviceSeed` (generated)
  - `dc:seenIds` (default: [])
  - `dc:lastShown` (default: null)
- Provide safe parsing and validation; treat corrupt values as missing.
- Implement migrations (even if initially no-op) to establish the pattern.

**Concrete migration examples (illustrative):**

- v0 → v1: introduce `dc:schemaVersion = 1` and normalize `dc:seenIds` to a capped array of strings.
- v1 → v2 (future): if keys ever change (e.g. rename `dc:skin` values), convert old values.

**Integration points (planned edits later, not in this doc-only task):**

- `BaseLayout.astro` should call a minimal, inline “read theme/skin” helper (or generate a tiny inline script from the shared key registry) so pre-paint behavior stays intact.
- Svelte components should use the storage API rather than direct `localStorage`.

### 4.2 Replace `waitForTimeout` with deterministic readiness signals

The failing/flaky area is “text fitting completes after rAF”. Replace time-based waiting with one of these deterministic approaches.

#### Option A (recommended): explicit fit completion marker

Add an explicit marker that tests can wait for.

**Implementation concept:**

- In `apps/web/src/lib/circleFit.ts` (extracted from `ComplimentIsland.svelte` later), after fitting completes, update:
  - `document.documentElement.dataset.dcFit = String(fitSeq)` (or)
  - `quoteEl.dataset.fitDone = '1'` (or)
  - dispatch a custom event: `window.dispatchEvent(new CustomEvent('dc:fit:done', { detail: { seq } }))`

**Playwright wait condition:**

- Replace `await page.waitForTimeout(50)` with one of:
  - `await page.waitForFunction(() => document.querySelector('[data-testid="compliment"]')?.getAttribute('data-fit-done') === '1')`
  - or waiting for an incrementing seq value: `data-dc-fit-seq`.

Pros: fastest, most deterministic.

#### Option B: poll for layout stability (no app code change, less ideal)

If app-code markers are not desired, use polling:

- Wait until the measured font-size and bounding box of `[data-testid="compliment"]` are stable for N animation frames.

**Playwright pseudo-implementation:**

- `await expect.poll(async () => page.evaluate(() => {
    const el = document.querySelector('[data-testid="compliment"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const fs = getComputedStyle(el).fontSize;
    return `${fs}:${Math.round(r.width)}:${Math.round(r.height)}`;
  })).toBeStable();`

(You can implement a small shared helper in `apps/web/tests/e2e/helpers/waitForStableLayout.ts`.)

Pros: does not require app instrumentation; Cons: more complex, still slower than explicit marker.

### 4.3 Extract unit-testable logic from Svelte components

Target the parts that are currently complex and regression-prone:

1. **Storage parsing/defaulting/migrations** (see §4.1)
2. **Compliment selection + history behavior** currently in `ComplimentIsland.svelte`:
   - first-run random selection
   - deterministic mode via query params (`dc_id`, `dc_day`, `dc_seed`)
   - seenIds cap / reset semantics
   - lastShown semantics (per-day)
3. **Circle-fit algorithm** (diagonal-in-circle constraint + reset behavior)

**Proposed extraction (later):**

- `apps/web/src/lib/complimentState.ts`
  - pure functions: `loadState(storage)`, `pickInitial(state, inputs)`, `pickNext(state, rng)` etc.
- `apps/web/src/lib/circleFit.ts`
  - pure helper(s): `computeNextFontSize(...)`, `fitsCircle(rect, circle)`
  - small DOM wrapper to apply style + emit “fit done” marker

**Unit test strategy:**

- Use Vitest for pure functions.
- Introduce a `StorageLike` adapter and a `MemoryStorage` implementation for tests.
- For any DOM-dependent functions, use a lightweight DOM environment (e.g. Vitest `happy-dom` or `jsdom`) *only* for the circle-fit wrapper; keep most logic pure.

**New unit tests (proposed paths):**

- `apps/web/tests/unit/storage.migrations.test.ts`
- `apps/web/tests/unit/complimentState.test.ts`
- `apps/web/tests/unit/circleFit.test.ts`

### 4.4 Harden repo-local Playwright dependency mode

The current approach is valuable (no sudo environment), but should be treated as a first-class “mode” with documentation and diagnostics.

**Supported modes (to document):**

1. **CI mode (recommended for GitHub Actions)**
   - Use Playwright-managed browser + deps:
     - `pnpm -C apps/web test:e2e`
     - CI step runs `playwright install --with-deps chromium`
2. **Local-deps mode (no sudo)**
   - `pnpm -C apps/web test:e2e:local`
   - requires:
     - `pnpm exec playwright install chromium` (to obtain `chrome-headless-shell`)
     - `apt-get` available for `apt-get download` (no sudo required)
     - `dpkg-deb` and `ldd` available

**Hardening steps (doc + small future scripts):**

- Add a “doctor” script (planned): `apps/web/scripts/pw-deps-doctor.mjs`
  - checks:
    - `.cache/playwright-deps.env` exists when `PW_LOCAL_DEPS=1`
    - `chrome-headless-shell` path detection works
    - `ldd` shows no missing libs under computed `LD_LIBRARY_PATH`
    - fonts are available (fontconfig file points to extracted fonts)
  - prints actionable remediation.
- Add docs describing cache directories:
  - `.cache/apt/`
  - `.cache/playwright-deps/`
  - `.cache/fontcache/`
- Add guardrails in `playwright.config.ts` (planned):
  - if `PW_LOCAL_DEPS=1` but env file is missing, throw a clear error suggesting `pnpm pw:deps:local`.

## 5) Phased plan

### Phase 0 — Documentation + test harness preparation (low risk)

1. Add this plan (done by this task).
2. Update the Requirements Register + Test Matrix with NFRs and T-IDs (optional, but recommended).
3. Define the deterministic wait strategy to replace `waitForTimeout` (choose Option A or B).
4. Document Playwright supported modes and prerequisites (can be a new doc or extend existing Feature Factory docs).

### Phase 1 — Storage centralization + deterministic E2E (medium risk)

(Implementation to be done in a follow-up PR.)

1. Create `packages/core/src/storage/*` (or `apps/web/src/lib/storage/*` if preferred) with:
   - key registry + types
   - safe codecs
   - schema version + migrations
2. Update `BaseLayout.astro` pre-paint script to use the centralized key registry (keep the script inline and minimal).
3. Update Svelte components to use the new API.
4. Replace Playwright `waitForTimeout(50)` with deterministic waits:
   - Option A: wait for `data-fit-done`/`data-dc-fit-seq`
   - Option B: wait for stable bounding box/font size (helper function)

### Phase 2 — Unit test depth + Playwright local-deps hardening (medium/high value)

1. Extract testable logic from Svelte:
   - `complimentState.ts`
   - `circleFit.ts`
2. Add unit tests for:
   - migrations + corrupt storage handling
   - deterministic mode inputs
   - seenIds cap/reset behavior
   - circle-fit “reset then shrink” behavior (the current E2E `bathroom-fit.spec.ts` should become largely unit-tested)
3. Add Playwright local-deps “doctor” + documentation of supported modes.

## 6) Acceptance criteria

### Storage

- AC-S1: All reads/writes of `dc:*` keys in `apps/web/src/**` go through a single storage API (except the minimal pre-paint script, which must use the same key registry).
- AC-S2: A schema version key exists (e.g. `dc:schemaVersion`) and migrations run safely (corrupt/unknown values do not crash).
- AC-S3: State is validated and defaults are applied consistently across SSR/CSR.

### Playwright stability

- AC-P1: No `waitForTimeout` is used to achieve correctness in E2E/visual tests (allow only for debugging, not committed tests).
- AC-P2: Visual snapshots for bathroom/azulejo reliably pass on CI with deterministic waits.

### Unit tests

- AC-U1: `apps/web/tests/unit/` contains meaningful unit tests for storage + state logic (not only smoke).
- AC-U2: Circle-fit behavior is covered by unit tests and E2E only verifies integration.

### Repo-local Playwright deps

- AC-D1: Docs exist describing supported Playwright modes and prerequisites.
- AC-D2: A “doctor”/diagnostics command exists (or equivalent documented manual checks).

## 7) Risks & mitigations

- **Risk:** Pre-paint theme/skin script grows and becomes less reliable.
  - **Mitigation:** keep pre-paint logic minimal; only read the necessary keys; avoid importing large modules; generate inline constants.
- **Risk:** Storage migrations introduce subtle behavior changes.
  - **Mitigation:** migrate conservatively; add unit tests for “before/after” localStorage fixtures; treat unknown values as defaults.
- **Risk:** Explicit “fit done” marker becomes coupled to UI.
  - **Mitigation:** keep marker generic and versioned (e.g. `data-dc-fit-seq`); document it as a test-only contract.
- **Risk:** Local-deps mode fails on different Linux distros.
  - **Mitigation:** document supported distros; in doctor script print detected `VERSION_ID` and chosen `platformKey`; provide override via env var (planned).

## 8) Traceability placeholders (FR/NFR ↔ T-###)

> Note: This plan mostly introduces NFRs (maintainability/test determinism). If you prefer, these can be tracked as “Engineering Requirements”.

### Proposed requirements (placeholders)

- NFR-010 (Maintainability/Storage): Client persistence must be accessed via a typed, centralized API with schema versioning and migrations.
- NFR-011 (Deterministic Testing): E2E/visual tests must not rely on time-based sleeps for correctness; readiness must be asserted via deterministic conditions.
- NFR-012 (Test Coverage): Critical client state logic must be unit-tested (storage parsing/migrations, selection/reset, fitting).
- NFR-013 (Tooling/Portability): Repo-local Playwright dependency mode must be documented and include diagnostics.

### Proposed tests (placeholders)

- T-101 (unit): storage schema/migrations handle corrupt and legacy values
- T-102 (unit): compliment state selection semantics (first run, daily, forced id/seed, reset)
- T-103 (unit): circle-fit computation + reset behavior
- T-201 (e2e): bathroom/azulejo fit readiness uses deterministic wait (no `waitForTimeout`)
- T-202 (visual): bathroom/azulejo visual snapshots after deterministic fit completion
- T-301 (tooling): pw local-deps doctor validates no missing libs/fonts
