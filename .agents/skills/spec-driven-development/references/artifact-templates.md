# Workflow Artifact Templates

## Product specification (`docs/features/<slug>/spec.md`)

```markdown
# <Feature> — Product Specification

Status: Draft | Ready | Implemented

## Summary
<Problem and intended user-visible outcome.>

## Personas
- **<Persona>:** <Relevant goals, needs, and context. Mark assumptions.>

## Scenarios
- <User goal and situation, in user language.>

## Scope
- Included: <Observable behavior>
- Excluded: <Related behavior intentionally deferred>

## Acceptance criteria
- **AC-1:** Given <context>, when <user action>, then <observable result>.

## Behavioral test cases
- **TC-1:** <Starting state and action> → <expected user-visible result>.
- Include success, validation/error, and boundary behavior relevant to the feature.

## Constraints, assumptions, and open questions
- <Record only items that affect behavior, scope, or acceptance.>
```

Keep this document product-focused: do not specify frameworks, storage models, code structure, endpoint design, or implementation steps.

## Implementation plan (`docs/features/<slug>/plan.md`)

```markdown
# <Feature> — Implementation Plan

## Task sequence
| ID | Outcome and acceptance criteria | Dependencies | Area/owner | Parallelizable | Completion evidence |
|---|---|---|---|---|---|
| T1 | <Outcome; AC-1> | — | <module/area> | Yes/No | <test or observable check> |

## Integration and validation
- <When independent work joins and which checks validate the feature.>
```

Keep tasks independently reviewable. Identify API/UI contracts before splitting work across modules. A task that edits a shared contract or foundational file should usually precede dependent parallel tasks.

## Architecture decision record (`docs/adr/NNNN-<slug>.md`)

```markdown
# ADR NNNN: <Decision title>

- Status: Proposed | Accepted | Superseded
- Date: YYYY-MM-DD

## Context
<Forces and constraints behind the decision.>

## Decision
<Chosen direction.>

## Alternatives considered
- <Alternative and why it was not selected.>

## Consequences
- Positive: <...>
- Tradeoffs: <...>
```
