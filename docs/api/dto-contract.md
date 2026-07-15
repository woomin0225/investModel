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

## `SignalDetailDto`

Used by future `GET /api/signals/:signalId` and the Signal Detail screen.

```ts
interface SignalDetailDto {
  signalPublicId: string;
  modelVersionPublicId: string;
  linkedModelName: string;
  signalType: 'news_traffic' | 'price_trend' | 'macro' | 'risk';
  title: string;
  summary: string;
  capturedAt: string;
  dataContext: 'mock' | 'observed_placeholder';
  currentScore: {
    score: number;
    scoreDisplay: string;
    rank?: number;
    rankDisplay?: string;
    previousScore?: number;
    previousRank?: number;
    deltaDisplay?: string;
    updatedAt: string;
    context: 'mock_score' | 'observed_placeholder_score';
  };
  scoreBreakdown: Array<{
    factor:
      | 'model_attention'
      | 'news_traffic'
      | 'search_traffic'
      | 'price_trend'
      | 'risk_alert'
      | 'portfolio_inclusion';
    label: string;
    rawValueDisplay: string;
    normalizedScore: number;
    weight: number;
    contributionDisplay: string;
    evidenceLabel: string;
    evidenceContext: 'mock' | 'observed_placeholder';
  }>;
  scoreHistory: Array<{
    capturedAt: string;
    score: number;
    rank?: number;
    sourceCountDisplay: string;
    context: 'mock_score' | 'observed_placeholder_score';
  }>;
  relatedNews: Array<{
    sourceName: string;
    title: string;
    sourceUrl?: string;
    publishedAt?: string;
    trafficLabel: string;
    dataContext: 'mock' | 'observed_placeholder';
  }>;
  priceTrend?: {
    instrumentPublicId: string;
    symbol: string;
    direction: 'up' | 'down' | 'flat' | 'volatile';
    changeDisplay: string;
    capturedAt: string;
    dataContext: 'mock' | 'observed_placeholder';
  };
  relatedModels: Array<{
    modelPublicId: string;
    modelVersionPublicId: string;
    name: string;
    attentionLabel: string;
    dataContext: 'mock' | 'observed_placeholder';
  }>;
  sourceAttribution: {
    primarySourceLabel: string;
    sourceUrl?: string;
    observedWindowLabel: string;
    generatedBy: 'mock_seed' | 'mock_ingestion' | 'system_observed_placeholder';
  };
  notices: PolicyNoticeDto[];
}
```

Source tables: `model_signal_events`, `market_instruments`, `market_price_snapshots`, `news_articles`, `news_traffic_snapshots`, future score snapshot/input tables from `BK-266`, and model/version relation tables.

Safety requirements:

- Detail score fields describe observed/mock ranking context only.
- Do not include fields named `recommendation`, `tradeAction`, `order`, `execution`, `fill`, `brokerAction`, or `rebalanceInstruction`.
- `relatedModels` means models that observed or referenced the SignalEvent; it must not imply those models recommend a user action.
- `sourceUrl` is optional and must never require external paid API keys during seed/mock ingestion.
- Missing, hidden, or inaccessible records use not-found/unavailable behavior and do not reveal private record existence.

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
- List DTOs do not include user-scoped like, save, read, or comment action state.

## `FeedCommentDto`

Used by `POST /api/feed/:postId/comments`, `POST /api/feed/:postId/comments/:commentId/replies`, and Feed Detail comment threads.

```ts
interface FeedCommentDto {
  commentPublicId: string;
  postPublicId: string;
  parentCommentPublicId?: string;
  authorDisplayName: string;
  body: string;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt?: string;
  replyCount: number;
  replies?: FeedCommentDto[];
  dataContext: 'mock' | 'informational_placeholder';
  notices: PolicyNoticeDto[];
}
```

Source tables: future `feed_post_comments` from `BK-293`, `feed_posts`, `users`.

Safety requirements:

- Comment ids are public ids only; internal numeric ids must not be exposed.
- Comment body must pass validation, length limits, and moderation-ready status handling before display.
- Hidden, deleted, or inaccessible comments must not reveal private moderation details.
- Comments are informational discussion only and must not become personalized advice, legal judgment, or trading instructions.

## `FeedReactionStateDto`

Used by Feed Detail and feed action endpoints for the signed-in user's post state.

```ts
interface FeedReactionStateDto {
  userPublicId: string;
  postPublicId: string;
  liked: boolean;
  saved: boolean;
  read: boolean;
  likeCount: number;
  commentCount: number;
  savedAt?: string;
  readAt?: string;
  updatedAt: string;
  dataContext: 'mock' | 'informational_placeholder';
}
```

Source tables: future `feed_post_reactions`, `feed_post_saves`, and `feed_post_reads` from `BK-293`, `feed_post_comments`, `feed_posts`, `users`.

Safety requirements:

- `liked`, `saved`, and `read` are user-scoped UI state only.
- Aggregate counts must not reveal hidden comments, private posts, or inaccessible user actions.
- No reaction field may imply suitability, recommendation strength, or order intent.

## `FeedPostDetailDto`

Used by `GET /api/feed/:postId` and Feed Detail.

```ts
interface FeedPostDetailDto {
  postPublicId: string;
  modelPublicId?: string;
  linkedModelName?: string;
  relatedSignalPublicIds: string[];
  authorDisplayName?: string;
  postType: 'model_note' | 'market_context' | 'risk_note' | 'review_note';
  title: string;
  body: string;
  tags: string[];
  publishedAt?: string;
  dataContext: 'mock' | 'informational_placeholder';
  sourceAttribution: {
    sourceLabel: string;
    sourceUrl?: string;
    reviewedBy?: string;
    reviewState: 'mock_reviewed' | 'review_placeholder' | 'requires_review';
  };
  userState: FeedReactionStateDto;
  comments: FeedCommentDto[];
  recentLikeRanking?: {
    rank: number;
    windowLabel: string;
    likeCount: number;
    context: 'mock' | 'informational_placeholder';
  };
  notices: PolicyNoticeDto[];
}
```

Source tables: `feed_posts`, `investment_models`, `users`, `model_disclosures`, future `feed_post_comments`, `feed_post_reactions`, `feed_post_saves`, and `feed_post_reads` from `BK-293`.

Safety requirements:

- Detail content is informational commentary, not investment advice.
- `recentLikeRanking` is a popularity/context indicator only; it must not imply better model quality or expected return.
- `sourceUrl` is optional and must never require external paid API keys during seed/mock ingestion.
- Missing, hidden, unpublished, admin-only, or inaccessible posts use not-found/unavailable behavior and do not reveal private record existence.
- Do not include fields named `recommendation`, `tradeAction`, `order`, `execution`, `fill`, `brokerAction`, `rebalanceInstruction`, or `TradeIntent`.

## `FeedPostRankingDto`

Used by `GET /api/feed/rankings` and future Feed popularity modules.

```ts
interface FeedPostRankingDto extends FeedPostDto {
  rank: number;
  likeCount: number;
  windowLabel: string;
  rankingContext: 'mock_popularity' | 'informational_placeholder';
}
```

Source tables: `feed_posts`, `feed_post_reactions`, `investment_models`, `users`.

Safety requirements:

- `rank` is sorted by active like count in the selected tracked window.
- `likeCount` is aggregate engagement context only; it must not expose private users or hidden reactions.
- Ranking rows must not imply recommendation strength, model quality, expected return, suitability, allocation intent, or order intent.
- The API must not include fields named `recommendation`, `qualityScore`, `expectedReturn`, `tradeAction`, `order`, `execution`, `fill`, `brokerAction`, or `TradeIntent`.

## `SearchResultDto`

Used by `GET /api/search` and the top search surface.

```ts
interface SearchResultDto {
  investmentModels: Array<{
    modelId: string;
    modelPublicId: string;
    modelVersionPublicId: string;
    name: string;
    summary: string;
    market: string;
    riskLabel: string;
    performanceLabel: string;
    status: 'approved' | 'live';
    tags: string[];
    href: string;
  }>;
  feedPosts: Array<FeedPostDto & { href: string }>;
  signalEvents: Array<SignalEventDto & { href: string }>;
}
```

Source tables: `feed_posts`, `investment_models`, `model_creators`, `model_risk_profiles`, `model_performance_snapshots`, `users`, `model_signal_events`, `model_versions`, `market_instruments`.

Safety requirements:

- Search results use public ids and route-safe slugs only; internal numeric ids must not be exposed.
- `href` values point to existing or planned investModel routes and preserve the surface boundary as read-only navigation.
- Empty query results are valid empty arrays with `meta.counts`; they must not fall back to paid external search or realtime traffic APIs.
- The route meta must keep `readOnly: true`, `modelDiscoveryOnly: true`, `realtimeExternalData: false`, `financialAdvice: false`, `modelSelectionCreated: false`, `tradeIntentCreated: false`, `realOrder: false`, and `brokerageConnection: false`.
- Do not add fields named `recommendation`, `tradeAction`, `order`, `execution`, `brokerAction`, `suitability`, or `expectedReturn`.

## `NotificationCenterDto`

Used by `GET /api/notifications`, `POST /api/notifications/mark-all-read`, My Page notification summary, and the future Notification Center screen.

```ts
interface NotificationCenterItemDto {
  notificationPublicId: string;
  source: 'feed_post';
  title: string;
  body: string;
  status: 'unread' | 'read';
  eventLabel: string;
  occurredAt?: string;
  href: string;
  feedPost: FeedPostDto;
  notices: PolicyNoticeDto[];
}

interface NotificationCenterDto {
  userPublicId: string;
  unreadCount: number;
  items: NotificationCenterItemDto[];
  dataContext: 'mock' | 'informational_placeholder';
  notices: PolicyNoticeDto[];
}
```

Source tables: `users`, `feed_posts`, `feed_post_reads`, `investment_models`.

Safety requirements:

- Notification ids are public, derived ids for the notification-center DTO; internal numeric ids must not be exposed.
- Current notification rows are feed-derived informational events, not push/email/SMS delivery records.
- `status` and `unreadCount` are private read-state UI data for the current demo user only.
- `POST /api/notifications/mark-all-read` returns `{ notificationCenter, markedCount, readAt }` and mutates only `feed_post_reads`.
- Route meta must keep `sendsRealPush`, `sendsRealEmail`, `sendsRealSms`, `realOrder`, `brokerageConnection`, and `financialAdvice` false.
- Do not include bank, broker, account, order, execution, fill, allocation, or personalized advice fields.

## `MyPageFeedActivitySummaryDto`

Used by `GET /api/my/activity` and the My Page saved/comment activity panels.

```ts
interface MyPageFeedActivitySummaryDto {
  userPublicId: string;
  savedCount: number;
  commentCount: number;
  latestSavedAt?: string;
  latestCommentAt?: string;
  latestSavedPostTitle?: string;
  latestCommentPostTitle?: string;
  recentSavedPosts: MyPageFeedActivityItemDto[];
  recentCommentPosts: MyPageFeedActivityItemDto[];
  sourceLabel: 'db_read_model' | 'mock_safe_fallback';
}

interface MyPageFeedActivityItemDto {
  postPublicId: string;
  title: string;
  activityAt?: string;
  activityLabel: 'saved' | 'commented';
}
```

Source tables: `users`, `feed_posts`, `feed_post_saves`, `feed_post_comments`.

Safety requirements:

- Activity rows are private reading shortcuts only.
- Do not expose internal numeric ids.
- Do not include fields that imply push delivery, real account connection, brokerage action, order intent, allocation intent, or financial advice.

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
