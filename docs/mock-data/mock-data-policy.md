# Mock Data Policy

<!--
This document defines how investModel mock data is named, shaped, stored, validated, and later replaced by API or DB-backed data.
It prevents mock screens from looking like real deposits, real brokerage holdings, real orders, guaranteed returns, or legal advice.
-->

## Purpose

Mock data exists to build and verify the mobile/PWA MVP before real database, market data, account, or model-execution integrations exist. It should help screens feel complete while making the mock boundary unmistakable to users, developers, and future agents.

## IS-004 Data Boundary

`IS-004` remains open until the owner confirms realtime search volume, news
traffic, AI-model attention, model inclusion events, data vendors, collection
cadence, API keys, and terms-of-use review. Until then, investModel data work is
limited to deterministic seed, fixture, mock ingestion, and DB read-model data.

Allowed before `IS-004` is resolved:

- tracked TypeScript fixtures under `lib/mock/**`
- reviewed SQL seed/sample files under `docs/database/seeds/**` and
  `docs/database/samples/**`
- DB-backed read models populated only from those tracked seed/sample rows
- mock ingestion jobs that append synthetic `SignalEvent` score snapshots and
  label their inputs as `mock_seed`, `scheduled_mock`, or
  `observed_placeholder`
- UI, DTO, and API metadata flags that explicitly say data is mock,
  simulated, backtest, placeholder, informational, or observed-placeholder

Blocked before `IS-004` is resolved:

- browser search-volume providers, realtime news-traffic providers, market data
  vendors, AI provider attention feeds, paid APIs, or any secret-backed external
  data client
- real bank, broker, exchange, payment, or account-linking data
- real deposits, withdrawals, balances, custody, orders, executions, fills,
  settlement, or brokerage instructions
- model ranking or signal copy that reads as buy, sell, hold, rebalance,
  suitability, legal approval, or personalized financial advice
- fallback behavior that silently replaces missing seed/mock rows with live
  external data

If a task needs any blocked data source or secret, stop implementation and link
the work to `IS-004` or a new review issue instead of adding a hidden adapter.

## Current Mock Files

| File | Primary screen | First DTO target | Main DB alignment |
| --- | --- | --- | --- |
| `lib/mock/invest-model-home.ts` | Home | `PortfolioSummaryDto` | `user_model_selections`, `mock_deposits`, `portfolios`, `portfolio_positions`, `model_signal_events`, `trade_intents` |
| `lib/mock/invest-model-discovery.ts` | Discover Models | `ModelCardDto` | `investment_models`, `model_versions`, `model_risk_profiles`, `model_performance_snapshots` |
| `lib/mock/invest-model-signals.ts` | Realtime Signals | `SignalEventDto` | `model_signal_events`, `market_instruments`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots` |
| `lib/mock/invest-model-feed.ts` | Feed Insights | `FeedPostDto` | `feed_posts`, `investment_models`, `users`, `model_disclosures` |

## Naming Rules

Use names that reveal development-only or simulation-only meaning:

- `mockBalance`
- `simulatedMarketValue`
- `backtestReturn`
- `placeholderDisclosure`
- `observedSignal`
- `preOrderSimulation`
- `mockPortfolio`
- `samplePosition`

Do not use names that imply production finance:

- `realBalance`
- `availableCash`
- `bankAccount`
- `brokerAccount`
- `orderExecution`
- `tradeFill`
- `guaranteedReturn`
- `legalApproval`

## Required Context Fields

Every mock object that looks like money, performance, market data, or trade activity should include one or more context fields.

| Data category | Required context | Example values |
| --- | --- | --- |
| Money-like values | `context`, `sourceType`, or explicit label | `mock`, `simulated`, `placeholder` |
| Performance values | `context`, `periodLabel`, `measuredAt`, `isBacktest` | `backtest`, `sample`, `placeholder` |
| Signals | `dataContext`, `sourceLabel`, `capturedAt` | `mock`, `observed_placeholder` |
| Trade-like activity | `dataContext`, `status`, `blockedReason` | `pre_order_simulation`, `blocked`, `pending_policy_check` |
| Legal/risk copy | `requiresLegalReview`, `disclosureType`, `reviewLabel` | `true`, `legal_placeholder`, `review required` |

## DTO Alignment

Mock data should be easy to map into the DTOs in `docs/api/dto-contract.md`.

| DTO | Mock data requirement |
| --- | --- |
| `ModelCardDto` | Include model/version public ids, status, risk, target markets, asset labels, backtest metrics, review label, and notices. |
| `ModelDetailDto` | Include model summary, model-owned mandate, risk profile, disclosures, performance context, and `userOverrideAllowed: false`. |
| `SignalEventDto` | Include signal public id, model version public id, signal type, score, source label, captured time, and mock/observed context. |
| `FeedPostDto` | Include post id, type, title, body, tags, optional model link, and informational/mock context. |
| `ModelSelectionDto` | Include selected model/version ids and selection status without user preference fields. |
| `PortfolioSummaryDto` | Include mock balance, simulated market value, positions, recent signals, and pre-order simulation trade intents. |

## File Boundary Rules

- `lib/mock/**` must not import database clients, payment clients, brokerage clients, paid market-data clients, or secrets.
- Mock files may import TypeScript types only after DTO/domain types are stable.
- Mock data should remain deterministic. Do not fetch live news, prices, or account data from mock modules.
- Mock values should be realistic enough for layout testing but visibly labeled as mock, simulated, sample, backtest, or placeholder.
- Large future mock datasets should move to JSON fixtures only when a loader strategy is defined.

## Replacement Path

Mock data should be replaceable in this order:

1. Keep screen components consuming DTO-like shapes or view models.
2. Add API routes that return the same DTO shape from mock data.
3. Add mapping functions from DB rows to DTOs.
4. Replace mock route internals with DB-backed reads after schema and RBAC are ready.
5. Keep mock fixtures for tests, empty states, loading states, and local demos.

Do not replace mock data with real financial integrations until the feature review matrix explicitly permits the work.

## Review Checklist

Before adding or editing mock data:

- Confirm the matching screen and DTO target.
- Confirm public ids are used instead of internal numeric ids in UI/API-shaped data.
- Confirm every money-like value says mock or simulated.
- Confirm every performance value says backtest, sample, or placeholder.
- Confirm no field implies a real account, real balance, broker order, execution, fill, or settlement.
- Confirm signals remain observed inputs and do not become recommendations.
- Confirm `TradeIntent` entries are pre-order simulation only.
- Confirm pending-review or suspended models are not shown in public discovery data unless testing hidden-state behavior.

## Future Work

- `BK-130` should create a richer mock AI model catalog using this policy.
- `BK-131` should create mock portfolio and mock deposit data using this policy.
- `BK-132` should expand mock signals and feed data using this policy.
- `BK-133` should define shared loaders so mock data can feed UI, API routes, and tests without copy-paste.
