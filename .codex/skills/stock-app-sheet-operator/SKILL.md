---
name: "stock-app-sheet-operator"
description: "Use for the AI model stock investment app whenever Codex receives app-development work, feature requests, bug fixes, planning requests, automation runs, or status updates that should be coordinated through the project Google Sheet. This skill checks the sheet before work, adds missing tasks, follows priority and issue state, updates task status after work, and keeps Backlog, In Progress, Done, Issues, Decisions, Runs, and Harness current."
---

# Stock App Sheet Operator

<!--
이 스킬은 AI 모델 기반 주식 투자 앱의 작업 원장을 Google Sheets와 동기화하는 프로젝트 운영 스킬입니다.
작업 전 체크리스트를 확인하고, 없는 작업은 추가하고, 완료/문제/결정/실행 기록을 시트에 반영합니다.
-->

## Project Sheet

- Spreadsheet title: `주식앱 체크리스트`
- Spreadsheet ID: `1OGnHLGj-ZZYkkyPR2LAdH-koBQNj3kDQ6psEymheDes`
- Spreadsheet URL: `https://docs.google.com/spreadsheets/d/1OGnHLGj-ZZYkkyPR2LAdH-koBQNj3kDQ6psEymheDes/edit`

## Required Tabs

- `Backlog`: work not started
- `In Progress`: work currently active
- `Done`: completed work
- `Issues`: blockers, defects, unresolved risks, follow-up checks
- `Decisions`: product and technical decisions
- `Runs`: each Codex execution record
- `Harness`: project harness registry and review state

## Start-Of-Work Protocol

Before implementing, changing code, or answering a project execution request:

1. Read relevant rows from `Backlog`, `In Progress`, `Issues`, and `Harness`.
2. If the user explicitly named a task, find the matching `id` or closest matching title.
3. If the user gave a new request, search for duplicates in `Backlog`, `In Progress`, `Done`, and `Issues`.
4. If no matching task exists, append a new row to `Backlog` before starting work.
5. Choose the task by this order unless the user explicitly overrides it:
   - user-specified task
   - unresolved blocker that prevents current work
   - lowest priority number: `P0`, then `P1`, then `P2`, then `P3`
   - dependency-ready tasks before blocked tasks
6. Check required harness rows in `Harness` and, when local harness files exist, read the matching harness files.
7. Move or mark the selected task as `in_progress` before substantial implementation when the tool surface allows edits.

## Task Row Rules

Use this Backlog/In Progress/Done schema:

```text
id,status,priority,area,title,detail,dependencies,required_harness,assigned_agent,acceptance_criteria,risk_flag,notes,issue_ids,commit_hash,created_at,started_at,completed_at
```

When adding a new task:

- Generate an ID after the current max `BK-###`.
- Use `status=todo`.
- Set `priority` conservatively. Use `P0` only when it blocks project setup, safety, data integrity, or core user flow.
- Fill `required_harness` based on the affected area.
- Fill `risk_flag` with one of:
  - `none`
  - `legal_review`
  - `security_review`
  - `financial_operation`
  - `user_confirmation`
  - `external_account`
- Keep `notes`, `issue_ids`, `commit_hash`, `started_at`, and `completed_at` blank until they are known.

## During Work

- Follow the relevant harness before making design, domain, investment, security, or automation decisions.
- Do not implement real fund movement, brokerage order execution, external account connection, or legal claims without explicit user confirmation and a recorded `legal_review` or `financial_operation` issue.
- If a blocker appears, add or update an `Issues` row and link it from the task `issue_ids`.
- If a durable decision is made, add a `Decisions` row.
- If the work requires multiple agents, use the project agent roles and record the agent names in `Runs`.

## Completion Protocol

After each work unit:

1. Run relevant verification when code changed.
2. Update the task row:
   - `status=done` when complete, or `blocked` / `review` when not complete.
   - `notes`: short Korean summary of what changed.
   - `commit_hash`: fill when a commit exists.
   - `completed_at`: current date when done.
3. Move completed work from `Backlog` or `In Progress` to `Done` when practical.
4. Update `Issues`:
   - leave unresolved issues open
   - mark fixed issues resolved with `resolved_at` and `resolution_notes`
5. Add a `Runs` row with:
   - trigger
   - selected task id
   - agents used
   - summary
   - verification
   - commit hash
   - next action
6. Final response to the user must mention:
   - selected task id or newly created task id
   - sheet updates performed
   - verification performed or not performed
   - unresolved issues

## Google Sheets Tooling

Prefer Google Drive / Google Sheets connector tools when available:

- Use spreadsheet metadata to confirm tab names and sheet IDs.
- Use range reads to inspect existing task rows.
- Use batch updates to append rows, update cells, rename tabs, format headers, or move rows.
- If direct sheet writing is unavailable, produce CSV-ready rows and tell the user what could not be written.

## References

- Read `references/sheet-schema.md` when adding or updating rows.
- Read `references/automation-prompt.md` when creating a Codex automation prompt.
- Read `references/task-selection.md` when deciding what to do next.

