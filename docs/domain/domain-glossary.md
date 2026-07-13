# investModel Domain Glossary

<!--
This glossary fixes investModel's canonical domain terms so future classes, interfaces, API DTOs, database mappings, and UI labels do not drift.
It is a planning document only; it does not approve legal copy, real deposits, real brokerage orders, or model execution.
-->

## Purpose

investModel is a mobile-first marketplace where users choose an AI investment model, not a set of personal trading preferences. Each model owns its mandate, risk posture, asset scope, and limits. Early development stays mock-only: model discovery, signals, feed, model detail, and portfolio states must not imply real deposits, real orders, guaranteed returns, or legal approval.

This document is the human-readable companion to:

- `harness/domain-contract-harness.md`
- `harness/naming-harness.md`
- `harness/database-harness.md`
- `docs/database/invest-model.dbml`
- `docs/database/invest-model-mysql-plan.md`

## Canonical Terms

| Term | Korean name | Role | TypeScript name | DB tables | Screens | API/DTO connection | Do not confuse with |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `InvestmentModel` | 투자 AI 모델 | Creator가 등록하고 사용자가 탐색/선택하는 공개 모델 단위 | `InvestmentModel`, `ModelCardDto`, `ModelDetailDto` | `investment_models` | Discover Models, Model Detail, Home | `GET /api/models`, `GET /api/models/:id` | `Strategy`, `Bot`, `Advisor`, 사용자 투자 성향 |
| `ModelVersion` | 모델 버전 | 모델 설명, mandate, 위험, 성과 기준을 고정하는 버전 단위 | `ModelVersion`, `ModelVersionDto` | `model_versions` | Model Detail, review/admin views | `ModelDetailDto`, creator/admin model APIs | live 모델을 직접 덮어쓰는 mutable 설정 |
| `ModelRiskProfile` | 모델 위험 프로필 | 모델이 가진 위험 성향, 레버리지, 변동성, 손실 구간, 시장 범위 | `ModelRiskProfile`, `ModelRiskProfileDto` | `model_risk_profiles` | Discover Models, Model Detail | `ModelCardDto`, `ModelDetailDto` | 사용자가 직접 고르는 `UserPreference` |
| `PortfolioMandate` | 포트폴리오 운용 원칙 | 모델이 허용/금지하는 자산, 비율, 시장, 리밸런싱, 제한 조건 | `PortfolioMandate`, `PortfolioMandateDto` | `portfolio_mandates` | Model Detail, Home active model | `ModelDetailDto` | 사용자가 앱에서 수정하는 주식/채권 비율 |
| `ModelDisclosure` | 모델 고지 | 위험, 성과 기준, 제한, 법률 검토 필요 문구를 담는 고지 단위 | `ModelDisclosure`, `ModelDisclosureDto` | `model_disclosures` | Model Detail, Feed Insights | `ModelDetailDto` | Codex가 확정한 법률 문구 |
| `ComplianceReview` | 컴플라이언스 리뷰 | 모델, 버전, 고지, 공개 상태를 운영자가 검토한 기록 | `ComplianceReview`, `ComplianceReviewDto` | `compliance_reviews` | Admin/review flows | `POST /api/admin/models/:id/reviews` | 법률 적합성 최종 판단 |
| `ModelPerformanceSnapshot` | 모델 성과 스냅샷 | 특정 시점의 backtest/sample 성과와 측정 조건 | `ModelPerformanceSnapshot`, `ModelPerformanceSnapshotDto` | `model_performance_snapshots` | Discover Models, Model Detail | `ModelCardDto`, `ModelDetailDto` | 미래 수익 가능성 또는 수익 보장 |
| `UserModelSelection` | 사용자 모델 선택 | 사용자가 특정 모델 버전을 선택한 상태 | `UserModelSelection`, `ModelSelectionDto` | `user_model_selections` | Home, Portfolio | `POST /api/model-selections` | 사용자 투자 성향 설정 |
| `MockDeposit` | 가상 예치금 | 초기 MVP에서 실제 입금 대신 보여주는 시뮬레이션 자금 상태 | `MockDeposit`, `PortfolioSummaryDto` | `mock_deposits` | Home, Portfolio | `GET /api/portfolio/mock-summary` | 실제 입금, 결제, 계좌 잔액 |
| `Portfolio` | 포트폴리오 | 사용자 선택 모델과 mock 자산 상태를 묶은 포트폴리오 단위 | `Portfolio`, `PortfolioSummaryDto` | `portfolios`, `portfolio_positions` | Home, Portfolio | `GET /api/portfolio/mock-summary` | 실제 보유 자산 또는 증권 계좌 |
| `AllocationDecision` | 배분 의사결정 | 모델이 시장/뉴스/가격 신호를 보고 만든 시뮬레이션 배분 판단 | `AllocationDecision`, `AllocationDecisionDto` | `allocation_decisions` | Internal pipeline, Portfolio | future decision APIs | 확정 투자 조언 또는 주문 |
| `TradeIntent` | 주문 의도 | 실제 주문 전 단계의 시뮬레이션 주문 의도/정책 점검 결과 | `TradeIntent`, `TradeIntentDto` | `trade_intents` | Home activity, Portfolio | future decision APIs | 실제 주문, 체결, broker API 호출 |
| `SignalEvent` | 신호 이벤트 | 가격, 뉴스, 트래픽, 모델 관심도 기반의 관찰 신호 | `SignalEvent`, `SignalEventDto` | `model_signal_events`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots` | Realtime Signals, Home | `GET /api/signals` | 매수/매도 추천 |
| `FeedPost` | 피드 게시글 | 모델/시장/운영자가 제공하는 정보성 해설 또는 placeholder 고지 | `FeedPost`, `FeedPostDto` | `feed_posts` | Feed Insights | `GET /api/feed` | 투자 권유, 수익 보장 문구 |
| `AuditLog` | 감사 로그 | 중요한 상태 변경, 검토, 선택, mock 상태 변경의 추적 기록 | `AuditLog`, `AuditLogDto` | `audit_logs` | Admin/audit views | admin/internal APIs | 사용자용 알림 피드 |

## State Terms

| State group | Allowed values | Meaning |
| --- | --- | --- |
| `InvestmentModel.status` | `draft`, `pending_review`, `approved`, `live`, `paused`, `suspended`, `retired` | 모델 공개/심사/중지/폐기 상태. 사용자 탐색 화면은 기본적으로 `live` 또는 승인된 mock 모델만 노출한다. |
| `TradeIntent.status` | `draft`, `policy_checking`, `simulation_ready`, `blocked`, `archived` | 실제 주문 전 정책 점검과 시뮬레이션 상태. 어떤 값도 실제 주문 체결을 의미하지 않는다. |
| `MockDeposit.status` | `created`, `simulated_available`, `simulated_allocated`, `cancelled`, `archived` | mock 자금의 화면 표시 상태. 결제, 입금, 출금, 계좌 잔액을 의미하지 않는다. |
| `ComplianceReview.status` | `pending`, `approved`, `rejected`, `changes_requested` | 운영 검토 상태. 법률 전문가의 최종 법률 판단으로 표현하지 않는다. |

## Naming Rules

- Use `InvestmentModel`, not `Strategy`, `Bot`, or `Advisor`.
- Use `ModelRiskProfile`, not `RiskSetting`, when risk belongs to the model.
- Avoid `UserPreference` for investment behavior because users do not tune stock/bond ratio, leverage, or risk style in the MVP.
- Use `MockDeposit` whenever a value looks like money but is not real money.
- Use `TradeIntent` only for pre-order simulation; do not introduce `Order`, `Execution`, or `BrokerOrder` until the project has explicit financial-operation approval.
- Add `Dto` suffix for API response/request shapes, such as `ModelCardDto`, `SignalEventDto`, and `FeedPostDto`.
- Add `ViewModel` suffix only for UI-specific derived shapes.

## UI And API Mapping

| Screen | Primary terms | Mock files today | Future API |
| --- | --- | --- | --- |
| Home | `UserModelSelection`, `MockDeposit`, `Portfolio`, `SignalEvent`, `TradeIntent` | `lib/mock/invest-model-home.ts` | `GET /api/portfolio/mock-summary`, `GET /api/signals` |
| Discover Models | `InvestmentModel`, `ModelVersion`, `ModelRiskProfile`, `ModelPerformanceSnapshot` | `lib/mock/invest-model-discovery.ts` | `GET /api/models` |
| Realtime Signals | `SignalEvent`, `MarketInstrument`, `NewsArticle`, `NewsTrafficSnapshot` | `lib/mock/invest-model-signals.ts` | `GET /api/signals` |
| Model Detail | `InvestmentModel`, `ModelVersion`, `PortfolioMandate`, `ModelRiskProfile`, `ModelDisclosure` | to be added | `GET /api/models/:id` |
| Feed Insights | `FeedPost`, `InvestmentModel`, `ModelDisclosure` | `lib/mock/invest-model-feed.ts` | `GET /api/feed` |

## Prohibited Meanings

- Do not write UI or API copy that implies guaranteed return, loss prevention, or legal approval.
- Do not describe `SignalEvent` or `FeedPost` as a recommendation to buy, sell, hold, or rebalance.
- Do not describe `MockDeposit`, `Portfolio`, or `PortfolioPosition` as a real bank, brokerage, or cash balance.
- Do not let users directly configure risk appetite, leverage preference, stock/bond ratio, or asset allocation in the MVP.
- Do not execute uploaded model files or connect external paid data/brokerage APIs without a new reviewed task.
