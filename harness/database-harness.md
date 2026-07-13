# Database Harness

<!--
이 하네스는 investModel의 데이터베이스 설계, MySQL 전환, ORM/마이그레이션 작업에서 반드시 따라야 하는 기준을 관리합니다.
AI가 DB 관련 코드를 작성하기 전 이 파일과 canonical DBML/SQL 산출물을 확인하도록 하기 위한 작업 기준입니다.
-->

## Canonical Sources

DB 관련 작업 전 아래 파일을 먼저 확인한다.

- DB 기획안: `docs/database/invest-model-mysql-plan.md`
- dbdiagram DBML: `docs/database/invest-model.dbml`
- MySQL SQL 스크립트: `docs/database/invest-model.mysql.sql`
- ERD 이미지: `dberd/invest-model-erd.png`
- dbdiagram 렌더링 캡처: `dberd/invest-model-dbdiagram-render.png`

DB 구조의 기준은 `docs/database/invest-model.dbml`을 우선한다. SQL, ORM schema, migration은 이 DBML과 불일치하지 않게 작성한다.

## Database Decision

- investModel의 목표 DB는 MySQL이다.
- 현재 스타터 코드는 PostgreSQL/Drizzle 기반이므로 실제 런타임 전환은 별도 작업으로 진행한다.
- MySQL 접속 정보, 비밀번호, 운영 DB URL, API key는 코드나 문서에 커밋하지 않는다.
- 로컬/스테이징/프로덕션 DB는 환경 변수로 분리한다.

## Domain Boundary

DB 모델은 다음 제품 경계를 지켜야 한다.

- 사용자는 투자 성향, 주식/채권 비율, 레버리지 선호를 직접 설정하지 않는다.
- 투자 성향과 운용 범위는 `model_versions`, `model_risk_profiles`, `portfolio_mandates`에 포함된 AI 모델의 성격으로 표현한다.
- 실제 입금, 실제 계좌 연결, 실제 매매 주문은 아직 구현하지 않는다.
- 초기 개발에서는 `mock_deposits`, `allocation_decisions`, `trade_intents`로 실제 자금 이동 전 단계를 표현한다.
- `trade_intents`는 주문 실행 테이블이 아니라 주문 전 의사결정/시뮬레이션 의도 테이블이다.
- 모델 제작자, 일반 사용자, 운영자 권한은 DB와 API에서 분리한다.
- 승인되지 않은 모델은 사용자 탐색 화면에 노출되지 않아야 한다.

## Required Tables

초기 DB 구현은 최소한 아래 도메인과 테이블의 의미를 보존해야 한다.

- Identity: `users`, `model_creators`
- Model marketplace: `investment_models`, `model_versions`, `model_risk_profiles`, `model_disclosures`, `portfolio_mandates`, `compliance_reviews`
- User investment state: `user_model_selections`, `mock_deposits`, `portfolios`, `portfolio_positions`
- Decision pipeline: `allocation_decisions`, `trade_intents`
- Market/news signals: `market_instruments`, `market_price_snapshots`, `news_sources`, `news_articles`, `news_traffic_snapshots`, `model_signal_events`
- Feed/audit: `feed_posts`, `audit_logs`

구현 과정에서 테이블을 줄이거나 합칠 수는 있지만, 위 도메인 책임이 사라지면 안 된다. 축소가 필요하면 체크리스트와 결정 기록에 이유를 남긴다.

## Naming Rules

- DB 테이블과 컬럼은 snake_case를 사용한다.
- TypeScript 타입, 인터페이스, 컴포넌트명은 기존 프로젝트 기준에 맞춰 PascalCase/camelCase를 사용한다.
- 외래키 컬럼은 `{referenced_entity}_id` 형태를 기본으로 한다.
- 상태 컬럼은 `status`를 기본 이름으로 쓰고, 필요한 경우 `review_status`, `verification_status`, `decision_status`처럼 도메인을 붙인다.
- 금액은 `DECIMAL` 계열을 사용하고 float/double로 저장하지 않는다.
- 시간 컬럼은 `created_at`, `updated_at`, `deleted_at`, `reviewed_at`, `published_at`, `captured_at`처럼 이벤트 의미가 드러나게 쓴다.

## ORM And Migration Rules

- MySQL 전환 시 `drizzle.config.ts`, `lib/db/schema.ts`, `lib/db/drizzle.ts`, setup/seed/migration 스크립트를 함께 검토한다.
- 기존 PostgreSQL migration을 그대로 MySQL에 재사용하지 않는다.
- migration은 재실행 가능성, 외래키 순서, seed 데이터 의존성을 고려해 작성한다.
- JSON 컬럼은 MySQL 지원 범위와 ORM 타입 매핑을 확인한 뒤 사용한다.
- enum 사용 여부는 ORM과 migration 안정성을 보고 결정한다. enum을 쓰지 않는다면 check/validation 계층에서 허용값을 강제한다.
- DB 변경 뒤에는 타입체크와 가능한 범위의 migration 검증을 수행한다.

## UI Read Model Mapping

Figma 기반 화면 구현 시 아래 테이블을 우선 조회 후보로 삼는다.

- Home: `user_model_selections`, `mock_deposits`, `portfolios`, `model_signal_events`
- Discover Models: `investment_models`, `model_versions`, `model_risk_profiles`, `model_performance_snapshots`
- Realtime Signals: `model_signal_events`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots`
- Model Detail: `model_versions`, `portfolio_mandates`, `model_risk_profiles`, `model_disclosures`
- Feed Insights: `feed_posts`, `investment_models`, `users`

초기 UI는 mock 데이터로 시작할 수 있지만, mock 데이터 구조도 실제 DB 도메인과 크게 어긋나지 않게 만든다.

## Audit And Compliance

- 모델 상태 변경, 심사 결과, 위험 고지 수정, 사용자 모델 선택, mock 자금 상태 변경, 의사결정 생성은 감사 로그 대상으로 본다.
- 법률 검토가 필요한 문구는 `model_disclosures.requires_legal_review` 또는 체크리스트의 `legal_review` 이슈로 추적한다.
- 성과 데이터는 수익 보장처럼 보이지 않게 `model_performance_snapshots`에 backtest 여부와 측정 시점을 함께 둔다.
- 모델 파일 업로드/실행은 보안 검토 전까지 메타데이터 중심으로만 다룬다.

## Do Not

- 실제 주문 실행 테이블을 조용히 추가하지 않는다.
- 실제 결제/입금/브로커 계좌 연동을 mock 테이블 뒤에 숨겨 구현하지 않는다.
- 사용자가 모델의 투자 성향을 직접 바꾸는 컬럼을 추가하지 않는다.
- 수익률만 저장하고 위험, 변동성, 최대낙폭, 고지 정보를 생략하지 않는다.
- DB 비밀값, 운영 접속 URL, 개인 인증 정보를 커밋하지 않는다.
