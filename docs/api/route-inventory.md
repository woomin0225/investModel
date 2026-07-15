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
| `GET` | `/api/models` | List discoverable approved/live mock investment models. | public or signed-in | mock-backed allowed |
| `GET` | `/api/models/:id` | Read model detail, mandate, risk, disclosures, and performance context. | public or signed-in | mock-backed allowed |
| `GET` | `/api/signals` | List observed model signal events. | signed-in | DB-backed; seed/mock ingestion allowed while IS-004 is open |
| `GET` | `/api/signals/:signalId` | Read one observed signal detail by public id. | signed-in | DB-backed read implemented |
| `GET` | `/api/feed` | List model notes, market context, risk notes, and review notes. | signed-in | mock-backed allowed |
| `GET` | `/api/feed/rankings` | Read FeedPost popularity rankings from tracked likes. | signed-in | DB-backed read implemented |
| `GET` | `/api/feed/:postId` | Read one informational feed post detail by public id. | signed-in | DB-backed read implemented |
| `POST` | `/api/feed/:postId/comments` | Create a top-level informational comment. | signed-in | action contract defined; implementation pending |
| `POST` | `/api/feed/:postId/comments/:commentId/replies` | Create an informational reply comment. | signed-in | action contract defined; implementation pending |
| `POST` | `/api/feed/:postId/likes` | Toggle or set the signed-in user's like state. | signed-in | DB-backed action implemented |
| `POST` | `/api/feed/:postId/saves` | Toggle or set the signed-in user's saved state. | signed-in | DB-backed action implemented |
| `POST` | `/api/feed/:postId/read` | Mark the signed-in user's post as read. | signed-in | action contract defined; implementation pending |
| `GET` | `/api/search` | Read grouped model, feed, and signal search results. | signed-in | DB-backed read implemented |
| `GET` | `/api/notifications` | Read user-scoped notification center rows. | user | DB-backed read implemented |
| `POST` | `/api/notifications/mark-all-read` | Mark notification-center FeedPost read state as read. | user | DB-backed read-state action implemented |
| `GET` | `/api/my` | Read the My Page screen summary for one prototype user. | user | DB-backed read implemented |
| `GET` | `/api/my/activity` | Read user-scoped My Page saved/comment activity summary. | user | DB-backed read implemented |
| `POST` | `/api/model-selections` | Simulate a user selecting a specific model version. | user | mock-backed allowed |
| `GET` | `/api/portfolio/mock-summary` | Read selected model, mock deposit, simulated allocation, time dashboard snapshots, positions, and blocked TradeIntent state. | user | DB-backed read implemented with mock-safe fallback |
| `POST` | `/api/creator/models` | Create a creator model draft. | creator | design-only until RBAC is implemented |
| `POST` | `/api/admin/models/:id/reviews` | Record admin review decisions for model approval workflows. | admin | design-only until RBAC/audit is implemented |

## Route Details

### `GET /api/models`

| Field | Value |
| --- | --- |
| Purpose | Provide the Discover Models screen with approved/live model cards. |
| Request | Optional query parameters later: `market`, `riskLevel`, `assetClass`, `cursor`. |
| Response DTO | `ModelCardDto[]` |
| Permission | Public read is acceptable for approved/live mock models; signed-in mode may add personalized selection markers later. |
| Screens | Discover Models |
| Source tables | `investment_models`, `model_versions`, `model_risk_profiles`, `model_performance_snapshots` |
| Mock source | `lib/mock/invest-model-discovery.ts` |
| Safety notes | Exclude `draft`, `pending_review`, `suspended`, and `retired` models from public discovery. Backtest/performance values need explicit placeholder labels. |

### `GET /api/models/:id`

| Field | Value |
| --- | --- |
| Purpose | Provide model detail content including mandate, risk, disclosures, metadata-only artifact status, and performance context. |
| Request | Path parameter `id` should resolve by public id or slug, not internal numeric database id. |
| Response DTO | `ModelDetailDto` |
| Permission | Public or signed-in for approved/live models. Creator/admin-only visibility requires RBAC later. |
| Screens | Model Detail |
| Source tables | `investment_models`, `model_versions`, `portfolio_mandates`, `model_risk_profiles`, `model_disclosures`, `model_performance_snapshots` |
| Mock source | Future detail mock derived from discovery and domain mapping. |
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
| Purpose | Provide Feed Insights with informational posts from models, admins, or market context sources. |
| Request | Optional query parameters later: `postType`, `modelId`, `cursor`. |
| Response DTO | `FeedPostDto[]` |
| Permission | Signed-in user for MVP. Public feed is a later product decision. |
| Screens | Feed Insights |
| Source tables | `feed_posts`, `investment_models`, `users`, `model_disclosures` |
| Mock source | `lib/mock/invest-model-feed.ts` |
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
| Request | Path parameter `postId`; JSON body `{ userPublicId: string, body: string, clientRequestId?: string }`. `body` is trimmed and capped at 600 characters. |
| Response DTO | Refreshed `FeedPostDetailDto` including the new top-level `FeedCommentDto` and updated `FeedReactionStateDto.commentCount`. |
| Permission | Signed-in user/admin role; only visible posts can receive comments. |
| Screens | Feed Detail |
| Source tables | `feed_post_comments`, `feed_posts`, `users`, plus reaction/save/read tables for refreshed state. |
| Mock source | `docs/database/seeds/002_feed_interaction_seed.sql` and DB-backed read model. |
| Safety notes | Validate length/content, rate-limit later, store moderation-ready status, and treat comments as informational discussion only. No personalized advice, order, trade instruction, or compliance approval fields are allowed. |

### `POST /api/feed/:postId/comments/:commentId/replies`

| Field | Value |
| --- | --- |
| Purpose | Create an informational reply under a visible parent comment. |
| Request | Path parameters `postId` and `commentId` must resolve by public ids; JSON body `{ body: string, clientRequestId?: string }`. |
| Response DTO | `FeedCommentDto` and optionally refreshed parent `FeedCommentDto`. |
| Permission | Signed-in user; parent comment must be visible to the actor. |
| Screens | Feed Detail |
| Source tables | Future `feed_post_comments` from `BK-293`, `feed_posts`, `users` |
| Mock source | Future feed interaction seed/sample files from `BK-293`. |
| Safety notes | Hidden, deleted, or inaccessible parent comments use unavailable behavior and must not reveal moderation/private details. Replies remain informational only. |

### `POST /api/feed/:postId/likes`

| Field | Value |
| --- | --- |
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
| Purpose | Toggle or set the signed-in user's saved/bookmarked state for a feed post. |
| Request | Path parameter `postId`; optional JSON body `{ desiredState?: boolean }`. |
| Response DTO | `FeedReactionStateDto` |
| Permission | Signed-in user; only the actor's own saved state can change. |
| Screens | Feed Detail, Feed Insights list row actions |
| Source tables | `feed_post_saves`, `feed_posts`, `users`, plus `feed_post_reactions`, `feed_post_reads`, and `feed_post_comments` for refreshed state. |
| Mock source | `docs/database/seeds/002_feed_interaction_seed.sql` for local sample saved state. |
| Safety notes | Save state is a private reading shortcut only and must not be treated as model selection, portfolio allocation, or order intent. |

### `POST /api/feed/:postId/read`

| Field | Value |
| --- | --- |
| Status | DB-backed action API implemented in `app/api/feed/[postId]/reads/route.ts`. |
| Purpose | Mark the signed-in user's feed post as read. |
| Request | Path parameter `postId`; JSON body `{ userPublicId: string }`. |
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
| Request | Optional query parameters `userPublicId` (prototype-limited to `user_demo_001`) and `limit` (1-30, default 12). |
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
| Request | Optional query parameter `userPublicId`, limited to `user_demo_001` in the prototype. No request body. |
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
| Request | Optional query parameter `userPublicId`, limited to `user_demo_001` in the prototype. |
| Response DTO | `MyPageFeedActivitySummaryDto` |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | My Page |
| Source tables | `users`, `feed_posts`, `feed_post_saves`, `feed_post_comments` |
| Mock source | Existing DB-backed feed interaction rows; unavailable DB/user state returns mock-safe fallback counts. |
| Safety notes | Activity is a private reading shortcut only. It must not expose internal ids, send real push/email/SMS, connect accounts, create orders, imply brokerage actions, or provide financial advice. |

### `POST /api/model-selections`

| Field | Value |
| --- | --- |
| Purpose | Simulate selecting a specific approved/live model version. |
| Request | `modelId`, `modelVersionId`, optional `riskAcknowledged` flag when required by the model. |
| Response DTO | `ModelSelectionDto` |
| Permission | Signed-in `user`. |
| Screens | Model Detail selection flow, Home selected model state |
| Source tables | `user_model_selections`, `investment_models`, `model_versions`, `model_risk_profiles` |
| Mock source | Future mock selection helper; must not imply account funding. |
| Safety notes | Users must not edit stock/bond ratio, leverage preference, risk appetite, or direct allocation. The selected model version owns those settings. |

### `GET /api/portfolio/mock-summary`

| Field | Value |
| --- | --- |
| Status | DB-backed read API implemented in `app/api/portfolio/mock-summary/route.ts`. |
| Purpose | Provide Home/Portfolio with mock-safe selected model state, MockDeposit, AllocationDecision, 1D/1W/1M time dashboard snapshots, simulated positions, and blocked TradeIntent state. |
| Request | Optional query parameter `userPublicId`, currently limited to `user_demo_001` in the prototype. No request body. |
| Response DTO | `PortfolioSummaryDto` with embedded `PortfolioDashboardTimelineDto` rows in `timeSnapshots`. |
| Permission | Signed-in user/admin role; public, creator, and system roles are blocked for MVP. |
| Screens | Home, Portfolio |
| Source tables | `users`, `user_model_selections`, `investment_models`, `model_versions`, `mock_deposits`, `portfolios`, `portfolio_positions`, `market_instruments`, `allocation_decisions`, `trade_intents` |
| Mock source | `lib/mock/invest-model-portfolio.ts` is used only as a mock-safe fallback when DB state is unavailable. |
| Safety notes | Must use mock/simulated labels. This route must not connect payments, bank accounts, brokerage accounts, real balances, real deposits, real orders, executions, fills, settlements, or investment advice. `TradeIntent` rows are displayed only as pre-order simulation or blocked state. |

### `POST /api/creator/models`

| Field | Value |
| --- | --- |
| Purpose | Let a verified creator create a draft `InvestmentModel` metadata record. |
| Request | `name`, `shortDescription`, `targetMarkets`, `assetUniverseSummary`, `strategySummary`, risk/mandate draft fields. |
| Response DTO | `InvestmentModelDraftDto` |
| Permission | `creator` |
| Screens | Future creator workflow |
| Source tables | `model_creators`, `investment_models`, `model_versions`, `model_risk_profiles`, `portfolio_mandates`, `model_disclosures` |
| Mock source | none yet |
| Safety notes | Design-only until RBAC and audit logging are implemented. Model artifacts remain metadata-only; no uploaded model execution. |

### `POST /api/admin/models/:id/reviews`

| Field | Value |
| --- | --- |
| Purpose | Record an admin review decision for a model, version, disclosure, or incident workflow. |
| Request | `reviewType`, `status`, `notes`, optional disclosure or version references. |
| Response DTO | `ComplianceReviewDto` |
| Permission | `admin` |
| Screens | Future admin review workflow |
| Source tables | `compliance_reviews`, `investment_models`, `model_versions`, `model_disclosures`, `audit_logs` |
| Mock source | none yet |
| Safety notes | Design-only until RBAC/audit logging are implemented. Admin review is not a Codex legal judgment. |

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
