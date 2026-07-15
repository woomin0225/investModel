# Project Agent Rules

<!--
이 파일은 Codex와 하위 에이전트가 investModel 프로젝트에서 항상 따라야 하는 최상위 작업 규칙입니다.
처음 보는 사람도 프로젝트 운영 방식, 검증 기준, 하네스 우선순위를 이해할 수 있게 유지합니다.
-->

## Required Harness Order

작업 전 필요한 범위만 읽되, 아래 순서를 기본으로 따릅니다.

1. `harness/core-harness.md`
2. `harness/product-harness.md`
3. `harness/risk-compliance-harness.md`
4. 도메인/API/Mock/RBAC/상태/자동화 작업이면 `harness/domain-contract-harness.md`
5. 작업 영역별 하네스: `frontend`, `backend`, `database`, `model-marketplace`, `security`, `naming`, `design`, `automation`

## Domain Contract Rule

- 핵심 이름은 `domain-contract-harness.md`의 Canonical Domain Terms를 우선합니다.
- `InvestmentModel`, `ModelVersion`, `PortfolioMandate`, `TradeIntent`, `MockDeposit` 같은 이름을 임의로 바꾸지 않습니다.
- DTO, DB table, UI component가 같은 개념을 다룰 때는 역할만 다르게 하고 용어의 중심 이름은 유지합니다.
- 모든 클래스, 인터페이스, agent, harness 파일 최상단에는 역할 설명 주석을 둡니다.

## Database Rule

- DB, ORM, migration, seed, backend domain model, portfolio, model marketplace, market/news signal, feed, audit log 작업 전 `harness/database-harness.md`를 확인합니다.
- DB 구조의 기준은 `docs/database/invest-model.dbml`이고, MySQL SQL 초안은 `docs/database/invest-model.mysql.sql`입니다.
- 목표 DB는 MySQL입니다. 현재 스타터가 PostgreSQL/Drizzle 기반이어도 최종 전환 방향은 MySQL입니다.
- 실제 입금, 실제 계좌 연결, 실제 주문 실행은 명시 승인과 법률/보안/금융 검토 없이 구현하지 않습니다.

## Operating Rule

- 사용자가 작업을 지시하면 Google Sheets 체크리스트를 먼저 확인합니다.
- 새 요청이 체크리스트에 없으면 Backlog에 추가하고 작업합니다.
- 기본 흐름은 planner -> designer/developer -> reviewer/qa -> recorder입니다.
- 탐색, 리뷰, 테스트처럼 독립 가능한 작업은 멀티에이전트 병렬 수행을 허용합니다.
- 금융 조언, 수익 보장, 법적 적합성 확정 표현은 제한합니다.

## Git Rule

- 하나의 작업 단위가 끝나면 관련 검증을 수행한 뒤 한국어 커밋 메시지로 커밋합니다.
- push가 거절되면 `git pull --rebase` 후 충돌을 해결하고 다시 검증합니다.
- 사용자가 만든 변경이나 관련 없는 변경은 되돌리지 않습니다.

## Google Sheets Rule

- 작업 시작 전 Backlog, In Progress, Issues, Harness를 확인합니다.
- 작업 완료 후 Done 또는 해당 상태로 반영하고, 구현 요약, 검증 결과, 문제사항, 커밋 해시를 기록합니다.
- 문제가 남으면 Issues에 기록하고 다음 체크리스트에 연결합니다.
# Current Operating Addendum: Multi-Agent Automation

- Scheduled and manual automation should use multi-agent work when the tool is available.
- The default operating flow is `planner -> designer/developer -> reviewer/qa -> recorder`; use the subset that fits the selected small task.
- `Runs.agents_used` must list the actual roles used, such as `Codex coordinator; planner; frontend-developer; qa-tester`.
- Do not write only `Codex` when a sub-agent or project role contributed.
- If there is no safe dependency-ready checklist item, use a `planner` agent first to create roughly 20-40 prioritized Backlog rows before implementation.
- Record the planning run in `Runs` and let later automation select from that checklist.
