# 🤖 Agent Instructions — Jeeraan InsForge

> **⚠️ READ THIS FIRST**
> This is a living document. Every AI model or coding agent **must read this file before planning or implementing any feature** for this project. It will be expanded continuously as the project evolves. Do not skip it — following these instructions ensures consistency, quality, and alignment with the project vision.

---

## 1. Understand the Project Context

- **Always begin** by reviewing [`notes-and-resources/PRD.md`](./notes-and-resources/PRD.md) to understand the product requirements and intended functionality before proposing or implementing any solution.
- Screen designs for new functionality live in [`notes-and-resources/stitch-html-screens/`](./notes-and-resources/stitch-html-screens/). Corresponding screen descriptions are in [`notes-and-resources/stitch-screens-description.md`](./notes-and-resources/stitch-screens-description.md).
- Acceptance criteria for user-facing features are defined in [`notes-and-resources/user-stories.md`](./notes-and-resources/user-stories.md). Use this to validate your implementation once complete.

---

## 2. Respect Established UI Conventions

- Some screens may display different navigation bar styles — **do not alter the navigation structure** that was established in a prior step (originally adapted from `home.html`).
- When in doubt about any UI element, refer to existing implemented screens before introducing something new.

---

## 3. Backend & Infrastructure

- Use the **InsForge MCP server** to connect to the project backend and configure AI coding assistance.
- **Always verify the connection** to the InsForge MCP server before performing any backend operations (database queries, authentication, file uploads, edge functions, etc.).
- Refer to the InsForge skill files in `.agents/skills/` for SDK and CLI usage guidelines.
- **Executing the CLI**: The most reliable way for automated agents to execute the InsForge CLI in this environment without PATH or alias issues is to use `npx`. ALWAYS use `npx --yes @insforge/cli [command]` rather than just calling `insforge` directly inside the terminal.

---

## 4. Progress Tracking (Required for Every Work Segment)

Every distinct segment of work **must** be documented in the following folder:

📁 **[`notes-and-resources/ai-progress-tracking/`](./notes-and-resources/ai-progress-tracking/)**

For each feature or work segment, maintain and keep up-to-date the following three documents:

| Document | Filename Convention | Purpose |
|---|---|---|
| **Implementation Plan** | `implementation-plan-[feature-name].md` | Technical approach, design decisions, proposed file changes, and verification plan — to be reviewed and approved before coding begins |
| **Tasks** | `tasks-[feature-name].md` | Granular checklist of sub-tasks, updated in real time as work progresses (`[ ]`, `[/]`, `[x]`) |
| **Walkthrough** | `walkthrough-[feature-name].md` | Post-implementation summary of what was built, what was tested, and proof of correctness (screenshots, recordings, test output) |

> These documents allow the user to track progress, review decisions, and verify alignment with the project vision at any point during development.

---

## 5. General Principles

- **Plan before you code.** Always produce an implementation plan and get acknowledgement before making significant changes.
- **Ask, don't assume.** If requirements are ambiguous, ask for clarification rather than making silent assumptions.
- **Stay in scope.** Do not refactor or modify areas of the codebase unrelated to the current task without explicit approval.
- **Incremental delivery.** Break work into small, reviewable segments rather than large, monolithic changes.
- **This document will grow.** As new conventions or constraints are established, they will be added here. Always re-read this file at the start of each new conversation or task.

---

*Last updated: 2026-03-12*
