# Test Matrix

Map FR/NFR → tests (T-###) and acceptance checks.

## Conventions
- **T-###** identifiers are required for traceability.
- Prefer:
  - Unit tests for pure logic
  - E2E tests for critical user flows
  - Visual E2E only for deterministic, stable UI surfaces (prefer element-level screenshots)

## Template

### Feature: <name>

- FR-001 → T-001 (e2e): …
- FR-002 → T-002 (unit): …
- NFR-001 → T-003 (a11y): …
- NFR-003 → T-004 (visual): …

### Feature: Architecture hardening (storage + deterministic testing)

- NFR-010 → T-101 (unit): Storage schema versioning + migrations (legacy/corrupt values) via a `MemoryStorage` adapter.
- NFR-010 → T-102 (unit): Compliment selection state machine tests (first run, daily, forced params, reset).
- NFR-011 → T-201 (e2e): Replace `waitForTimeout` with deterministic wait (explicit marker or stable-layout poll) for circle-fit skins.
- NFR-011 → T-202 (visual): Visual snapshots taken only after deterministic fit completion.
- NFR-012 → T-103 (unit): Circle-fit constraint computation and “reset then shrink” behavior.
- NFR-013 → T-301 (tooling): Playwright local-deps doctor/diagnostics validates libs/fonts and prints remediation.

### Execution Notes
- Commands to run:
  - `pnpm -C apps/web test:unit`
  - `pnpm -C apps/web test:e2e` (CI mode)
  - `pnpm -C apps/web test:e2e:local` (local-deps mode)
