# API DTO Contract

<!--
This document defines the first response DTO shapes for investModel API work.
It keeps frontend screens, backend routes, mock data, and DB mappings aligned without exposing raw DB rows.
-->

## Contract Rules

- DTO names must use the `Dto` suffix and must not replace domain names such as `InvestmentModel`, `PortfolioMandate`, `TradeIntent`, or `MockDeposit`.
- DTOs are API/view contracts, not database rows. Do not expose internal numeric `id` values.
- Public identifiers use `publicId`, `modelPublicId`, `modelVersionPublicId`, or route-specific id fields.
- Money-like or decimal values use strings, for example `"24800.00"`, to avoid precision loss.
- Percentages may use numbers only when they are rounded display metrics. Raw decimal percentages should remain strings.
- Every money-like, performance-like, or trade-like DTO must include mock/backtest/simulated context fields.
- No DTO may imply real deposits, real balances, brokerage orders, executions, fills, or legal suitability.

## Shared Value Types

| Type name | Shape | Notes |
| --- | --- | --- |
| `MoneyDto` | `{ amount: string; currency: string; display: string; context: 'mock' \| 'simulated' \| 'placeholder' }` | Used for mock balances and simulated portfolio values only. |
| `PercentMetricDto` | `{ value: number; display: string; context: 'backtest' \| 'simulated' \| 'placeholder'; measuredAt?: string }` | Used for rounded UI percentages. |
| `RiskBadgeDto` | `{ level: 'low' \| 'medium' \| 'high' \| 'very_high'; label: string; tone: 'low' \| 'medium' \| 'high' \| 'danger' }` | Risk belongs to the model, not the user. |
| `DisclosureSummaryDto` | `{ title: string; body: string; type: 'risk' \| 'performance' \| 'limitation' \| 'legal_placeholder'; requiresLegalReview: boolean }` | Placeholder text must stay visibly review-bound. |
| `PolicyNoticeDto` | `{ code: string; severity: 'info' \| 'warning' \| 'blocked'; message: string }` | Used for mock, legal, security, or financial-operation boundaries. |

## `ModelCardDto`

Used by `GET /api/models` and the Discover Models screen.

```ts
interface ModelCardDto {
  modelPublicId: string;
  modelVersionPublicId: string;
  slug: string;
  name: string;
  shortDescription: string;
  creatorName: string;
  status: 'approved' | 'live';
  risk: RiskBadgeDto;
  targetMarkets: string[];
  assetClassLabels: string[];
  leverageAllowed: boolean;
  backtestReturn: PercentMetricDto;
  maxDrawdown: PercentMetricDto;
  reviewLabel: string;
  dataContext: 'mock' | 'backtest_placeholder';
  notices: PolicyNoticeDto[];
}
```

Source tables: `investment_models`, `model_versions`, `model_risk_profiles`, `model_performance_snapshots`.

Required UI coverage:

- Model name and short description
- Creator name
- Risk badge
- Backtest/performance labels with placeholder context
- Market and asset universe chips
- Review/live status

## `ModelDetailDto`

Used by `GET /api/models/:id` and the Model Detail screen.

```ts
interface ModelDetailDto {
  modelPublicId: string;
  modelVersionPublicId: string;
  slug: string;
  name: string;
  creatorName: string;
  status: 'approved' | 'live';
  strategySummary: string;
  targetMarkets: string[];
  assetUniverseSummary: string;
  modelArtifactStatus: 'metadata_only' | 'uploaded' | 'quarantined' | 'approved' | 'rejected';
  risk: RiskBadgeDto;
  mandate: {
    allowedMarkets: string[];
    allowedAssetClasses: string[];
    forbiddenAssets: string[];
    leveragePolicy: string;
    rebalancePolicy: string;
    userOverrideAllowed: false;
  };
  disclosures: DisclosureSummaryDto[];
  performance: {
    cumulativeReturn: PercentMetricDto;
    volatility: PercentMetricDto;
    maxDrawdown: PercentMetricDto;
    benchmarkSymbol?: string;
  };
  notices: PolicyNoticeDto[];
}
```

Source tables: `investment_models`, `model_versions`, `portfolio_mandates`, `model_risk_profiles`, `model_disclosures`, `model_performance_snapshots`.

Safety requirements:

- `userOverrideAllowed` is false in the MVP.
- `modelArtifactStatus` is normally `metadata_only`; uploaded model execution remains blocked.
- Disclosure copy must not be presented as final legal approval unless reviewed outside Codex.

## `SignalEventDto`

Used by `GET /api/signals`, Realtime Signals, and Home signal preview.

```ts
interface SignalEventDto {
  signalPublicId: string;
  modelVersionPublicId: string;
  linkedModelName: string;
  signalType: 'news_traffic' | 'price_trend' | 'macro' | 'risk';
  title: string;
  summary: string;
  score: number;
  scoreDisplay: string;
  sourceLabel: string;
  sourceUrl?: string;
  capturedAt: string;
  dataContext: 'mock' | 'observed_placeholder';
  notices: PolicyNoticeDto[];
}
```

Source tables: `model_signal_events`, `market_instruments`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots`.

Safety requirements:

- Signals are observed inputs only.
- Do not include fields named `recommendation`, `order`, `execution`, or `brokerAction`.
- A signal must not create live `TradeIntent` records in the MVP.

## `FeedPostDto`

Used by `GET /api/feed` and the Feed Insights screen.

```ts
interface FeedPostDto {
  postPublicId: string;
  modelPublicId?: string;
  linkedModelName?: string;
  authorDisplayName?: string;
  postType: 'model_note' | 'market_context' | 'risk_note' | 'review_note';
  title: string;
  body: string;
  tags: string[];
  publishedAt?: string;
  dataContext: 'mock' | 'informational_placeholder';
  notices: PolicyNoticeDto[];
}
```

Source tables: `feed_posts`, `investment_models`, `users`, `model_disclosures`.

Safety requirements:

- Feed posts are informational.
- Do not guarantee returns, encourage securities trading, or finalize legal/financial advice.

## `ModelSelectionDto`

Used by `POST /api/model-selections`, Model Detail selection flow, and Home selected model state.

```ts
interface ModelSelectionDto {
  selectionPublicId: string;
  userPublicId: string;
  modelPublicId: string;
  modelVersionPublicId: string;
  modelName: string;
  status: 'active' | 'paused' | 'revoked';
  riskAcknowledgedAt?: string;
  selectedAt: string;
  selectionContext: 'mock' | 'simulated';
  notices: PolicyNoticeDto[];
}
```

Source tables: `user_model_selections`, `investment_models`, `model_versions`, `model_risk_profiles`.

Safety requirements:

- Selection is not a personal risk-preference setup flow.
- No stock/bond ratio, leverage preference, or direct allocation fields are allowed.
- Selection does not imply funding, account linking, or live trading.

## `PortfolioSummaryDto`

Used by `GET /api/portfolio/mock-summary`, Home, and future Portfolio screen.

```ts
interface PortfolioSummaryDto {
  portfolioPublicId: string;
  userPublicId: string;
  modelSelectionPublicId: string;
  selectedModel: {
    modelPublicId: string;
    modelVersionPublicId: string;
    name: string;
    risk: RiskBadgeDto;
  };
  mockBalance: MoneyDto;
  simulatedMarketValue: MoneyDto;
  simulatedTotalValue: MoneyDto;
  positions: Array<{
    instrumentPublicId: string;
    symbol: string;
    name: string;
    assetType: 'stock' | 'etf' | 'bond' | 'cash' | 'index';
    allocationDisplay: string;
    marketValue: MoneyDto;
    dataContext: 'mock' | 'simulated';
  }>;
  recentSignals: SignalEventDto[];
  recentTradeIntents: Array<{
    tradeIntentPublicId: string;
    title: string;
    status: 'pending_policy_check' | 'approved_for_simulation' | 'blocked' | 'cancelled';
    dataContext: 'pre_order_simulation';
    blockedReason?: string;
  }>;
  notices: PolicyNoticeDto[];
}
```

Source tables: `user_model_selections`, `mock_deposits`, `portfolios`, `portfolio_positions`, `market_instruments`, `model_signal_events`, `trade_intents`.

Safety requirements:

- `mockBalance`, `simulatedMarketValue`, and `simulatedTotalValue` are not real account balances.
- `recentTradeIntents` are pre-order simulation records only.
- Do not add bank, broker, account number, execution, fill, or settlement fields.

## Implementation Order

1. Add TypeScript DTO interfaces after route and screen mapping are stable.
2. Keep DTOs near API or domain boundary code, not inside UI components.
3. Map mock data into DTOs before implementing DB-backed routes.
4. Add runtime validation when API routes are implemented.
5. Add error DTOs after `BK-127` defines auth and policy-blocked responses.
