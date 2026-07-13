<!--
This document defines how Codex should move investModel Google Sheet rows between Backlog, In Progress, Done, Issues, and Runs.
AI workers must use it before updating the project checklist, especially when duplicate or stale rows exist.
-->

# Sheet State Movement And Deduplication Rules

## Purpose

The project Google Sheet is the operating ledger for investModel development. This document keeps automated runs from creating duplicate tasks, reviving stale rows, or losing completion context.

Use this together with `docs/automation/codex-recurring-workflow-prompt.md`.

## Canonical Tabs

| Tab | Role | Write rule |
| --- | --- | --- |
| `Backlog` | Source queue for not-started or active task rows | update task status in place; do not delete historical rows |
| `In Progress` | Optional active-work mirror | use only when a task genuinely spans runs |
| `Done` | Completion ledger | append a completed task summary once per real completed task id |
| `Issues` | Blockers, risks, defects, unresolved review needs | add or update rows; never hide unresolved issues |
| `Decisions` | Durable product/technical choices | append only when a decision should guide future work |
| `Runs` | Every Codex execution record | append one row per heartbeat/manual execution |
| `Harness` | Harness registry and review state | update only when harness content or review date changes |

## Row Identity

`id` is the stable task identity. A task may appear in both `Backlog` and `Done` after completion because Backlog is the planning source and Done is the completion ledger.

Rows are considered the same task when:

- the `id` is identical, or
- the title and detail describe the same work and one row references the other's id in notes, or
- a newer row explicitly supersedes an older row.

When duplicate task ids exist, prefer the row with:

1. a non-empty `commit_hash`
2. a non-empty `completed_at`
3. the most recent `started_at` or `created_at`
4. fuller notes and acceptance criteria

Do not start a `todo` row if another row with the same id is already `done`.

## Status Semantics

| Status | Meaning | Allowed next status |
| --- | --- | --- |
| `todo` | Ready or waiting work not yet started | `in_progress`, `blocked`, `review`, `done` |
| `in_progress` | Selected for the current or ongoing run | `done`, `blocked`, `review`, `todo` only if no work was changed |
| `blocked` | Cannot proceed without user confirmation, secret, external account, legal/financial review, or environment change | `in_progress`, `review`, `done` after blocker resolved |
| `review` | Work is implemented or drafted but requires human, legal, design, or security review | `in_progress`, `blocked`, `done` |
| `done` | Acceptance criteria are met and the sheet has notes/verification/commit when applicable | no further status change unless a correction task is created |

Completed rows should not be reopened for new scope. Add a new Backlog item for follow-up work.

## Start-Of-Run Movement

Before starting implementation:

1. Read `Backlog`, `In Progress`, `Issues`, `Harness`, and recent `Runs`.
2. Search for the selected id in `Backlog`, `In Progress`, and `Done`.
3. If the id is already done, skip that row and choose the next dependency-ready task.
4. If the task is safe and selected, set its Backlog status to `in_progress` and fill `started_at` when blank.
5. If a task must continue across runs, optionally add or update the matching `In Progress` row.
6. If a blank or partially updated row was accidentally touched, clear only the cells touched by the current run.

Do not mark multiple Backlog tasks as `in_progress` in one run.

## Completion Movement

When a task completes:

1. Update the selected Backlog row:
   - `status=done`
   - Korean summary in `notes`
   - `commit_hash` when a commit exists
   - `completed_at`
2. Append a single row to `Done` if no Done row with the same id and commit hash exists.
3. Add a `Runs` row with trigger, selected task id, agents, summary, verification, commit hash, and next action.
4. Leave unrelated Issues open.
5. Resolve only the Issues that were actually fixed in the run.

If code or docs changed but the commit failed, do not mark the task `done`. Mark it `blocked` or `review` and record the failure in `Runs`.

## Duplicate Detection Checklist

Before adding a new Backlog item, search these fields:

| Field | Match type |
| --- | --- |
| `id` | exact |
| `title` | exact or close Korean wording |
| `detail` | close semantic match |
| `notes` | references to related or superseded work |
| `commit_hash` | same completed artifact |
| `issue_ids` | linked blocker or stale duplicate |

If similar work exists:

- update the existing row when the request is the same work
- add a smaller follow-up row when the request extends completed work
- add an Issue when the request is blocked by secrets, legal/financial review, or external accounts
- add a Decision when the request changes product or technical direction

## Stale Row Handling

Stale rows are rows that are blank, duplicated, partially updated, superseded, or contradicted by a newer completed row.

| Stale pattern | Action |
| --- | --- |
| blank row accidentally has `in_progress` or date only | clear the touched cells |
| duplicate id is `todo` but same id is done elsewhere | leave it untouched and record in Runs if it affects task selection |
| duplicate id has conflicting notes | prefer the completed row with commit hash; add a cleanup task if confusion persists |
| old mobile/setup row is superseded by a completed row | do not run it again; choose the next task |
| stale row blocks automation selection | create a small Backlog cleanup task instead of editing many rows in a feature run |

Large sheet cleanup is its own task. Do not reorganize the whole sheet during an unrelated implementation run.

## Issue Link Rules

Use `issue_ids` when:

- a task cannot finish because of an open Issue
- a completed task resolves an Issue
- an Issue explains why a task remains `blocked` or `review`

Do not link `IS-001` to unrelated work unless production build, Stripe, or Docker setup is directly involved.

## Runs Row Rules

Every run should write exactly one `Runs` row.

| Field | Rule |
| --- | --- |
| `run_id` | monotonically increasing per day, e.g. `RUN-20260713-046` |
| `trigger` | `heartbeat`, `manual`, or `user_request` |
| `selected_task_id` | selected Backlog id, Issue id, or `none` |
| `agents_used` | semicolon-separated roles |
| `summary` | one concise Korean sentence |
| `verification` | command/result summary or reason verification was not run |
| `commit_hash` | blank only when no file changed |
| `next_action` | next likely checklist item or user-needed blocker |

If the sheet write partially fails, retry once with the smallest missing update and note the partial failure in `Runs`.

## Safety Rules

Never use sheet movement to imply that a restricted feature is approved. Tasks involving real deposits, real orders, account linking, secrets, model execution, or legal judgment must be `blocked` or `review` until explicitly cleared.

For heartbeat runs, prefer quiet completion with `DONT_NOTIFY` unless user action is needed.

## Follow-Up Links

- `BK-149`: define verification, commit, and push criteria by work type.
- `BK-150`: dry-run the sheet movement rules before relying on long unattended automation.
