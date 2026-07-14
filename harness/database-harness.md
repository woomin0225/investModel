# Database Harness

<!--
이 하네스는 investModel의 데이터베이스 설계, MySQL 전환, ORM/migration 작업에서 반드시 따라야 하는 기준을 관리합니다.
AI가 DB 관련 코드를 작성하기 전에 canonical DBML/SQL 산출물과 도메인 계약을 확인하도록 하기 위한 작업 기준입니다.
-->

## Canonical Sources

DB 관련 작업 전 아래 파일을 먼저 확인합니다.

- DB 기획안: `docs/database/invest-model-mysql-plan.md`
- dbdiagram DBML: `docs/database/invest-model.dbml`
- MySQL SQL 스크립트: `docs/database/invest-model.mysql.sql`
- ERD 이미지: `dberd/invest-model-erd.png`
- dbdiagram 렌더링 캡처: `dberd/invest-model-dbdiagram-render.png`
- 도메인/API/Mock/RBAC/상태 계약: `harness/domain-contract-harness.md`

DB 구조의 기준은 `docs/database/invest-model.dbml`입니다. SQL, ORM schema, migration은 DBML과 불일치하지 않게 작성합니다.

## Required DB Change Workflow

DB 테이블 생성/수정, migration, sample row, dummy row, seed data 작업은 항상 아래 흐름을 따릅니다.

1. DB 파일이나 로컬/라이브 DB를 건드리기 전에 이 `database-harness.md`를 먼저 확인합니다.
2. 실제 적용 전에 canonical planning 산출물을 먼저 갱신합니다.
   - `docs/database/invest-model.dbml`
   - `docs/database/invest-model.mysql.sql`
   - 변경 범위를 설명하는 focused script 또는 문서가 필요하면 `docs/database/` 아래에 추가합니다.
3. sample/dummy/seed 데이터는 터미널에 임시 SQL로 직접 입력하지 않고 추적 가능한 별도 파일에 작성합니다.
   - SQL 샘플 후보: `docs/database/samples/*.sql`
   - SQL seed 후보: `docs/database/seeds/*.sql`
   - TypeScript seed 후보: `lib/db/seeds/*.ts`
4. 스크립트나 seed 파일을 전체 완성한 뒤 파일 단위로 검토하고, 그 완성본 전체를 DB에 적용해 테스트합니다.
5. 같은 작업이 추적 가능한 스크립트 파일에 먼저 기록되지 않았다면 MySQL 콘솔에서 one-off table 변경, sample insert, data fix를 직접 실행하지 않습니다.
6. 적용 후에는 반복 가능한 명령 또는 쿼리로 검증합니다. 예: `pnpm db:migrate`, `pnpm db:seed`, table existence check, row-count check, representative read-model query.
7. 스크립트를 안전하게 재실행할 수 없다면 파일 상단에 이유를 기록하고, 자동화 전에 더 안전한 후속 작업을 Backlog에 추가합니다.
8. DB planning 파일, schema/migration 변경, seed/sample 파일은 함께 커밋해 다른 agent도 같은 DB 상태를 재현할 수 있게 합니다.

이 규칙의 목적은 화면이 숨겨진 로컬 DB 수작업에 의존하지 않게 하는 것입니다. UI에 보이는 값은 추적된 schema, migration, seed/sample 파일만으로 재현 가능해야 합니다.

## Database Decision

- investModel의 목표 DB는 MySQL입니다.
- 현재 스타터 코드가 PostgreSQL/Drizzle 기반이므로 실제 런타임 전환은 별도 작업으로 진행합니다.
- MySQL 접속 정보, 비밀번호, 운영 DB URL, API key는 코드나 문서에 커밋하지 않습니다.
- 로컬, 스테이징, 프로덕션 DB는 환경 변수로 분리합니다.

## Domain Boundary

DB 모델은 다음 제품 경계를 지켜야 합니다.

- 사용자는 투자 성향, 주식/채권 비율, 레버리지 선호를 직접 설정하지 않습니다.
- 투자 성향과 운용 범위는 `model_versions`, `model_risk_profiles`, `portfolio_mandates`에 AI 모델의 성격으로 표현합니다.
- 실제 입금, 실제 계좌 연결, 실제 매매 주문은 아직 구현하지 않습니다.
- 초기 개발에서는 `mock_deposits`, `allocation_decisions`, `trade_intents`로 실제 자금 이동 전 단계를 표현합니다.
- `trade_intents`는 주문 실행 테이블이 아니라 주문 전 의사결정/시뮬레이션 의도 테이블입니다.
- 승인되지 않은 모델은 사용자 탐색 화면에 노출하지 않습니다.

## Required Tables

초기 DB 구현은 최소한 아래 도메인과 테이블의 흐름을 보존해야 합니다.

- Identity: `users`, `model_creators`
- Model marketplace: `investment_models`, `model_versions`, `model_risk_profiles`, `model_disclosures`, `portfolio_mandates`, `compliance_reviews`
- User investment state: `user_model_selections`, `mock_deposits`, `portfolios`, `portfolio_positions`
- Decision pipeline: `allocation_decisions`, `trade_intents`
- Market/news signals: `market_instruments`, `market_price_snapshots`, `news_sources`, `news_articles`, `news_traffic_snapshots`, `model_signal_events`
- Feed/audit: `feed_posts`, `audit_logs`

구현 과정에서 테이블을 줄이거나 합칠 수는 있지만, 도메인 책임이 사라지면 안 됩니다. 축소가 필요하면 체크리스트와 Decisions에 이유를 남깁니다.

## Naming Rules

- DB table과 column은 snake_case를 사용합니다.
- TypeScript 타입, interface, component 이름은 PascalCase/camelCase를 사용합니다.
- foreign key column은 `{referenced_entity}_id` 형태를 기본으로 합니다.
- 상태 column은 `status`를 기본 이름으로 쓰고, 필요한 경우 `review_status`, `verification_status`, `decision_status`처럼 도메인을 붙입니다.
- 금액은 `DECIMAL` 계열을 사용하고 float/double로 저장하지 않습니다.
- 시간 column은 `created_at`, `updated_at`, `deleted_at`, `reviewed_at`, `published_at`, `captured_at`처럼 이벤트 의미가 드러나게 둡니다.

## ORM And Migration Rules

- MySQL 전환 시 `drizzle.config.ts`, `lib/db/schema.ts`, `lib/db/drizzle.ts`, setup/seed/migration 스크립트를 함께 검토합니다.
- 기존 PostgreSQL migration을 그대로 MySQL에 복사하지 않습니다.
- migration은 재실행 가능성, foreign key 순서, seed 데이터 순서를 고려해 작성합니다.
- JSON column은 MySQL 지원 범위와 ORM 타입 매핑을 확인한 뒤 사용합니다.
- enum 사용 여부는 ORM과 migration 안정성을 보고 결정합니다. enum에 의존하지 않는다면 validation 계층에서 허용값을 강제합니다.

## UI Read Model Mapping

Figma 기반 화면 구현 시 아래 테이블을 우선 조회 후보로 봅니다.

- Home: `user_model_selections`, `mock_deposits`, `portfolios`, `model_signal_events`
- Discover Models: `investment_models`, `model_versions`, `model_risk_profiles`, `model_performance_snapshots`
- Realtime Signals: `model_signal_events`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots`
- Model Detail: `model_versions`, `portfolio_mandates`, `model_risk_profiles`, `model_disclosures`
- Feed Insights: `feed_posts`, `investment_models`, `users`

초기 UI는 mock 데이터로 시작할 수 있지만 mock 구조는 실제 DB 도메인과 크게 어긋나지 않게 만듭니다.

## Audit And Compliance

- 모델 상태 변경, 심사 결과, 위험 고지 수정, 사용자 모델 선택, mock 자금 상태 변경, 의사결정 생성은 감사 로그 대상으로 봅니다.
- 법률 검토가 필요한 문구는 `model_disclosures.requires_legal_review` 또는 체크리스트의 `legal_review` 이슈로 추적합니다.
- 성과 데이터는 수익 보장처럼 보이지 않게 `model_performance_snapshots`에 backtest 여부와 측정 시점을 함께 둡니다.
- 모델 파일 업로드/실행은 보안 검토 전까지 메타데이터 중심으로만 다룹니다.

## Do Not

- 실제 주문 실행 테이블을 조용히 추가하지 않습니다.
- 실제 결제/입금/브로커 계좌 연동을 mock 테이블 안에 섞어 구현하지 않습니다.
- 사용자가 모델의 투자 성향을 직접 바꾸는 column을 추가하지 않습니다.
- 수익률만 저장하고 위험, 변동성, 최대 손실, 고지 정보를 생략하지 않습니다.
- DB 비밀값, 운영 접속 URL, 개인 인증 정보를 커밋하지 않습니다.
