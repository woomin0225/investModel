# Issue Recheck Procedure

<!--
This procedure defines how automation runs re-check open and resolved Issues before selecting the next investModel task.
It prevents external blockers from being retried as if Codex could solve them locally.
-->

## Scope

- Task: `BK-077`
- Applies to: each recurring Codex automation run
- Source tab: `Issues`
- Related tabs: `Backlog`, `In Progress`, `Runs`

## Recheck Order

At the start of each run:

1. Read `Issues` after `Backlog` and `In Progress`.
2. Review rows with `status=open`, `blocked`, or `monitoring`.
3. Prefer issues that affect `P0` or `P1` work.
4. Skip issues whose resolution requires user confirmation, external secrets, real accounts, real orders, legal judgment, paid API keys, or physical device access.
5. Record the skip reason in the run verification summary.
6. Select the next dependency-ready Backlog item only after the unresolved issue check is complete.

## Status Meanings

- `open`: still relevant and should be rechecked each run.
- `blocked`: cannot move without user input or external state change.
- `monitoring`: temporarily acceptable but should be watched for recurrence.
- `resolved`: do not re-open unless a new failure is observed.
- `deferred`: intentionally postponed; do not select automatically.

## External Blockers

External blockers must remain open or blocked until the required outside action is complete.

Current examples:

- `IS-001`: real Stripe test key and local Docker/Postgres availability are outside automation scope.
- `IS-003`: actual phone-device verification must be performed on the user's device.

Do not create code changes only to silence these issues. If the run cannot resolve the issue locally, continue to the next safe task and mention the open issue in `Runs.verification`.

## Resolved Issue Guard

Resolved issues should not be repeatedly selected. Before creating a new issue for a similar symptom:

1. Search existing resolved issues by title and area.
2. If the same symptom has returned, create a new issue and reference the old issue ID in the detail.
3. If it is merely historical context, keep the resolved issue closed.

## Completion Rules

When an issue is fixed during a run:

- Set `status=resolved`.
- Fill `resolved_at`.
- Add concise Korean `resolution_notes`.
- Link the fixing task in `related_task_id` when possible.
- Include the issue ID in the task `issue_ids` field and the `Runs.verification` summary.

When an issue remains open:

- Do not modify `resolved_at`.
- Do not mark related work done unless the acceptance criteria does not require the issue to be closed.
- Note the unresolved issue in the next action if it still affects priority.
