# DBML Type Mapping

<!--
This document maps the canonical MySQL DBML tables to investModel TypeScript domain types and future API DTOs.
It helps agents keep database, backend, mock data, and mobile UI naming aligned before implementation.
-->

## Purpose

`docs/database/invest-model.dbml` is the canonical database planning source. `lib/domain/types.ts` is the first TypeScript domain contract draft. This mapping shows how DB rows should become domain types, API DTOs, and mobile read models without exposing raw database records directly.

## Mapping Rules

- Database tables and columns use `snake_case`; TypeScript domain types and DTOs use `PascalCase` and `camelCase`.
- Internal numeric `id` values stay inside the database and server boundary. Public APIs should expose stable public identifiers such as `publicId` when a public identifier exists.
- MySQL `decimal` values should be represented as strings in TypeScript DTOs unless a calculated UI-only percentage is intentionally rounded for display.
- DB rows are not API DTOs. API routes should map from DB rows into explicit DTOs such as `ModelCardDto`, `ModelDetailDto`, `SignalEventDto`, and `FeedPostDto`.
- `mock_deposits`, `allocation_decisions`, and `trade_intents` are mock or simulation boundaries in the MVP. They must not become payment, banking, brokerage, or live order execution models.
- Status string values should remain compatible with DBML notes and the TypeScript status unions.
- Do not introduce `Order`, `BrokerOrder`, or real-account types until the product receives explicit financial, legal, and security approval.

## Table To Type Map

| DBML table | Main columns | TypeScript domain type | Future DTO/API surface | Notes |
| --- | --- | --- | --- | --- |
| `users` | `public_id`, `email`, `display_name`, `role`, `status` | `User` pending | `UserDto`, auth/profile/RBAC APIs | Keep identity and RBAC separate from model selection preferences. |
| `model_creators` | `user_id`, `display_name`, `verification_status` | `ModelCreator` pending | `CreatorDto`, creator profile APIs | Creator verification is operational state, not investment performance approval. |
| `investment_models` | `slug`, `name`, `status`, `visibility`, `current_version_id` | `InvestmentModel` | `ModelCardDto`, `ModelDetailDto`; `GET /api/models`, `GET /api/models/:id` | Public marketplace model unit. Do not rename to Strategy, Bot, or Advisor. |
| `model_versions` | `version_label`, `strategy_summary`, `target_markets`, `model_artifact_status` | `ModelVersion` | `ModelDetailDto`; `GET /api/models/:id` | Version freezes strategy, artifact, and display context. MVP default is metadata-only. |
| `model_risk_profiles` | `risk_level`, `leverage_allowed`, `derivative_allowed`, `risk_summary` | `ModelRiskProfile` | `ModelCardDto`, `ModelDetailDto` | Risk belongs to the model. Users do not edit risk settings in the MVP. |
| `model_disclosures` | `disclosure_type`, `title`, `body`, `requires_legal_review` | `ModelDisclosure` | `ModelDetailDto`, admin disclosure review APIs | Legal-placeholder text is not final legal advice. |
| `portfolio_mandates` | `allowed_markets`, `allowed_asset_classes`, `forbidden_assets`, `leverage_policy` | `PortfolioMandate` | `ModelDetailDto` | Defines what a model may and may not invest in. `user_override_allowed` should remain false for MVP. |
| `compliance_reviews` | `review_type`, `status`, `reviewer_user_id`, `notes` | `ComplianceReview` | Admin review DTOs | Review workflow only. Do not present as legal or financial suitability judgment. |
| `model_performance_snapshots` | `period_label`, `cumulative_return_pct`, `volatility_pct`, `max_drawdown_pct`, `is_backtest` | `ModelPerformanceSnapshot` pending | `ModelCardDto`, `ModelDetailDto` | Always preserve backtest/live measurement context and date. |
| `market_instruments` | `symbol`, `asset_type`, `market`, `currency`, `is_leveraged` | `MarketInstrument` pending | `SignalEventDto`, `PortfolioPositionDto` | Shared market identity for signals, positions, and simulated intents. |
| `user_model_selections` | `user_id`, `model_id`, `model_version_id`, `status`, `risk_acknowledged_at` | `UserModelSelection` | `ModelSelectionDto`, `PortfolioSummaryDto`; `POST /api/model-selections` | Represents selecting a model version, not configuring user investment preferences. |
| `mock_deposits` | `amount`, `currency`, `status`, `source_type` | `MockDeposit` | `PortfolioSummaryDto`, mock balance APIs | Simulated funds only. No payment, withdrawal, bank, or brokerage integration. |
| `portfolios` | `model_selection_id`, `cash_balance`, `total_market_value`, `status` | `Portfolio` | `PortfolioSummaryDto` | Mock portfolio state linked to a selected model. |
| `portfolio_positions` | `portfolio_id`, `instrument_id`, `quantity`, `average_price`, `market_value` | `PortfolioPosition` pending | `PortfolioPositionDto`, `PortfolioSummaryDto` | Position values are read-model data, not proof of real holdings. |
| `allocation_decisions` | `model_version_id`, `portfolio_id`, `decision_status`, `rationale` | `AllocationDecision` | Internal decision DTOs | Simulated model analysis before trade intent generation. |
| `trade_intents` | `allocation_decision_id`, `instrument_id`, `intent_type`, `target_quantity`, `status` | `TradeIntent` | Internal simulation DTOs | Pre-order simulation only. It is not an executed order or broker API request. |
| `market_price_snapshots` | `instrument_id`, `provider`, `price`, `volume`, `captured_at` | `MarketPriceSnapshot` pending | `SignalEventDto`, market context DTOs | External provider details should remain traceable and mockable. |
| `news_sources` | `name`, `source_type`, `base_url`, `is_active` | `NewsSource` pending | News/source admin DTOs | Supports source governance and provenance. |
| `news_articles` | `news_source_id`, `title`, `url`, `summary`, `published_at` | `NewsArticle` pending | `SignalEventDto`, feed context DTOs | Article summaries should not become direct investment advice. |
| `news_traffic_snapshots` | `news_article_id`, `keyword`, `traffic_score`, `mention_count` | `NewsTrafficSnapshot` pending | `SignalEventDto`, traffic trend DTOs | Traffic signals explain context, not buy/sell instructions. |
| `model_signal_events` | `model_version_id`, `signal_type`, `title`, `summary`, `score` | `SignalEvent` | `SignalEventDto`; `GET /api/signals` | Observed model input event. Not a recommendation. |
| `feed_posts` | `model_id`, `author_user_id`, `post_type`, `title`, `visibility` | `FeedPost` | `FeedPostDto`; `GET /api/feed` | Informational commentary only. No return guarantees or trading encouragement. |
| `audit_logs` | `actor_user_id`, `entity_type`, `entity_id`, `action`, `before_json`, `after_json` | `AuditLog` pending | `AuditLogDto`, internal admin APIs | Required for review, state changes, and traceability. |

## Initial DTO Inventory

| DTO | Source tables | First API route | Mobile surface |
| --- | --- | --- | --- |
| `ModelCardDto` | `investment_models`, `model_versions`, `model_risk_profiles`, `model_performance_snapshots` | `GET /api/models` | Discover Models |
| `ModelDetailDto` | `investment_models`, `model_versions`, `portfolio_mandates`, `model_risk_profiles`, `model_disclosures`, `model_performance_snapshots` | `GET /api/models/:id` | Model Detail |
| `SignalEventDto` | `model_signal_events`, `market_instruments`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots` | `GET /api/signals` | Realtime Signals |
| `FeedPostDto` | `feed_posts`, `investment_models`, `users` | `GET /api/feed` | Feed Insights |
| `ModelSelectionDto` | `user_model_selections`, `investment_models`, `model_versions` | `POST /api/model-selections` | Model selection flow |
| `PortfolioSummaryDto` | `user_model_selections`, `mock_deposits`, `portfolios`, `portfolio_positions` | `GET /api/portfolio` | Home and portfolio summary |

## Type Gaps To Close Later

The current `lib/domain/types.ts` intentionally covers only the first domain contract slice. Later backend work should add small, reviewed types for `User`, `ModelCreator`, `ModelPerformanceSnapshot`, `MarketInstrument`, `PortfolioPosition`, `MarketPriceSnapshot`, `NewsSource`, `NewsArticle`, `NewsTrafficSnapshot`, and `AuditLog` before those areas receive API implementation.
