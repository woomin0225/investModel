# API Route Inventory

<!--
This document lists the first investModel API routes, their purpose, permissions, request and response contracts, screen usage, and DB table sources.
It is an implementation guide only; routes that touch real money, real accounts, real orders, secrets, or uploaded model execution stay blocked by the MVP scope and feature review matrix.
-->

## API Principles

- MVP routes are mock-backed first and may later map to MySQL tables through explicit DTOs.
- API responses must not expose raw database rows.
- Money-like, performance-like, and trade-like fields must preserve `mock`, `simulated`, `backtest`, `placeholder`, or `informational` context.
- `TradeIntent` is a pre-order simulation concept only. No route in this inventory executes broker orders.
- Routes that require legal, security, financial-operation, secret, or external account review are marked as design-only.

## Route Summary

| Method | Path | Purpose | Permission | MVP status |
| --- | --- | --- | --- | --- |
| `GET` | `/api/models` | List discoverable approved/live mock investment models. | public or signed-in | DB-backed read implemented |
| `GET` | `/api/models/:id` | Read model detail, mandate, risk, disclosures, and performance context. | public or signed-in | DB-backed read implemented |
| `GET` | `/api/signals` | List observed model signal events. | signed-in | DB-backed; seed/mock ingestion allowed while IS-004 is open |
| `GET` | `/api/signals/:signalId` | Read one observed signal detail by public id. | signed-in | DB-backed read implemented |
| `GET` | `/api/feed` | List model notes, market context, risk notes, and review notes. | signed-in | DB-backed read implemented |
| `GET` | `/api/feed/rankings` | Read FeedPost popularity rankings from tracked likes. | signed-in | DB-backed read implemented |
| `GET` | `/api/feed/:postId` | Read one informational feed post detail by public id. | signed-in | DB-backed read implemented |
| `POST` | `/api/feed/:postId/comments` | Create a top-level informational comment. | signed-in | DB-backed action implemented |
| `POST` | `/api/feed/:postId/comments/:commentId/replies` | Create an informational reply comment. | signed-in | DB-backed action implemented |
| `POST` | `/api/feed/:postId/likes` | Toggle or set the signed-in user's like state. | signed-in | DB-backed action implemented |
| `POST` | `/api/feed/:postId/saves` | Toggle or set the signed-in user's saved state. | signed-in | DB-backed action implemented |
| `POST` | `/api/feed/:postId/reads` | Mark the signed-in user's post as read. | signed-in | DB-backed action implemented |
| `GET` | `/api/search` | Read grouped model, feed, and signal search results. | signed-in | DB-backed read implemented |
| `GET` | `/api/notifications` | Read user-scoped notification center rows. | user | DB-backed read implemented |
| `POST` | `/api/notifications/mark-all-read` | Mark notification-center FeedPost read state as read. | user | DB-backed read-state action implemented |
| `GET` | `/api/my` | Read the My Page screen summary for one prototype user. | user | DB-backed read implemented |
| `GET` | `/api/my/activity` | Read user-scoped My Page saved/comment activity summary. | user | DB-backed read implemented |
| `GET` | `/api/model-selections` | Read the current user's active mock-safe model selection. | user | DB-backed read implemented |
| `POST` | `/api/model-selections` | Persist a mock-safe selection of a specific model version. | user | DB-backed action implemented |
| `GET` | `/api/portfolio/mock-summary` | Read selected model, mock deposit, simulated allocation, time dashboard snapshots, positions, and blocked TradeIntent state. | user | DB-backed read implemented with mock-safe fallback |
| `GET` | `/api/portfolio/holdings` | Read simulated PortfolioPosition holdings and allocation labels for mobile Portfolio UI. | user | DB-backed read implemented with mock-safe fallback |
| `GET` | `/api/price-history` | Read a bounded seeded price-history series for prototype mini charts. | user | Fixture-backed read implemented |
| `POST` | `/api/model-reports` | Record a user concern for operator review without legal or compensation decisions. | user | mock-backed, not persisted; design-gated |
| `POST` | `/api/creator/models` | Create a creator model draft. | creator | mock-backed, not persisted; design-gated |
| `POST` | `/api/creator/models/:id/description-revisions` | Request a reviewed description revision plan. | creator | mock-backed, not persisted; design-gated |
| `POST` | `/api/admin/models/:id/reviews` | Record admin review decisions for model approval workflows. | admin | mock-backed, not persisted; design-gated |
| `POST` | `/api/admin/models/:id/force-stop` | Return an emergency force-stop contract for an InvestmentModel. | admin | mock-backed, not persisted; design-gated |

## Route Details

### `GET /api/models`

| Field | Value |
| --- | --- |
| Status | DB-backed read API implemented in `app/api/models/route.ts`; smoke-covered by `scripts/smoke/model-api-smoke.ts`. |
| Purpose | Provide the Discover Models screen with approved/live model cards. |
| Request | Optional query parameters later: `market`, `riskLevel`, `assetClass`, `cursor`. |
| Response DTO | `ModelCardDto[]` |
| Permission | Public read is acceptable for approved/live mock models; signed-in mode may add personalized selection markers later. |
| Screens | Discover Models |
| Source tables | `investment_models`, `model_versions`, `model_risk_profiles`, `model_performance_snapshots` |
| Mock source | `lib/mock/invest-model-discovery.ts` is UI fallback/reference copy only; the API reads DB rows. |
| Safety notes | Exclude `draft`, `pending_review`, `suspended`, and `retired` models from public discovery. Backtest/performance values need explicit placeholder labels. |

### `GET /api/models/:id`

| Field | Value |
| --- | --- |
| Status | DB-backed read API implemented in `app/api/models/[modelId]/route.ts`; smoke-covered by `scripts/smoke/model-api-smoke.ts`. |
| Purpose | Provide model detail content including mandate, risk, disclosures, metadata-only artifact status, and performance context. |
| Request | Path parameter `id` should resolve by public id or slug, not internal numeric database id. |
| Response DTO | `ModelDetailDto` |
| Permission | Public or signed-in for approved/live models. Creator/admin-only visibility requires RBAC later. |
| Screens | Model Detail |
| Source tables | `investment_models`, `model_versions`, `portfolio_mandates`, `model_risk_profiles`, `model_disclosures`, `model_performance_snapshots` |
| Mock source | `lib/mock/invest-model-model-detail.ts` is a legacy UI fallback for local DB-unavailable and comparison-link paths only; the API does not fall back to mock detail. |
| Safety notes | Do not claim legal approval or user suitability. High-risk/leverage copy must remain placeholder or reviewed. |

### `GET /api/signals`

| Field | Value |
| --- | --- |
| Purpose | Provide Realtime Signals with observed news, traffic, macro, price, or risk inputs. |
| Request | Optional query parameters now: `signalType`, `limit`. Future query parameters: `modelId`, `cursor`, `since`. |
| Response DTO | `SignalEventDto[]` |
| Permission | Signed-in user. Public access should be a later product decision. |
| Screens | Realtime Signals, Home signal preview |
| Source tables | `model_signal_events`, `model_versions`, `investment_models`, `market_instruments` |
| Seed source | `docs/database/seeds/003_signal_event_seed.sql`; external realtime sources remain blocked by IS-004. |
| Safety notes | Signals are observed inputs, not recommendations. They must not create live `TradeIntent` or order execution. |

### `GET /api/signals/:signalId`

| Field | Value |
| --- | --- |
| Status | DB-backed read implemented in `app/api/signals/[signalId]/route.ts`. |
| Purpose | Provide the future Signal Detail screen with one observed signal, related evidence, and score context. |
| Request | Path parameter `signalId` must resolve by `SignalEventDto.signalPublicId` or a stable URL-safe alias. Internal numeric database ids are not allowed in route params. |
| Response DTO | `SignalEventDto`; future detail evidence may expand this into `SignalDetailDto`. List pages link by `SignalEventDto.signalPublicId`. |
| Permission | Signed-in user. Public access should be a later product decision. |
| Screens | Signal Detail |
| Source tables | `model_signal_events`, `model_versions`, `investment_models`, `market_instruments`; future evidence can add `news_articles`, `news_traffic_snapshots`, `market_price_snapshots`, and score snapshot/input tables from `BK-266` |
| Seed source | `docs/database/seeds/003_signal_event_seed.sql`; external realtime sources remain blocked by IS-004. |
| Safety notes | Missing, hidden, or inaccessible signals return not-found/unavailable behavior. The route must not expose private record existence and must not create or imply `TradeIntent`, broker action, buy/sell/hold advice, or order execution. |

### `GET /api/feed`

| Field | Value |
| --- | --- |
| Status | DB-backed read API implemented in `app/api/feed/route.ts`; smoke-covered by `scripts/smoke/feed-api-smoke.ts`. |
| Purpose | Provide Feed Insights with informational posts from models, admins, or market context sources. |
| Request | Optional query parameters later: `postType`, `modelId`, `cursor`. |
| Response DTO | `FeedPostDto[]` |
| Permission | Signed-in user for MVP. Public feed is a later product decision. |
| Screens | Feed Insights |
| Source tables | `feed_posts`, `investment_models`, `users`, `model_disclosures` |
| Mock source | `lib/mock/invest-model-feed.ts` is UI fallback/reference copy only; the API reads DB rows seeded by `docs/database/seeds/002_feed_interaction_seed.sql`. |
| Safety notes | Feed copy must not guarantee returns, encourage trades, or present legal/financial advice as final. |

### `GET /api/feed/:postId`

| Field | Value |
| --- | --- |
| Purpose | Provide Feed Detail with one informational post, related context, comments, and user-scoped action state. |
| Request | Path parameter `postId` must resolve by `FeedPostDto.postPublicId` or a stable URL-safe alias. Internal numeric database ids are not allowed in route params. |
| Response DTO | `FeedPostDetailDto` |
| Permission | Signed-in user for MVP. Public feed detail is a later product decision. |
| Screens | Feed Detail |
| Source tables | `feed_posts`, `investment_models`, `users`, `feed_post_comments`, `feed_post_reactions`, `feed_post_saves`, and `feed_post_reads` |
| Mock source | `docs/database/seeds/002_feed_interaction_seed.sql` for local sample detail/comment/action state. |
| Safety notes | Missing, hidden, unpublished, admin-only, or inaccessible posts return not-found/unavailable behavior. The route must not expose private record existence and must not guarantee returns, encourage securities trading, or present legal/financial advice as final. Like rankings are popularity context only, not model quality or expected return. |

### `GET /api/feed/rankings`

| Field | Value |
| --- | --- |
| Status | DB-backed read API implemented in `app/api/feed/rankings/route.ts`. |
| Purpose | Provide Feed Insights and future ranking modules with informational FeedPost popularity context. |
| Request | Optional query parameters: `window` (`tracked_seed` or `all_time`, default `tracked_seed`) and `limit` (1-20, default 5). |
| Response DTO | `FeedPostRankingDto[]` |
| Permission | Signed-in user/admin role. Public, creator, and system roles are blocked for MVP. |
| Screens | Feed Insights, Feed Detail adjacent popularity context |
| Source tables | `feed_posts`, `feed_post_reactions`, `investment_models`, `users` |
| Mock source | `docs/database/seeds/002_feed_interaction_seed.sql` for local sample reaction state. |
| Safety notes | Rankings are active-like-count popularity context only. They must not imply recommendation strength, suitability, model quality, expected return, allocation intent, or order intent. |

### `POST /api/feed/:postId/comments`

| Field | Value |
| --- | --- |
| Status | DB-backed action API implemented in `app/api/feed/[postId]/comments/route.ts`. |
| Purpose | Create a top-level informational comment for a visible feed post. |
| Request | Path parameter `postId`; JSON body `{ body: string, clientRequestId?: string }`. `body` is trimmed and capped at 600 characters. Client-provided `userPublicId` is ignored; the server-resolved scope owns the comment. |
| Response DTO | Refreshed `FeedPostDetailDto` including the new top-level `FeedCommentDto` and updated `FeedReactionStateDto.commentCount`. |
| Permission | Signed-in user/admin role; only visible posts can receive comments. |
| Screens | Feed Detail |
| Source tables | `feed_post_comments`, `feed_posts`, `users`, plus reaction/save/read tables for refreshed state. |
| Mock source | `docs/database/seeds/002_feed_interaction_seed.sql` and DB-backed read model. |
| Safety notes | Validate length/content, rate-limit later, store moderation-ready status, and treat comments as informational discussion only. No personalized advice, order, trade instruction, or compliance approval fields are allowed. |

### `POST /api/feed/:postId/comments/:commentId/replies`

| Field | Value |
| --- | --- |
| Status | DB-backed action API implemented in `app/api/feed/[postId]/comments/[commentId]/replies/route.ts`; smoke-covered by `scripts/smoke/feed-reply-api-smoke.ts`. |
| Purpose | Create an informational reply under a visible parent comment. |
| Request | Path parameters `postId` and `commentId` must resolve by public ids; JSON body `{ body: string, clientRequestId?: string }`. |
| Response DTO | `FeedCommentDto` and optionally refreshed parent `FeedCommentDto`. |
| Permission | Signed-in user; parent comment must be visible to the actor. |
| Screens | Feed Detail |
| Source tables | `feed_post_comments`, `feed_posts`, `users`, plus refreshed reaction/save/read state. |
| Mock source | `docs/database/seeds/002_feed_interaction_seed.sql` and DB-backed read model. |
| Safety notes | Hidden, deleted, or inaccessible parent comments use unavailable behavior and must not reveal moderation/private details. Replies remain informational only. |

### `POST /api/feed/:postId/likes`

| Field | Value |
| --- | --- |
| Status | DB-backed action API implemented in `app/api/feed/[postId]/likes/route.ts`; smoke-covered by `scripts/smoke/feed-like-api-smoke.ts`. |
| Purpose | Toggle or set the signed-in user's like state for a feed post. |
| Request | Path parameter `postId`; optional JSON body `{ desiredState?: boolean }`. |
| Response DTO | `FeedReactionStateDto` |
| Permission | Signed-in user; only the actor's own like state can change. |
| Screens | Feed Detail, Feed Insights list row actions |
| Source tables | `feed_post_reactions`, `feed_posts`, `users`, plus `feed_post_saves`, `feed_post_reads`, and `feed_post_comments` for refreshed state. |
| Mock source | `docs/database/seeds/002_feed_interaction_seed.sql` for local sample reaction state. |
| Safety notes | Like state is UI engagement/popularity context only and must not imply recommendation strength, suitability, model quality, or expected return. |

### `POST /api/feed/:postId/saves`

| Field | Value |
| --- | --- |
| Status | DB-backed action API implemented in `app/api/feed/[postId]/saves/route.ts`; smoke-covered by `scripts/smoke/feed-save-api-smoke.ts`. |
| Purpose | Toggle or set the signed-in user's saved/bookmarked state for a feed post. |
| Request | Path parameter `postId`; optional JSON body `{ desiredState?: boolean }`. |
| Response DTO | `FeedReactionStateDto` |
| Permission | Signed-in user; only the actor's own saved state can change. |
| Screens | Feed Detail, Feed Insights list row actions |
| Source tables | `feed_post_saves`, `feed_posts`, `users`, plus `feed_post_reactions`, `feed_post_reads`, and `feed_post_comments` for refreshed state. |
| Mock source | `docs/database/seeds/002_feed_interaction_seed.sql` for local sample saved state. |
| Safety notes | Save state is a private reading shortcut only and must not be treated as model selection, portfolio allocation, or order intent. |

### `POST /api/feed/:postId/reads`

| Field | Value |
| --- | --- |
| Status | DB-backed action API implemented in `app/api/feed/[postId]/reads/route.ts`. |
| Purpose | Mark the signed-in user's feed post as read. |
| Request | Path parameter `postId`; optional JSON body for compatibility only. Client-provided `userPublicId` is ignored; the server-resolved scope owns the read state. |
| Response DTO | `FeedReactionStateDto` |
| Permission | Signed-in user/admin role; only the actor's own read state can change. |
| Screens | Feed Detail, Feed Insights list row actions |
| Source tables | `feed_post_reads`, `feed_posts`, `users`, plus `feed_post_reactions`, `feed_post_saves`, and `feed_post_comments` for refreshed state. |
| Mock source | `docs/database/seeds/002_feed_interaction_seed.sql` and DB-backed read model. |
| Safety notes | Read state is private UI state. It must not expose other users' behavior, imply regulatory review/compliance approval, or act as recommendation, quality, return, allocation, or order signal. |

### `GET /api/search`

| Field | Value |
| --- | --- |
| Status | DB-backed grouped read API implemented in `app/api/search/route.ts`. |
| Purpose | Provide the top search surface with grouped InvestmentModel, FeedPost, and SignalEvent results. |
| Request | Optional query parameter `q`, trimmed and capped at 120 characters. Empty `q` returns the current grouped discovery set without falling back to external search. |
| Response DTO | `SearchResultDto` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | Top search button, future Search screen |
| Source tables | `feed_posts`, `investment_models`, `model_creators`, `model_risk_profiles`, `model_performance_snapshots`, `users`, `model_signal_events`, `model_versions`, `market_instruments` |
| Mock source | Existing DB seed/read models; no external realtime search provider while IS-004 is open. |
| Safety notes | Search is read-only model discovery and information retrieval. It must not create recommendations, model selections, `TradeIntent`, orders, brokerage actions, or paid external API calls. |

### `GET /api/notifications`

| Field | Value |
| --- | --- |
| Status | DB-backed notification center read API implemented in `app/api/notifications/route.ts`. |
| Purpose | Provide the notification button and notification center with unread/read rows derived from user-scoped feed read state. |
| Request | Optional query parameter `limit` (1-30, default 12). Client-provided `userPublicId` is ignored; the server resolves the current prototype scope from session or `user_demo_001` demo fallback. |
| Response DTO | `NotificationCenterDto` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | Top notification button, future Notification Center, My Page notification summary |
| Source tables | `users`, `feed_posts`, `feed_post_reads`, `investment_models` |
| Mock source | Existing DB-backed feed rows and read state. Notification delivery providers are not connected. |
| Safety notes | The route reads notification-like FeedPost rows only. It does not send push, email, SMS, broker, order, account, or advice notifications. |

### `POST /api/notifications/mark-all-read`

| Field | Value |
| --- | --- |
| Status | DB-backed read-state action implemented in `app/api/notifications/mark-all-read/route.ts`. |
| Purpose | Mark the current user's notification-center FeedPost rows as read and return the refreshed notification center. |
| Request | Optional JSON body `{ userPublicId?: string, limit?: number }`; `userPublicId` is prototype-limited to `user_demo_001`, and `limit` must be 1-30. |
| Response DTO | `{ notificationCenter: NotificationCenterDto; markedCount: number; readAt: string }` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | Notification Center mark-all-read action, My Page notification summary refresh |
| Source tables | `users`, `feed_posts`, `feed_post_reads` |
| Mock source | Existing DB-backed feed rows and read state. |
| Safety notes | This mutates only private read state. It does not deliver notifications, expose other users' state, create orders, connect brokers/accounts, or provide financial advice. |

### `GET /api/my`

| Field | Value |
| --- | --- |
| Status | DB-backed read API implemented in `app/api/my/route.ts`. |
| Purpose | Provide the My Page screen with one typed summary containing user profile, active selected model, saved/comment FeedPost activity, notification summary, recent notifications, and mock-safe policy notices. |
| Request | No request body. Client-provided `userPublicId` is ignored; the server resolves the current prototype scope from session or `user_demo_001` demo fallback. |
| Response DTO | `MyPageSummaryDto` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | My Page |
| Source tables | `users`, `user_model_selections`, `investment_models`, `model_versions`, `feed_posts`, `feed_post_saves`, `feed_post_comments`, `feed_post_reads` |
| Mock source | Existing DB-backed read models with mock-safe fallback labels when the prototype user or DB rows are unavailable. |
| Safety notes | This is the investModel My Page read model, separate from the starter `/api/user` account endpoint. It must not expose internal numeric ids, real bank/broker accounts, real balances, deposits, withdrawals, orders, execution/fill data, notification delivery, legal judgment, or financial advice. |

### `GET /api/my/activity`

| Field | Value |
| --- | --- |
| Status | DB-backed read API implemented in `app/api/my/activity/route.ts`. |
| Purpose | Provide My Page with user-scoped saved/comment FeedPost activity counts and recent activity shortcuts. |
| Request | Client-provided `userPublicId` is ignored by route-level callers; server-side read-model helpers accept explicit public ids only for local verification and isolated fallback tests. |
| Response DTO | `MyPageFeedActivitySummaryDto` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | My Page |
| Source tables | `users`, `feed_posts`, `feed_post_saves`, `feed_post_comments` |
| Mock source | Existing DB-backed feed interaction rows; unavailable DB/user state returns mock-safe fallback counts. |
| Safety notes | Activity is a private reading shortcut only. It must not expose internal ids, send real push/email/SMS, connect accounts, create orders, imply brokerage actions, or provide financial advice. |

### `GET/POST /api/model-selections`

| Field | Value |
| --- | --- |
| Status | DB-backed read/action API implemented in `app/api/model-selections/route.ts`; smoke-covered by `scripts/smoke/model-selection-api-smoke.ts`. |
| Purpose | Read or persist the current user's mock-safe active `ModelVersion` selection. |
| Request | `GET` has no body. `POST` accepts `modelPublicId`, `modelVersionPublicId`, and optional `riskAcknowledgedAt`; the server resolves user scope and ignores client user scope. |
| Response DTO | `ModelSelectionDto` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | Model Detail selection flow, Home selected model state |
| Source tables | `user_model_selections`, `investment_models`, `model_versions`, `model_risk_profiles` |
| Mock source | DB seed/read model only; no account funding, deposits, or broker state is created. |
| Safety notes | Users must not edit stock/bond ratio, leverage preference, risk appetite, or direct allocation. The selected model version owns those settings. The route records selection metadata only and never creates funds, orders, or brokerage connections. |

### `GET /api/portfolio/mock-summary`

| Field | Value |
| --- | --- |
| Status | DB-backed read API implemented in `app/api/portfolio/mock-summary/route.ts`. |
| Purpose | Provide Home/Portfolio with mock-safe selected model state, MockDeposit, AllocationDecision, 1D/1W/1M time dashboard snapshots, simulated positions, and blocked TradeIntent state. |
| Request | No request body. Client-provided `userPublicId` is ignored; the server resolves the current prototype scope from session or `user_demo_001` demo fallback. |
| Response DTO | `PortfolioSummaryDto` with embedded `PortfolioDashboardTimelineDto` rows in `timeSnapshots`. |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | Home, Portfolio |
| Source tables | `users`, `user_model_selections`, `investment_models`, `model_versions`, `mock_deposits`, `portfolios`, `portfolio_positions`, `market_instruments`, `allocation_decisions`, `trade_intents` |
| Mock source | `lib/mock/invest-model-portfolio.ts` is used only as a mock-safe fallback when DB state is unavailable. |
| Safety notes | Must use mock/simulated labels. This route must not connect payments, bank accounts, brokerage accounts, real balances, real deposits, real orders, executions, fills, settlements, or investment advice. `TradeIntent` rows are displayed only as pre-order simulation or blocked state. |

### `GET /api/portfolio/holdings`

| Field | Value |
| --- | --- |
| Status | DB-backed read API implemented in `app/api/portfolio/holdings/route.ts`; smoke-covered by `scripts/smoke/portfolio-holdings-api-smoke.ts`. |
| Purpose | Provide Portfolio holdings and allocation UI with simulated `PortfolioPosition` rows sourced from the BK-505 holdings read model. |
| Request | No request body. Client-provided `userPublicId` is ignored; the server resolves the current prototype scope from session or `user_demo_001` demo fallback. |
| Response DTO | `PortfolioHoldingsDto` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | Portfolio holdings list and future allocation split modules. |
| Source tables | `users`, `user_model_selections`, `portfolios`, `portfolio_positions`, `market_instruments`, `mock_deposits` |
| Mock source | `lib/db/portfolio-holdings-read-model.ts` reads DB state or mock-safe fallback from the PortfolioSummary read model. |
| Safety notes | Must expose `mockOnly`, `simulated`, `brokerConfirmed=false`, `brokerConfirmedHoldings=false`, `realHolding=false`, `orderExecution=false`, `tradeFill=false`, `settlement=false`, `accountLinking=false`, `externalPaidApi=false`, `realOrder=false`, and `financialAdvice=false`. No real holdings, broker account, order, fill, settlement, account link, or recommendation is created. |

### `GET /api/portfolio/allocation-split`

| Field | Value |
| --- | --- |
| Status | Seed/read-model backed read API implemented in `app/api/portfolio/allocation-split/route.ts`; smoke-covered by `scripts/smoke/portfolio-allocation-split-api-smoke.ts`. |
| Purpose | Provide Portfolio allocation UI with deterministic sector and asset-class bucket arrays sourced from the BK-508 allocation split read model. |
| Request | No request body. Client-provided `userPublicId` is ignored; the server resolves the current prototype scope from session or `user_demo_001` demo fallback. |
| Response DTO | `PortfolioAllocationSplitDto` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | Portfolio allocation split modules. |
| Source tables | `users`, `user_model_selections`, `portfolios`, `portfolio_positions`, `market_instruments`, `mock_deposits` |
| Mock source | `lib/db/portfolio-allocation-split-read-model.ts` derives deterministic simulated buckets from the BK-508 seed fixture. |
| Safety notes | Must expose `mockOnly`, `simulated`, `readOnly`, `brokerConfirmed=false`, `brokerConfirmedHoldings=false`, `realHolding=false`, `userRiskSettingAccepted=false`, `userAllocationOverrideAccepted=false`, `orderExecution=false`, `tradeFill=false`, `settlement=false`, `accountLinking=false`, `externalPaidApi=false`, `realOrder=false`, and `financialAdvice=false`. No user risk setting, allocation override, real holding, broker account, order, fill, settlement, account link, or recommendation is created. |

### `GET /api/price-history`

| Field | Value |
| --- | --- |
| Status | Fixture-backed read API implemented in `app/api/price-history/route.ts`; smoke-covered by `scripts/smoke/price-history-api-smoke.ts`. |
| Purpose | Provide seeded, bounded price-history points for prototype mini charts without live market data. |
| Request | Optional query parameters: `symbol` defaults to `SAMPLE_AI_BASKET`; `limit` must be an integer from 1 to 48. Unsupported symbols return `unsupported_symbol`. |
| Response DTO | `PriceHistoryMiniChartDto` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | Future Home, Model Detail, and Portfolio mini chart modules. |
| Source tables | Future read-model source mirrors seeded `market_instruments` and `market_price_snapshots` context from `BK-501`; current route reads `lib/db/price-history-read-model.ts` only. |
| Mock source | BK-501 deterministic seed fixture, not an external provider. |
| Safety notes | Must expose `mockOnly`, `simulated`, `sampleBacktestWindow`, `liveMarketData=false`, `realTimeQuotes=false`, `externalPaidApi=false`, `brokerageConnection=false`, `tradeInstruction=false`, `realOrder=false`, and `financialAdvice=false`. |

### `POST /api/creator/models`

| Field | Value |
| --- | --- |
| Status | Mock-backed, not-persisted contract implemented in `app/api/creator/models/route.ts`; smoke-covered by `scripts/smoke/creator-draft-validation-smoke.ts`. |
| Purpose | Let a verified creator create a draft `InvestmentModel` metadata record. |
| Request | `name`, `shortDescription`, `targetMarkets`, `assetUniverseSummary`, `strategySummary`, risk/mandate draft fields. |
| Response DTO | `InvestmentModelDraftDto` |
| Permission | `creator` |
| Screens | Future creator workflow |
| Source tables | `model_creators`, `investment_models`, `model_versions`, `model_risk_profiles`, `portfolio_mandates`, `model_disclosures` |
| Mock source | none yet |
| Safety notes | Design-gated until durable creator persistence and audit logging are implemented. Model artifacts remain metadata-only; no uploaded model execution. |

### `POST /api/creator/models/:id/description-revisions`

| Field | Value |
| --- | --- |
| Status | Mock-backed, not-persisted contract implemented in `app/api/creator/models/[modelId]/description-revisions/route.ts`; RBAC-covered by `scripts/smoke/rbac-access-smoke.ts`. |
| Purpose | Return a pending-review `ModelVersion` description revision plan for creator-submitted copy changes. |
| Request | Path parameter `id`; JSON body with creator ownership, current `ModelVersion`, changed fields, and change summary. |
| Response DTO | Description revision plan from `lib/domain/models/description-revision.ts`. |
| Permission | creator/admin role; public, user, and system roles are blocked. |
| Screens | Future creator revision workflow |
| Source tables | Future `investment_models`, `model_versions`, `model_disclosures`, and audit tables when persistence is enabled. |
| Mock source | Domain validator/builder only; no DB rows are mutated. |
| Safety notes | The route must not mutate live copy, publish a model, execute artifacts, or finalize legal/financial disclosure text. |

### `POST /api/admin/models/:id/reviews`

| Field | Value |
| --- | --- |
| Status | Mock-backed, not-persisted contract implemented in `app/api/admin/models/[modelId]/reviews/route.ts`; RBAC-covered by `scripts/smoke/rbac-access-smoke.ts` and manual-flow-covered by `scripts/smoke/operator-review-manual-smoke.ts`. |
| Purpose | Record an admin review decision for a model, version, disclosure, or incident workflow. |
| Request | `reviewType`, `status`, `notes`, optional disclosure or version references. |
| Response DTO | `ComplianceReviewDto` |
| Permission | `admin` |
| Screens | Future admin review workflow |
| Source tables | `compliance_reviews`, `investment_models`, `model_versions`, `model_disclosures`, `audit_logs` |
| Mock source | none yet |
| Safety notes | Design-gated until durable audit logging and persistence are enabled. Admin review is not a Codex legal judgment and does not publish, trade, or execute a model. |

### `POST /api/admin/models/:id/force-stop`

| Field | Value |
| --- | --- |
| Status | Mock-backed, not-persisted contract implemented in `app/api/admin/models/[modelId]/force-stop/route.ts`; smoke-covered by `scripts/smoke/admin-force-stop-smoke.ts`. |
| Purpose | Return an emergency `InvestmentModel` force-stop contract with an audit-log-shaped payload. |
| Request | Path parameter `id`; JSON body with live/paused current status, severity, affected surfaces, and operator reason. |
| Response DTO | Admin force-stop result from `lib/domain/models/admin-force-stop.ts`. |
| Permission | admin role only. |
| Screens | Future admin incident/force-stop workflow |
| Source tables | Future `investment_models`, `model_versions`, `compliance_reviews`, and `audit_logs` when persistence is enabled. |
| Mock source | Domain validator/builder only; no DB rows are mutated. |
| Safety notes | Force-stop is a mock-safe control contract only. It does not cancel real orders, move funds, connect brokers, or make legal determinations. |

### `POST /api/model-reports`

| Field | Value |
| --- | --- |
| Status | Mock-backed, not-persisted contract implemented in `app/api/model-reports/route.ts`; domain safety covered by `scripts/qa/invest-model-model-report-smoke.ts`. |
| Purpose | Let a user/admin submit concerns about model copy, performance display, or safety context for operator review. |
| Request | JSON body with reporter public id, model public id, report type, and summary. |
| Response DTO | Model report DTO from `lib/domain/compliance/model-report.ts`. |
| Permission | user/admin role; public, creator, and system roles are blocked. |
| Screens | Model report/admin report prototype surfaces |
| Source tables | Future `compliance_reviews`, `audit_logs`, and model/report tables when persistence is enabled. |
| Mock source | Domain validator/builder only; no legal, compensation, account, or trading decision is persisted. |
| Safety notes | Reports route to operator review only. The API must not decide legal liability, compensation, account status, order cancellation, or suitability. |

## Smoke Coverage Snapshot

The current route inventory is checked against these local smoke scripts:

| Area | Scripts |
| --- | --- |
| Models | `scripts/smoke/model-api-smoke.ts`, `scripts/smoke/model-selection-api-smoke.ts` |
| Signals | `scripts/smoke/signal-api-smoke.ts`, `scripts/smoke/signal-detail-api-smoke.ts`, `scripts/smoke/mock-ingestion-boundary-smoke.ts` |
| Feed | `scripts/smoke/feed-api-smoke.ts`, `scripts/smoke/feed-detail-api-smoke.ts`, `scripts/smoke/feed-comment-api-smoke.ts`, `scripts/smoke/feed-reply-api-smoke.ts`, `scripts/smoke/feed-like-api-smoke.ts`, `scripts/smoke/feed-save-api-smoke.ts`, `scripts/smoke/feed-read-api-smoke.ts`, `scripts/smoke/feed-ranking-api-smoke.ts` |
| Search, notifications, My Page, portfolio | `scripts/smoke/search-api-smoke.ts`, `scripts/smoke/search-read-model-projection-smoke.ts`, `scripts/smoke/notifications-api-smoke.ts`, `scripts/smoke/notifications-mark-all-read-api-smoke.ts`, `scripts/smoke/my-page-api-smoke.ts`, `scripts/smoke/my-activity-api-smoke.ts`, `scripts/smoke/portfolio-mock-summary-api-smoke.ts`, `scripts/smoke/portfolio-holdings-api-smoke.ts`, `scripts/smoke/portfolio-allocation-split-api-smoke.ts` |
| Creator/admin/review contracts | `scripts/smoke/creator-draft-validation-smoke.ts`, `scripts/smoke/admin-force-stop-smoke.ts`, `scripts/smoke/rbac-access-smoke.ts`, `scripts/smoke/operator-review-manual-smoke.ts`, `scripts/smoke/review-result-notification-smoke.ts`, `scripts/smoke/model-status-notification-smoke.ts`, `scripts/qa/invest-model-admin-review-flow-smoke.ts`, `scripts/qa/invest-model-model-report-smoke.ts` |

## Error And Policy Notes

- `401 unauthenticated`: user identity is required but missing.
- `403 forbidden`: authenticated user lacks the required role.
- `404 not_found`: resource is absent or intentionally hidden from the current user.
- `409 policy_blocked`: requested transition or action violates model state, review state, or feature-review matrix policy.
- `422 validation_error`: request shape is invalid.

Financial/legal blocked states should be distinct from normal validation errors so the UI can explain that a feature is intentionally unavailable in the MVP.

## Follow-Up Work

- `BK-126` should define the DTO fields for `ModelCardDto`, `ModelDetailDto`, `SignalEventDto`, `FeedPostDto`, `ModelSelectionDto`, and `PortfolioSummaryDto`.
- `BK-127` should expand authentication, RBAC, and error response rules.
- `BK-128` should map each Figma/mobile screen to the exact API calls and mock fallbacks.
- `BK-138` should define the RBAC matrix before creator/admin routes are implemented.
