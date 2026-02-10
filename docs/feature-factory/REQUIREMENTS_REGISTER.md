# Requirements Register

Use requirement IDs consistently:
- **FR-###** — Functional Requirements
- **NFR-###** — Non-Functional Requirements

Each new feature should append to this file (do not rewrite history).

## Template

### Feature: <name>

#### Functional Requirements
- FR-001: …
- FR-002: …

#### Non-Functional Requirements
- NFR-001 (Accessibility): …
- NFR-002 (Performance): …
- NFR-003 (Determinism/Testing): …

#### Acceptance Criteria
- AC-001: …

#### Out of Scope
- OOS-001: …

#### Notes
- …

---

### Feature: Architecture hardening (storage + deterministic testing)

#### Functional Requirements
- FR-090: (No new user-facing features.)

#### Non-Functional Requirements
- NFR-010 (Maintainability/Storage): Client persistence must be accessed via a typed, centralized API with schema versioning and forward migrations.
- NFR-011 (Determinism/Testing): E2E/visual tests must not rely on time-based sleeps (e.g. `waitForTimeout`) for correctness; readiness must be asserted via deterministic conditions.
- NFR-012 (Quality/Test Coverage): Critical client state logic must be unit-tested (storage parsing/migrations, selection/reset behavior, text fitting constraints).
- NFR-013 (Tooling/Portability): Repo-local Playwright dependency mode must be documented and include diagnostics/doctor checks.

#### Acceptance Criteria
- AC-090: Storage access is centralized (except minimal pre-paint logic), schema version exists, and migrations are covered by unit tests.
- AC-091: `apps/web/tests/e2e/**` contains no committed `waitForTimeout` used for correctness.
- AC-092: Unit tests cover extracted state/fit logic with meaningful assertions.
- AC-093: Documentation exists for Playwright supported modes (CI vs local-deps) and a doctor/diagnostics path is provided.

#### Out of Scope
- OOS-090: Backend sync/accounts.
- OOS-091: Major UI redesign.

#### Notes
- See: `docs/feature-factory/ARCHITECTURE_IMPROVEMENT_PLAN.md`.
