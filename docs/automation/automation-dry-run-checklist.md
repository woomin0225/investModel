<!--
This document defines the dry-run checklist for investModel recurring automation before relying on unattended execution.
AI workers must use it to validate no-change, sheet-only, document-change, commit/push, blocked, and stale-row scenarios.
-->

# Automation Dry Run Checklist

## Purpose

This checklist proves that the recurring Codex workflow can choose work, avoid stale rows, update Google Sheets, verify changes, commit safely, and stop when user input is required.

Use it before changing the heartbeat prompt, increasing automation frequency, or allowing longer unattended runs.

## Dry Run Principles

- Run one scenario at a time.
- Use one selected task or Issue per run.
- Do not modify unrelated local/user files.
- Record the result in `Runs`, even when no file changes.
- Do not mark a task `done` unless the completion gate in `verification-commit-push-rules.md` passes.
- Do not run stale duplicate rows when another row with the same id is already `done`.

## Preflight Checklist

| Check | Expected result |
| --- | --- |
| Read `Backlog`, `In Progress`, `Issues`, `Harness`, and recent `Runs` | current state is known before selection |
| Read required harness files | selected work has matching operating rules |
| Run `git status --short` | unrelated local/user changes are identified |
| Search selected id in Backlog/Done | completed duplicates are not restarted |
| Check open Issues | only safe, confirmation-free Issues are considered |
| Confirm stop conditions | no real deposit/order/account/legal/secret requirement |

## Scenario 1: No-Change Inspection

Purpose: confirm Codex can inspect and exit cleanly when no safe work is selected.

Steps:

1. Read required sheet tabs.
2. Read recent Runs.
3. Confirm no file edits are needed.
4. Write one Runs row with `selected_task_id=none`.
5. Leave Backlog, Done, and Issues unchanged.
6. Final heartbeat uses `DONT_NOTIFY`.

Expected verification text:

```text
시트 점검만 수행; Backlog/In Progress/Issues/Harness/Runs readback 확인; 파일 변경 없음
```

## Scenario 2: Sheet-Only Update

Purpose: confirm Codex can update sheet records without code changes.

Steps:

1. Select a small sheet maintenance task.
2. Update only the intended cells.
3. Read back the changed Backlog/Done/Runs ranges.
4. Do not commit.
5. Runs `commit_hash` stays blank.

Pass criteria:

- exactly one Runs row added
- no unintended Backlog task marked `in_progress`
- no local file changes

## Scenario 2A: Empty Backlog Planner Refill

Purpose: confirm automation does not invent a one-off implementation when no safe dependency-ready checklist item exists.

Steps:

1. Confirm `Backlog` and `In Progress` have no safe dependency-ready task.
2. Spawn a planner-style agent to review recent `Runs`, open `Issues`, `Done`, product goals, and required harness files.
3. Have the planner produce roughly 20-40 small Backlog candidates ordered P0-P3.
4. Write the candidate tasks to `Backlog` with area, title, detail, dependencies, required harness, assigned agent, acceptance criteria, risk flag, and issue links.
5. Do not perform implementation in the same run unless the user explicitly requested it.
6. Add one `Runs` row whose `agents_used` lists the coordinator plus planner/project-recorder roles.

Pass criteria:

- new tasks are prioritized and dependency-aware
- risky real-money, order, account, legal, secret, or paid external API work is blocked or linked to Issues
- `Runs.agents_used` is not just `Codex` when multi-agent tools were available
- the next automation run can select from the newly written Backlog rows

## Scenario 3: Documentation Change With Commit

Purpose: confirm a one-file documentation task can be completed safely.

Steps:

1. Mark one selected Backlog row `in_progress`.
2. Add or update exactly one relevant document.
3. Run `git diff --check -- <file>`.
4. Run targeted `rg` checks for required terms and forbidden implications.
5. Stage only the changed document.
6. Run `git diff --cached --check`.
7. Commit with a concise Korean message.
8. Push.
9. Update Backlog, Done, and Runs with the commit hash.

Pass criteria:

- pushed commit contains only intended files
- Runs verification includes commands and push result
- unrelated local/user changes remain unstaged

## Scenario 4: Code Change With Verification

Purpose: confirm a small code task is not marked done without relevant checks.

Steps:

1. Select a dependency-ready code task.
2. Read domain, frontend/backend, and safety harnesses.
3. Make the smallest code change.
4. Run targeted lint/type/test command when available.
5. Run safety scan for forbidden financial/legal wording when relevant.
6. Commit and push only after verification passes or a known blocker is recorded.

Pass criteria:

- verification command is named in Runs
- skipped build/test has a clear reason
- no real deposit/order/account/secret code is introduced

## Scenario 5: Push Rejected

Purpose: confirm Git conflict handling does not overwrite user work.

Steps:

1. Attempt `git push`.
2. If rejected because remote moved, run `git pull --rebase`.
3. Resolve only conflicts in files owned by the selected task.
4. Rerun relevant verification.
5. Push again.
6. If conflict touches unrelated user changes, stop and record an Issue.

Pass criteria:

- no destructive reset or checkout used
- conflict handling is recorded in Runs
- task is not marked done until push succeeds

## Scenario 6: Blocked Requirement

Purpose: confirm automation stops for unsafe or external requirements.

Trigger examples:

- real Stripe key required
- Docker required for local DB setup
- brokerage account connection requested
- legal/suitability approval needed
- paid market/news API key required

Expected behavior:

1. Stop implementation.
2. Add or update an Issue.
3. Mark task `blocked` or `review`.
4. Add a Runs row.
5. Use `NOTIFY` only when user action is needed.

Pass criteria:

- no placeholder secret is added
- no fake success is recorded
- task is not marked `done`

## Scenario 7: Stale Duplicate Row

Purpose: confirm completed duplicate tasks are not restarted.

Steps:

1. Search the candidate id in Backlog and Done.
2. If another row with the same id is `done`, prefer the completed row.
3. Leave stale `todo` row untouched unless the selected task is sheet cleanup.
4. Record in Runs if the stale row affected task selection.
5. Choose the next dependency-ready task.

Pass criteria:

- stale row is not marked `in_progress`
- no duplicate Done row is added
- next selected task is documented

## Scenario 8: Mobile UI Verification

Purpose: confirm mobile-first UI work is checked like an app surface.

Reference checklist: `docs/qa/invest-model-390px-smoke-checklist.md`.

Steps:

1. Start the dev server if UI changes require runtime validation.
2. Verify a 390px mobile viewport.
3. Check safe area, scroll, bottom tab, and text/card overlap.
4. Capture or summarize visual verification in Runs.
5. Stop or leave the dev server according to the user's request and current run needs.

Pass criteria:

- no text overlap or hidden bottom-tab content
- mock/simulated labels remain visible
- no real trading/deposit wording appears

## Scenario 9: Cross-Surface Runs Verification

Purpose: confirm mixed UI, API, and DB/read-model work is recorded with enough evidence in one `Runs.verification` cell.

Reference checklist: `docs/automation/verification-commit-push-rules.md`.

Steps:

1. Pick or simulate one task that touches UI copy/state, an API/backend guard, and a DB/read-model or seed contract.
2. Draft a single `Runs.verification` sentence that names each touched surface.
3. Include server checkpoint evidence when the selected Backlog id is divisible by 10, or explicitly record why it was not required.
4. Include open Issue handling when a check is skipped because of `IS-001`, `IS-004`, `IS-007`, secrets, legal review, or unavailable external infrastructure.

Pass criteria:

- the sentence includes `PASS:`, `SKIP:`, or `BLOCKED:` evidence for UI, API/backend, DB/read-model, server checkpoint, and failure/Issue handling when relevant
- exact commands or readback checks are named
- no vague `검증 완료`, `테스트 완료`, or `pass`-only wording is used
- `commit_hash` is blank only for sheet-only/planning-only/no-file runs and the reason is stated

## Final Dry Run Sign-Off

The automation loop is ready for longer unattended use only when these scenarios have passed or have an explicit follow-up task:

- no-change inspection
- sheet-only update
- documentation change with commit
- code change with verification
- push rejected
- blocked requirement
- stale duplicate row
- mobile UI verification
- cross-surface Runs verification

If any scenario fails, create a small Backlog item for that failure instead of expanding the current run.

## Follow-Up Links

- `BK-148`: sheet movement and duplicate handling rules.
- `BK-149`: verification, commit, and push rules.
- `IS-001`: known production build/Stripe/Docker blocker.
