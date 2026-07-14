# Done State Move Procedure

<!--
This procedure keeps Google Sheets task completion records consistent across Backlog, Done, and Runs.
It is an operating procedure for Codex automation runs, not a separate production service.
-->

## Scope

- Task: `BK-076`
- Applies to: completed `Backlog` or `In Progress` work items
- Target tabs: `Backlog`, `In Progress`, `Done`, `Runs`
- Source schema: `docs/automation/google-sheets-field-contract.md`

## Required Completion Fields

Before marking a task done, collect these values:

- `id`
- `status=done`
- `notes` in Korean
- `commit_hash`, when code or docs changed
- `started_at`
- `completed_at`
- verification summary for the `Runs` row
- unresolved issue IDs that remain open

If code or docs changed and there is no commit hash yet, commit and push first, then write the sheet update.

## Move Order

Use one Google Sheets batch update whenever possible:

1. Update the source task row to `status=done`.
2. Preserve the original task metadata exactly: priority, area, title, detail, dependencies, harness, assignee, acceptance criteria, risk flag, and created date.
3. Fill `notes`, `commit_hash`, `started_at`, and `completed_at`.
4. Append an identical task row to `Done`.
5. Append one `Runs` row with trigger, selected task ID, summary, verification, commit hash, and next action.
6. Read back the updated source row, the appended `Done` row, and the appended `Runs` row.

Do not delete the original Backlog row during the current MVP automation loop. Keeping the source row with `status=done` makes audit and stale-row repair easier.

## In Progress Rows

If a task starts from `In Progress`, complete it with the same fields and append it to `Done`.
After readback succeeds, the `In Progress` row may be cleared only when the automation can prove it is the same task ID and commit hash. If that proof is not available, leave the row intact and record the cleanup as a follow-up issue.

## Failure Handling

Stop and record an issue when any of these happen:

- `Done` append succeeds but `Runs` append fails.
- The source row and `Done` row disagree on task ID, status, or commit hash.
- A completed code or docs change has no pushed commit hash.
- Verification failed and the task is not intentionally marked `blocked` or `review`.
- A task needs external secrets, real account connection, real order execution, or legal judgment.

## Readback Checklist

Each completion run must verify:

- Source row is `done`.
- `Done` row exists with the same task ID and commit hash.
- `Runs` row exists with the selected task ID.
- Open external issues, such as `IS-001`, remain open unless directly resolved. `IS-003` is resolved as of 2026-07-14 and should not be re-opened unless a new phone-device verification risk is found.
- Dirty git files unrelated to the current task are not staged or reverted.
