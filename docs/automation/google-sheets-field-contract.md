<!--
This document defines the Google Sheets tab and field contract for investModel work tracking.
AI workers must use it before starting, completing, blocking, or recording a development work unit.
-->

# Google Sheets Field Contract

## Purpose

The project Google Sheet is the source of truth for investModel work selection, completion records, open issues, and automation history. This document defines what each key tab stores and which fields must be updated before and after a work unit.

Use this with:

- `docs/automation/sheet-state-deduplication-rules.md`
- `docs/automation/verification-commit-push-rules.md`
- `docs/automation/codex-recurring-workflow-prompt.md`

## Tab Contract

| Tab | Purpose | Required write timing |
| --- | --- | --- |
| `Backlog` | Canonical task queue and current task state | read before work; update selected row at start and completion |
| `In Progress` | Optional mirror for work that spans more than one run | use only when a task cannot finish in the current run |
| `Done` | Append-only completion ledger | append once when a task is done |
| `Issues` | Open blockers, defects, risks, and required user confirmations | add/update when work is blocked or a risk is discovered |
| `Decisions` | Durable product, technical, safety, or workflow decisions | append when a decision should guide future runs |
| `Runs` | One execution record per heartbeat or manual work unit | append at the end of every run |
| `Harness` | Registry of harness files and review state | update only when harness content or review date changes |

## Backlog, In Progress, And Done Fields

Backlog, In Progress, and Done use the same task schema:

| Field | Required | Rule |
| --- | --- | --- |
| `id` | yes | stable `BK-###` id; never reuse for different scope |
| `status` | yes | `todo`, `in_progress`, `blocked`, `review`, or `done` |
| `priority` | yes | `P0` to `P3`; use `P0` only for setup, safety, data integrity, or core flow blockers |
| `area` | yes | short domain such as `frontend`, `backend`, `admin`, `sheets`, `automation`, `db`, `security` |
| `title` | yes | short Korean task name |
| `detail` | yes | one sentence explaining the task outcome |
| `dependencies` | recommended | semicolon-separated task ids; blank only when truly independent |
| `required_harness` | yes | semicolon-separated harness files to read before work |
| `assigned_agent` | yes | agent role such as `frontend-developer`, `backend-developer`, `project-recorder` |
| `acceptance_criteria` | yes | observable completion rule |
| `risk_flag` | yes | `none`, `legal_review`, `security_review`, `financial_operation`, `user_confirmation`, or `external_account` |
| `notes` | completion required | Korean summary of what changed, what was skipped, or why blocked |
| `issue_ids` | conditional | linked Issues ids when a blocker, risk, or resolved issue is relevant |
| `commit_hash` | conditional | short hash when files changed and push succeeded; blank for sheet-only work |
| `created_at` | yes | creation date |
| `started_at` | start required | set when the row is selected for real work |
| `completed_at` | completion required | set when status becomes `done`; blank for blocked/review/todo |

### Backlog Row Style Rules

- `dependencies` uses semicolon-separated stable ids only, for example `BK-431;BK-432` or `IS-004`. Do not mix prose into this field. Put explanation in `notes`.
- Use a blank `dependencies` field only when the row is truly independent. If a frontend row needs an API, backend guard, seed, DB read model, or smoke first, create those rows and link their ids.
- Planned `todo` rows should still fill `assigned_agent`. Use an intended role such as `frontend-developer`, `backend-developer`, `database-engineer`, `qa-tester`, `project-recorder`, or `future-heartbeat`.
- `notes` may be blank only for brand-new unselected planning rows. Once a row is selected, skipped, blocked, or completed, write a short Korean note matching prior rows.
- `commit_hash` must contain a real short hash only after file changes were committed and pushed. For sheet-only or planning-only work, keep it blank and record `sheet-only` or `no file changes` in `notes` and `Runs.verification`.
- When adding a frontend checklist item, also add companion backend/API and database/read-model rows when needed so the frontend is not permanently mock-only by accident.
- Every Backlog id whose number is divisible by 10, for example `BK-490` or `BK-500`, should be a server reachability checkpoint or include server reachability in its acceptance criteria. It should verify local server status and same-Wi-Fi mobile access when a device is available.

## Start-Of-Work Updates

Before code or document edits:

1. Read `Backlog`, `In Progress`, `Issues`, and `Harness`.
2. Confirm the selected task is not already done in Backlog or Done.
3. Read the required harness files.
4. Set the selected Backlog row to `in_progress`.
5. Fill `started_at` if it is blank.
6. Add a short Korean note explaining why the task was selected.

Do not start more than one task in one heartbeat run.

## Completion Updates

When work is complete:

1. Update the selected Backlog row to `done`.
2. Fill `notes`, `commit_hash` when applicable, and `completed_at`.
3. Append the same completed task to `Done`.
4. Append one `Runs` row.
5. Resolve only Issues that were actually fixed by the run.
6. Leave unrelated dirty local files unstaged and mention them only when they affect the selected task.

If verification fails, push fails, or a required secret/account/legal decision is needed, do not mark the task done. Use `blocked` or `review` and update Issues.

## Issues Fields

| Field | Required | Rule |
| --- | --- | --- |
| `issue_id` | yes | stable `IS-###` id |
| `status` | yes | `open` or `resolved` |
| `priority` | yes | `P0` to `P3` |
| `related_task_id` | recommended | linked Backlog id |
| `area` | yes | affected area |
| `title` | yes | concise issue title |
| `detail` | yes | enough context for the next run to reproduce or decide |
| `owner` | recommended | likely agent role or user |
| `created_at` | yes | issue creation date |
| `resolved_at` | conditional | required when status becomes `resolved` |
| `resolution_notes` | conditional | required when status becomes `resolved` |
| `next_check` | recommended | next action or condition to revisit |

Create an Issue instead of continuing when work needs real deposits, real orders, account linking, legal judgment, secrets, paid external API keys, or unavailable local infrastructure.

## Runs Fields

Every heartbeat or manual execution writes one Runs row:

| Field | Required | Rule |
| --- | --- | --- |
| `run_id` | yes | monotonically increasing per date, for example `RUN-20260713-066` |
| `start_time` | yes | date or timestamp when the run began |
| `end_time` | yes | date or timestamp when the run ended |
| `trigger` | yes | `heartbeat`, `user_request`, `manual`, or `automation` |
| `selected_task_id` | yes | selected Backlog id, Issue id, or `none` |
| `agents_used` | yes | semicolon-separated agent roles |
| `summary` | yes | concise Korean summary |
| `verification` | yes | commands/checks and pass/fail/skipped reason; follow `docs/automation/verification-commit-push-rules.md` Runs verification templates and avoid vague `검증 완료` wording |
| `commit_hash` | conditional | short hash when files changed and push succeeded |
| `next_action` | yes | next likely checklist item or user-needed blocker |

Runs should be honest. Do not write `tests passed` unless the specific command or readback was performed.

## Harness Fields

Harness rows should remain stable and should only change when the harness itself changes.

| Field | Rule |
| --- | --- |
| `harness_id` | stable `HN-###` id |
| `name` | human-readable harness name |
| `path` | repo-relative harness file path |
| `last_checked_at` | update when a meaningful harness review or edit occurs |
| `checked_by` | agent or actor name |
| `notes` | short purpose or change summary |
| `change_allowed` | `FALSE` for immutable principles, otherwise `TRUE` |

## Safety Rules

- Sheet status never grants permission for real deposits, real orders, brokerage/account linking, model file execution, legal approval, or secret access.
- `risk_flag=financial_operation`, `legal_review`, `security_review`, `external_account`, or `user_confirmation` requires extra caution and may require an Issue.
- Completed rows should not be reopened for new scope. Add a follow-up Backlog row instead.
- Do not delete old rows during feature work. Cleanup is its own small task.

## Quick Checklist

Before work:

1. Read required tabs.
2. Check duplicates and already-done rows.
3. Read harness files.
4. Mark one selected row `in_progress`.

After work:

1. Run verification.
2. Commit and push when files changed.
3. Update Backlog.
4. Append Done.
5. Append Runs.
6. Update Issues only when relevant.
# Current Operating Addendum: Runs Agents Used

`Runs.agents_used` must list the actual roles used in the run, separated by semicolons. Examples: `Codex coordinator; planner`, `Codex coordinator; frontend-developer; qa-tester`, `Codex coordinator; backend-developer; security-reviewer`, or `Codex coordinator (multi-agent unavailable)`.

Do not write only `Codex` when planner, worker, explorer, reviewer, or QA sub-agents were used. If multi-agent tooling is available and the run is more than a trivial readback, use it and record the concrete roles. If it is unavailable, record the unavailable reason in `verification`.
