<!--
This document defines the recurring Codex automation prompt and operating checklist for investModel.
AI workers must use it when a scheduled or manual continuation should inspect Google Sheets, choose one small task, update records, and push safe changes.
-->

# Codex Recurring Workflow Prompt

## Purpose

This prompt keeps investModel development consistent when Codex is restarted manually or by a recurring automation. It turns the Google Sheet into the operating source of truth and keeps every run small, auditable, and reversible.

Use this for 10-minute heartbeats, manual "continue development" requests, and any app-development request that should update the project checklist.

## Canonical Prompt

```text
Use $stock-app-sheet-operator.

Continue investModel development in C:\invest-model-project\invest-model.

Before work:
1. Read Google Sheets tabs: Backlog, In Progress, Issues, Harness, and recent Runs.
2. If the user gave a new request, search Backlog, In Progress, Done, and Issues for duplicates.
3. If the request is missing, add one small Backlog item before implementation.
4. Select exactly one small work unit:
   - active non-blocked In Progress first
   - unresolved safe-to-fix Issues next
   - highest-priority dependency-ready Backlog next
   - if no ready work exists, inspect recent code/docs for one small defect or missing checklist item
5. Mark the chosen task as in_progress before substantial work.
6. Read AGENTS.md and the required harness files. For domain, API, DB, mock, RBAC, state, or automation work, also read harness/domain-contract-harness.md.

When creating or selecting Backlog rows:
1. Use semicolon-separated stable ids in dependencies, for example `BK-491;IS-004`; leave dependencies blank only for truly independent work.
2. Fill assigned_agent for every row with a concrete intended role.
3. For frontend checklist items that need real data, also add companion backend/API and database/read-model rows and link them through dependencies.
4. Every BK id divisible by 10 must include local server status plus same-Wi-Fi mobile reachability verification, or a recorded skipped/blocked reason.

During work:
1. Keep scope to one bounded task.
2. Do not implement real deposits, withdrawals, brokerage orders, account linking, legal determinations, user secrets, or paid external API keys.
3. If a blocked or sensitive requirement appears, stop implementation, record an Issues row, and leave the task blocked or review.
4. Preserve unrelated local/user changes.
5. Prefer project naming and domain terms: InvestmentModel, ModelVersion, PortfolioMandate, MockDeposit, AllocationDecision, TradeIntent, SignalEvent, FeedPost.

After work:
1. Run relevant verification for the changed artifact.
2. Update the chosen task row with status, notes, commit hash, started_at, and completed_at as applicable.
3. Add a Done row when the task is completed.
4. Update or add Issues when blockers or defects remain.
5. Add a Runs row with trigger, selected task id, agents, summary, verification, commit hash, and next action.
6. If files changed, commit and push with a concise Korean commit message.
7. End with a short status. For heartbeat runs, return only the heartbeat XML decision.
```

## Task Selection Rules

| Situation | Action |
| --- | --- |
| User named a task id | Select that task if it is not blocked by safety or missing secrets. |
| In Progress has safe unfinished work | Continue that item before starting new Backlog work. |
| Issues has a safe fix | Fix the smallest user-confirmation-free issue first. |
| Backlog has P0 dependency-ready work | Select the earliest safe P0 item. |
| Only blocked work remains | Record a Runs entry and do not invent unsafe work. |
| No work remains | Inspect for one small defect, then add a missing checklist item if useful. |

Dependency-ready means all listed prerequisite tasks are done or the work is a planning/document task that can safely refine the dependency before implementation.

## Verification Matrix

Use `docs/automation/verification-commit-push-rules.md` for the canonical `Runs.verification` evidence templates. Record exact commands, pass/fail/skipped reasons, server checkpoint status when relevant, and push result when files changed.

| Work type | Minimum verification |
| --- | --- |
| Markdown/documentation | `git diff --check -- <file>` and `rg` for key terms or forbidden claims. |
| TypeScript/domain types | `pnpm lint` or targeted type/lint command when available, plus `rg` for exported names. |
| Frontend UI | lint/build when safe, plus mobile viewport screenshot or browser check for visual changes. |
| API/backend | targeted tests or lint/typecheck, plus request/response contract review. |
| DB/SQL/DBML | compare DBML/SQL/table names and confirm no secret or real brokerage/payment field was added. |
| Automation/sheet work | verify Backlog/Done/Runs rows after update and confirm no duplicate active task was created. |

If verification cannot run because of an existing environment blocker, record that blocker in Issues or Runs instead of silently passing the task.

## Commit Rules

Commit messages must be Korean and scoped to the completed work. Prefixes are optional, but the message should make the artifact clear.

Examples:

- `자동화 실행 프롬프트 정리`
- `TradeIntent 상태 전이 테스트 기준 작성`
- `모바일 홈 화면 mock 데이터 연결`
- `모델 카드 위험 배지 표시 수정`

When unrelated local changes exist, stage only the files created or modified by the selected task.

## Stop Conditions

Stop the current implementation and record an Issue if the task requires:

- real fund movement, deposit, withdrawal, refund, custody, or stored value behavior
- real brokerage order submission, execution, fill, settlement, or account linking
- user secrets, production credentials, paid API keys, or private external accounts
- final legal, regulatory, tax, or suitability judgment
- model file execution or unreviewed uploaded code execution
- a harness conflict that cannot be resolved by a small safe documentation update

## Heartbeat Response Format

Use `DONT_NOTIFY` when the run completed normally or only made routine progress.

```xml
<heartbeat>
  <automation_id>investmodel-10</automation_id>
  <decision>DONT_NOTIFY</decision>
  <message>BK-000을 완료했고 커밋 해시로 푸시했습니다. 다음 회차는 BK-000을 진행합니다.</message>
</heartbeat>
```

Use `NOTIFY` only when user attention is needed for secrets, legal/financial review, conflicting instructions, repeated verification failure, or a decision that changes product direction.

## Related Checklists

- `BK-147`: this automation prompt baseline.
- `BK-148`: sheet state movement and duplicate-detection rules.
- `BK-149`: verification, commit, and push criteria by work type.
- `BK-150`: automation dry-run checklist.
# Current Operating Addendum: Multi-Agent And Empty-Queue Planning

Recurring and manual automation must use multi-agent work when the tool is available. `Runs.agents_used` must list actual roles separated by semicolons, for example `Codex coordinator; planner`, `Codex coordinator; frontend-developer; qa-tester`, or `Codex coordinator; backend-developer; security-reviewer`. Do not write only `Codex` when a planner, worker, explorer, reviewer, QA, or project role contributed. If multi-agent tooling is unavailable, record `Codex coordinator (multi-agent unavailable)` and explain why in `Runs.verification`.

If there is no safe dependency-ready task in `In Progress`, `Issues`, or `Backlog`, do not choose an ad hoc implementation task. Use a `planner` agent to create roughly 20-40 small Backlog candidates first. Each candidate must include status `todo`, priority, area, title, detail, dependencies, required harness, assigned agent, acceptance criteria, risk flag, and issue links. Prioritize mobile/PWA polish, search, notifications, Signals filters/details, Feed details/comments/likes/saves/read/ranking, Portfolio time dashboard, My Page, DB-backed read models, and checklist hygiene. Write the candidates to Backlog, record the planning run in Runs, and stop after planning unless the user explicitly asked to implement in the same run.

When the planner or coordinator creates Backlog rows, use the existing sheet style:

- `dependencies` is a semicolon-separated list of task or issue ids such as `BK-491;IS-004`; use blank only for truly independent work.
- `assigned_agent` must be filled for every row. Use a concrete intended role such as `frontend-developer`, `backend-developer`, `database-engineer`, `qa-tester`, `project-recorder`, or `future-heartbeat`.
- `notes` may be blank only for brand-new unselected rows. Once selected, skipped, blocked, or completed, write a short Korean note.
- `commit_hash` is filled only after a file-changing commit is pushed. For sheet-only/planning-only rows keep it blank and record the reason in `notes` and `Runs.verification`.
- Do not create frontend-only rows for screens that need server or DB support. Add companion backend/API and database/read-model rows and link them through `dependencies`.
- Every new or selected Backlog id divisible by 10 (`BK-10`, `BK-20`, `BK-30`, ... `BK-490`, `BK-500`) must include server status and same-Wi-Fi mobile reachability checking. Verify the local dev server, LAN URL, and mobile access when a device is available; otherwise record why it was skipped or blocked.
