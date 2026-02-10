# Multi-Agent Feature Factory (Project Workflow)

This folder contains the shared artifacts for a repeatable feature delivery workflow:

1) **Project Brief** → `PROJECT_BRIEF.md`
2) **Working Memory** → `WORKING_MEMORY.md`
3) **Requirements Register** → `REQUIREMENTS_REGISTER.md`
4) **Test Matrix** → `TEST_MATRIX.md`
5) **Change Log** → `CHANGE_LOG.md`

## Strict Order (per feature)
0) Initialize / refresh context
1) Functional Analysis (FR/NFR + acceptance criteria)
2) Design Spec (UI flows, states, a11y)
3) Technical Spec (plan + T-###)
4) Implementation (traceable commits)
5) Verification (independent tester decides ACCEPT/REJECT)

## Output Format Rules (all roles)
- **Summary**
- **Inputs Used**
- **Outputs**
- **Open Questions / Assumptions / Risks**

## Traceability
- Requirements: **FR-### / NFR-###**
- Tests: **T-###**

## Notes
- The tester owns Definition of Done.
- Keep ambiguity explicit: log assumptions and confirm them later.
