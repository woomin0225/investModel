<!--
This document defines the minimum verification, Korean commit message, and push rules for investModel automated work units.
AI workers must use it before marking a task done or pushing changes from heartbeat/manual continuation runs.
-->

# Verification, Commit, And Push Rules

## Purpose

Every investModel work unit must leave a clear trail: what changed, how it was checked, what was committed, and what remains unresolved. This document defines the minimum standard by work type.

Use this with:

- `docs/automation/codex-recurring-workflow-prompt.md`
- `docs/automation/sheet-state-deduplication-rules.md`

## General Completion Gate

A task can be marked `done` only when all of these are true:

1. The changed files match the selected checklist item.
2. Unrelated local/user changes were not staged.
3. The minimum verification for the work type ran or a known blocker was recorded.
4. The Backlog row has Korean notes, `completed_at`, and commit hash when files changed.
5. A Done row and a Runs row were written.
6. The code or document does not imply real deposits, real orders, account linking, legal approval, guaranteed returns, or secret access.

If any gate fails, use `blocked` or `review` instead of `done`.

## Verification Matrix

| Work type | Minimum verification | Extra check |
| --- | --- | --- |
| Markdown docs | `git diff --check -- <file>` | `rg` for required terms, forbidden claims, and linked checklist ids |
| Harness docs | `git diff --check -- harness/<file>` | confirm top role comment exists and no immutable principle was weakened |
| Automation docs | `git diff --check -- docs/automation/<file>` | `rg` for Backlog/In Progress/Done/Issues/Runs, stop conditions, and next checklist ids |
| Domain type docs | `git diff --check -- <file>` | `rg` for canonical terms: InvestmentModel, ModelVersion, PortfolioMandate, MockDeposit, AllocationDecision, TradeIntent |
| TypeScript domain code | targeted TypeScript/lint command when available | `rg` for exported names and forbidden aliases like Strategy/Bot/Advisor |
| Frontend UI | `pnpm lint` or available targeted check; browser/screenshot check for visual UI changes | mobile 390px/safe-area/bottom-tab overlap check when UI changed |
| API/backend | targeted tests or type/lint check when available | verify DTO boundary, RBAC guard, audit event, and no DB row direct exposure |
| DB/SQL/DBML | `git diff --check -- docs/database/<file>` | compare DBML and SQL names; confirm no secret/payment/broker field was added |
| Mock data | `git diff --check -- <file>` | `rg` for mock/simulated/backtest/placeholder labels and forbidden real-balance wording |
| Figma/design reference docs | `git diff --check -- <file>` | confirm placeholders remain where user-provided design/legal copy is required |
| Sheet-only work | read back the updated Backlog/Done/Runs rows | confirm no duplicate active task was created |

When `pnpm lint` is unavailable or the project has no lint script, record the skipped command and use the closest targeted verification.

## Known Environment Blockers

Do not repeatedly attempt blocked commands without changing the environment.

| Blocker | Current rule |
| --- | --- |
| production build needs real Stripe key | do not run or claim successful `next build` for production until `IS-001` is resolved |
| Docker not installed | do not claim local Docker/MySQL DB setup was tested |
| external paid API key missing | stop and record Issue; do not add placeholder secrets |
| real financial account or brokerage access required | stop and request user/legal/security confirmation through Issues |

`IS-001` should be mentioned only when production build, Stripe, Docker, or local DB setup is directly relevant.

## Commit Rules

Commit only files that belong to the selected task.

Before committing:

1. Run `git status --short`.
2. Stage exact paths, not broad directories, when unrelated changes exist.
3. Review `git diff --cached --check`.
4. Use a concise Korean message.

Recommended message patterns:

| Work type | Example |
| --- | --- |
| docs | `상태 전이 테스트 기준 작성` |
| automation | `자동화 검증과 커밋 기준 정리` |
| frontend | `모바일 모델 카드 레이아웃 수정` |
| backend | `모델 선택 API guard 설계 추가` |
| db | `MySQL 모델 테이블 매핑 문서 보강` |
| test | `TradeIntent 상태 전이 테스트 추가` |
| fix | `mock 포트폴리오 라벨 혼동 수정` |

Commit body is optional. Add a body when the task touches safety, security, legal/financial boundary, or a known blocker.

## Push Rules

After committing:

1. Run `git push`.
2. If push succeeds, record the short hash in Backlog, Done, and Runs.
3. If push is rejected because the remote moved, run `git pull --rebase`, resolve only task-related conflicts, rerun relevant verification, then push.
4. If conflicts touch unrelated user changes, stop and record the blocker.
5. If push fails for credentials/network, do not mark the task done unless the sheet clearly records that push failed and user action is needed.

Never use destructive reset or checkout commands to force a push.

## Runs Verification Text

The `Runs.verification` field should include:

- exact command or check name
- pass/fail/skipped result
- reason for skipped checks
- push result when files changed

Examples:

- `git diff --check 통과; rg로 mock/simulated/TradeIntent 확인; 문서 작업이라 빌드/타입체크 미수행; git push 성공`
- `pnpm lint 실패: 기존 Stripe placeholder build 이슈와 무관한 lint script 없음; targeted rg 확인; git push 성공`
- `시트 작업만 수행; Backlog/Done/Runs readback 확인; 파일 변경 없음`

Do not write only `검증 완료` or `테스트 완료`.

## Blocked Or Review Outcomes

Use `blocked` when:

- a secret, real account, paid API key, Docker, production service, or user confirmation is required
- a legal/financial/suitability judgment is needed
- the same verification failure repeats and cannot be fixed safely in one small task

Use `review` when:

- implementation exists but human design/security/legal review is required
- generated design, copy, or policy text needs user-provided content
- the change is intentionally a draft and should not be treated as complete

In both cases, create or update an Issue and write a Runs row.

## Safety Scan

Before marking done, scan new or changed user-facing/code artifacts for these terms when relevant:

| Forbidden implication | Search examples |
| --- | --- |
| real order execution | `order placed`, `executed`, `filled`, `settled`, `broker_order_id` |
| real money movement | `real deposit`, `withdrawable`, `cash available`, `settled cash`, `payment_id` |
| guaranteed performance | `guaranteed`, `no loss`, `risk free`, `approved return` |
| legal approval | `legally approved`, `compliant by default`, `suitability approved` |
| secret leakage | `STRIPE_SECRET_KEY`, `DATABASE_URL=`, `api_key`, `private_key` |

Allowed mock wording should remain explicit: `mock`, `simulated`, `placeholder`, `backtest`, `pre-order simulation`.

## Follow-Up Links

- `BK-150`: dry-run these rules across no-change, doc-change, and commit/push scenarios.
- `IS-001`: production build/Stripe/Docker blocker, only relevant to build/setup work.
