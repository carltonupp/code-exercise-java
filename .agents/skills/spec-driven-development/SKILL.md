---
name: spec-driven-development
description: Take a full-stack product idea from discovery through a user-centered specification, implementation plan, architectural decisions, and review-ready code in small tasks. Use when asked to run a spec-driven development workflow; not for isolated bug fixes or routine code changes.
---

# Full-Stack Spec-Driven Development

Use this workflow when the request spans product discovery through code delivery. Read repository instructions and inspect relevant code, tests, and existing decisions first. Ask only focused questions whose answers materially affect users, scope, or acceptance; otherwise record assumptions and proceed.

## 1. Refine and Specify

Clarify the problem, desired outcomes, audiences, and constraints. Write a product spec at `docs/features/<slug>/spec.md` using the outline in [artifact templates](references/artifact-templates.md). Include evidence-based or explicitly assumed personas, user scenarios, scope and exclusions, observable acceptance criteria, and behavioral test cases. Keep implementation choices, architecture, classes, endpoints, and file names out of the product spec.

## 2. Plan and Record Decisions

Write `docs/features/<slug>/plan.md`. Break work into small outcome-based tasks tied to acceptance criteria. For each task, state dependencies, likely ownership area, and how completion will be checked. Mark tasks parallelizable only when their interfaces are clear and they can proceed without editing shared files; sequence dependent work and reserve integration tasks. Use subagents for independent tasks when available. Create an ADR under `docs/adr/` for a consequential decision with meaningful alternatives or lasting tradeoffs; skip routine choices. Use the templates in the reference.

## 3. Implement, Review, and Commit in Subtasks

Implement the agreed scope as the small tasks in the plan, keeping behavior traceable to acceptance criteria and test cases. After each task, run its relevant tests, lint, and build checks; report failures accurately and update the spec, plan, or ADR if accepted behavior or a decision changes. Then stop and present a review handoff for that task: behavior delivered, changed files, acceptance criteria covered, validation results, and unresolved risks. Wait for the user's review and explicit approval before committing that task with a Conventional Commit message and repository hooks. Continue to the next task only after that checkpoint. If review requests changes, revise and revalidate the task, then present it for review again. At the end, summarize the completed task commits and any remaining work; do not create an extra implementation commit that combines already-reviewed tasks.
