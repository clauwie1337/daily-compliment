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

### Execution Notes
- Commands to run:
  - `pnpm test:unit`
  - `pnpm -C apps/web test:e2e:local`
