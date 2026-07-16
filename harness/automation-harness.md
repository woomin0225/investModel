# Automation Harness

<!--
이 하네스는 Codex automation, Google Sheets, GitHub 연동으로 장기 개발을 자동 진행할 때의 운영 원칙입니다.
무인 실행 중 위험한 작업을 제한하고, 작업 기록이 누락되지 않도록 합니다.
-->

## Automation Loop

1. Google Sheets에서 Backlog, In Progress, Issues, Harness를 확인합니다.
2. 사용자 요청이 기존 항목인지 중복 확인합니다.
3. 없으면 Backlog에 새 항목을 추가합니다.
4. 관련 하네스를 확인합니다.
5. 필요한 agent를 선택합니다.
6. 구현 또는 문서 작업을 수행합니다.
7. 작업 유형에 맞는 검증을 실행합니다.
8. Sheets에 상태, 요약, 문제, 다음 작업을 기록합니다.
9. 변경 파일이 있으면 한국어 커밋 메시지로 commit/push합니다.
10. 자동화가 계속 허용된 상황이면 다음 작업으로 넘어갑니다.

## Sheet Selection Rules

- 사용자가 명시한 작업이 있으면 그 작업을 우선합니다.
- 명시 작업이 없으면 열린 blocker, P0, 의존성 충족 항목 순서로 선택합니다.
- 새 요청이 이미 Done에 있는 경우 재작업 사유가 없으면 중복으로 추가하지 않습니다.
- 상태 이동은 Backlog -> In Progress -> Done을 기본으로 합니다.

## Commit Rules

- 문서 작업: `docs: ...`
- 하네스/운영 규칙: `chore: ...`
- 기능 구현: `feat: ...`
- 버그 수정: `fix: ...`
- 검증/테스트: `test: ...`

커밋 메시지는 한국어로 작성하고, 금융/보안/법률 경계 변경이 있으면 본문에 이유를 남깁니다.

## Stop Conditions

- 실제 자금 이동 구현
- 외부 브로커 주문 API 연결
- 법률 판단이 필요한 기능
- 하네스 충돌
- 사용자 비밀 정보 필요
- 테스트나 빌드 실패를 2회 이상 해결하지 못함
# Current Operating Addendum: Multi-Agent Automation

Recurring and manual automation runs must use multi-agent work when the tool is available. `Runs.agents_used` is an audit field for actual roles used, not a generic owner label.

- For any non-trivial implementation, planning, review, or sheet operation, use at least one concrete project role besides the main Codex coordinator.
- Valid role examples include `planner`, `frontend-developer`, `backend-developer`, `database-engineer`, `security-reviewer`, `qa-tester`, `uiux-designer`, and `project-recorder`.
- Record every materially contributing role in `Runs.agents_used`, separated by semicolons. Example: `Codex coordinator; planner; qa-tester`.
- Do not record a role that was not actually used in that run.
- If multi-agent tooling is unavailable, write `Codex coordinator (multi-agent unavailable)` in `Runs.agents_used` and explain the reason in `Runs.verification`.
- Keep delegated write scopes disjoint. Agents must not revert unrelated user changes or other agents' changes.

If no safe dependency-ready task exists in `In Progress`, `Issues`, or `Backlog`, do not invent one implementation task directly. Use a `planner` agent first, create roughly 20-40 small prioritized `Backlog` rows, record that planning run in `Runs` with `planner` in `agents_used`, and let the next automation run select from the newly created checklist.

## Backlog Creation Coupling Rule

When creating new Backlog rows, do not add frontend-only implementation work in isolation if that screen will need API, server, DB, seed, or read-model support.

- For each meaningful frontend row, also add the companion backend/API and database/read-model rows needed to make the UI real and testable.
- Link companion rows through `dependencies` using semicolon-separated task ids such as `BK-501;BK-502`. Use a blank dependency only when the row is truly independent.
- Keep each row small and separately verifiable: one frontend view/state, one API or backend contract, one DB/read-model/seed task, one smoke or QA task when needed.
- Use `required_harness` to show the real work surface, for example `frontend;backend;database;domain-contract;automation` when a UI depends on an API and DB read model.
- Fill `assigned_agent` on every Backlog row. Use intended roles such as `frontend-developer`, `backend-developer`, `database-engineer`, `qa-tester`, or `future-heartbeat`; do not leave it blank.
- Fill `notes` for generated planning rows with a short Korean planning note or leave it blank only when the row has just been created and has not been selected yet. At completion, `notes` must summarize what changed or why the row was blocked/skipped.
- Fill `commit_hash` only after a file-changing commit has been pushed. For sheet-only planning or no-file runs, keep `commit_hash` blank and state `sheet-only` or `no file changes` in `notes` and `Runs.verification`.

## Server Reachability Checkpoint Rule

Every Backlog id whose number is a multiple of 10, such as `BK-10`, `BK-20`, `BK-30`, ... `BK-490`, `BK-500`, must be treated as a server reachability checkpoint when it is created or selected.

- The checkpoint should verify the local app server status before feature work continues.
- When the local server is running, record whether a same-Wi-Fi mobile device can access the app through the PC LAN address and the active dev-server port.
- If the server is not running or same-Wi-Fi access cannot be verified, record the result in `Runs.verification` and add or update an `Issues` row when it blocks mobile QA.
- Do not require Android Studio, iOS tooling, real brokerage/account setup, external paid APIs, or secrets for this checkpoint.
- Suitable verification examples include checking the listening port, local HTTP response, LAN IP URL, firewall/network notes, and 390px mobile browser access when a device is available.

## Runs Verification Evidence Rule

`Runs.verification` must name the exact evidence collected for the selected work type. Use `docs/automation/verification-commit-push-rules.md` as the canonical template source before marking a run done.

- Mark each touched evidence category as `PASS: ...`, `SKIP: ...`, or `BLOCKED: ...` in concise Korean or mixed command text.
- Frontend UI runs should record typecheck, visual/source smoke, 390px mobile checks, safety-copy scans, and push result.
- API/backend runs should record typecheck, route or smoke command, RBAC/user-scope or policy guard check, forbidden real-finance side-effect check, and push result.
- DB/read-model runs should record DBML/SQL/schema or seed comparison, focused DB/read-model smoke, known local DB/Docker blocker when relevant, and no secret/payment/broker field check.
- Documentation, harness, and automation runs should record `git diff --check`, targeted `rg` terms, skipped runtime-check reason, and push result.
- Server checkpoint runs should record listening port, local HTTP response, LAN IP URL, same-Wi-Fi mobile reachability, or the Issue-backed reason it could not be checked.
- Sheet-only runs should record Backlog/In Progress/Done/Runs readback, duplicate/stale status check, `commit_hash` blank reason, and no-file-change status.
- Failure or blocked runs should record the failing command, whether a retry happened, linked Issue id, final task status, and why `done` was not used.

Do not write only `검증 완료`, `테스트 완료`, or `pass`. If a check is skipped, state the exact reason and whether it is covered by an existing Issue.

## Design Sample Refill Rule

If the checklist has no safe dependency-ready UI task, or if the user asks to improve mobile securities-app UX, use the design sample workflow before inventing implementation work.

1. Inspect `design-samples/raw` for new user-provided reference screenshots.
2. Copy the strongest reusable references into `design-samples/selected` while preserving raw originals unless the user explicitly asks for deletion.
3. Summarize common and standout UI/UX patterns in `docs/design-sample-ui-patterns.md`.
4. Create small Backlog rows from those patterns before coding. Each row should name the target screen, source pattern, safety boundary, acceptance criteria, and required harness.
5. Pattern-derived tasks must avoid real deposit, withdrawal, account linking, brokerage order, legal judgment, and external paid API requirements.
6. Pattern-derived UI work must keep `MockDeposit`, `TradeIntent`, `SignalEvent`, and `AllocationDecision` visibly simulated or observational.
7. Known untracked files under `design-samples/raw` and `design-samples/selected` are allowed reference assets and should not alone block automation work.
