# Jeeraan (Neighbors) – Project Workflow

## Guiding Principles
1. **The Plan is the Source of Truth:** All work must be tracked in `plan.md`.
2. **Test-Driven Development (TDD):** Write unit tests before implementing functionality.
3. **High Code Coverage:** Maintain a minimum of **90%** test code coverage for all new code.
4. **User Experience First:** Every decision should prioritize user experience and modern, "alive" aesthetics.
5. **Incremental Commits:** Commit changes **after each completed task**.
6. **Task Summaries:** Record detailed task summaries in the `./notes-and-resources/conductor` directory.

## Priority and Focus
1. **Admin Auth Flow:** Initially focus on implementing the Admin authentication flow as outlined in `./notes-and-resources/ai-progress-tracking/implementation-plan-admin-auth-revised.md`.
2. **Neighborhood Access:** Once Admin auth is complete, proceed with the tasks defined in `./notes-and-resources/ai-progress-tracking/tasks-neighborhood-access.md`.

## Standard Task Workflow
1. **Select Task:** Choose the next available task from `plan.md`.
2. **Mark In Progress:** Change task status from `[ ]` to `[~]`.
3. **Red Phase (TDD):** Write failing unit tests that define the expected behavior.
4. **Green Phase (TDD):** Implement the minimum code to make tests pass.
5. **Refactor:** Improve code quality while keeping tests passing.
6. **Verify Coverage:** Ensure the new code meets the **90%** coverage target.
7. **Commit:** Stage and commit changes with a clear message (e.g., `feat(auth): Implement admin login logic`).
8. **Summary:** Write a task summary to `./notes-and-resources/conductor/<task_id>.md`.
9. **Update Plan:** Mark the task as complete `[x]` and append the short commit SHA.

## Phase Completion Protocol
Immediately after completing a phase, execute the following:
1. **Automated Verification:** Run the full test suite and ensure 90% coverage.
2. **Manual Verification:** Follow a step-by-step plan to verify user-facing features.
3. **User Confirmation:** Obtain explicit user approval for the completed phase.
4. **Checkpoint Commit:** Create a checkpoint commit (e.g., `conductor(checkpoint): End of Phase X`).
5. **Meta-Task:** Mark the meta-task `- [ ] Task: Conductor - User Manual Verification '<Phase Name>' (Protocol in workflow.md)` as complete.

## Development Commands
- **Install Dependencies:** `npm install`
- **Start App:** `npx expo start`
- **Run Tests:** `npm test` (or configured test runner)
- **Lint:** `npm run lint`

## Definition of Done
- [x] Code implemented to specification.
- [x] Unit tests passing with **90%** coverage.
- [x] Documentation updated.
- [x] Manual verification successful.
- [x] Task summary recorded in `./notes-and-resources/conductor`.
- [x] Changes committed and plan updated.
