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

## Design Sample Refill Rule

If the checklist has no safe dependency-ready UI task, or if the user asks to improve mobile securities-app UX, use the design sample workflow before inventing implementation work.

1. Inspect `design-samples/raw` for new user-provided reference screenshots.
2. Copy the strongest reusable references into `design-samples/selected` while preserving raw originals unless the user explicitly asks for deletion.
3. Summarize common and standout UI/UX patterns in `docs/design-sample-ui-patterns.md`.
4. Create small Backlog rows from those patterns before coding. Each row should name the target screen, source pattern, safety boundary, acceptance criteria, and required harness.
5. Pattern-derived tasks must avoid real deposit, withdrawal, account linking, brokerage order, legal judgment, and external paid API requirements.
6. Pattern-derived UI work must keep `MockDeposit`, `TradeIntent`, `SignalEvent`, and `AllocationDecision` visibly simulated or observational.
7. Known untracked files under `design-samples/raw` and `design-samples/selected` are allowed reference assets and should not alone block automation work.
