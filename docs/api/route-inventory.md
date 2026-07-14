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
| `GET` | `/api/signals` | List observed mock model signal events. | signed-in | mock-backed allowed |
| `GET` | `/api/signals/:signalId` | Read one observed signal detail by public id. | signed-in | detail contract defined; implementation pending |
| `GET` | `/api/feed` | List model notes, market context, risk notes, and review notes. | signed-in | mock-backed allowed |
| `GET` | `/api/feed/:postId` | Read one informational feed post detail by public id. | signed-in | DB-backed read implemented |
| `POST` | `/api/feed/:postId/comments` | Create a top-level informational comment. | signed-in | action contract defined; implementation pending |
| `POST` | `/api/feed/:postId/comments/:commentId/replies` | Create an informational reply comment. | signed-in | action contract defined; implementation pending |
| `POST` | `/api/feed/:postId/likes` | Toggle or set the signed-in user's like state. | signed-in | DB-backed action implemented |
| `POST` | `/api/feed/:postId/saves` | Toggle or set the signed-in user's saved state. | signed-in | action contract defined; implementation pending |
| `POST` | `/api/feed/:postId/read` | Mark the signed-in user's post as read. | signed-in | action contract defined; implementation pending |
| `POST` | `/api/model-selections` | Simulate a user selecting a specific model version. | user | mock-backed allowed |
| `GET` | `/api/portfolio/mock-summary` | Read selected model, mock balance, simulated allocation, and sample positions. | user | mock-backed allowed |
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
| Request | Optional query parameters later: `modelId`, `signalType`, `cursor`, `since`. |
| Response DTO | `SignalEventDto[]` |
| Permission | Signed-in user. Public access should be a later product decision. |
| Screens | Realtime Signals, Home signal preview |
| Source tables | `model_signal_events`, `market_instruments`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots` |
| Mock source | `lib/mock/invest-model-signals.ts` |
| Safety notes | Signals are observed inputs, not recommendations. They must not create live `TradeIntent` or order execution. |

### `GET /api/signals/:signalId`

| Field | Value |
| --- | --- |
| Purpose | Provide the future Signal Detail screen with one observed signal, related evidence, and score context. |
| Request | Path parameter `signalId` must resolve by `SignalEventDto.signalPublicId` or a stable URL-safe alias. Internal numeric database ids are not allowed in route params. |
| Response DTO | `SignalDetailDto`; list pages link by `SignalEventDto.signalPublicId`. |
| Permission | Signed-in user. Public access should be a later product decision. |
| Screens | Signal Detail |
| Source tables | `model_signal_events`, `market_instruments`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots`, future score snapshot/input tables from `BK-266` |
| Mock source | `lib/mock/invest-model-signals.ts` until detail fixtures exist. |
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

### `POST /api/feed/:postId/comments`

| Field | Value |
| --- | --- |
| Purpose | Create a top-level informational comment for a visible feed post. |
| Request | Path parameter `postId`; JSON body `{ body: string, clientRequestId?: string }`. |
| Response DTO | `FeedCommentDto` and optionally refreshed `FeedReactionStateDto` when counts change. |
| Permission | Signed-in user; only visible posts can receive comments. |
| Screens | Feed Detail |
| Source tables | Future `feed_post_comments` from `BK-293`, `feed_posts`, `users` |
| Mock source | Future feed interaction seed/sample files from `BK-293`. |
| Safety notes | Validate length/content, rate-limit later, store moderation-ready status, and treat comments as informational discussion only. No personalized advice, order, or trade instruction fields are allowed. |

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
| Source tables | Future `feed_post_saves` from `BK-293`, `feed_posts`, `users` |
| Mock source | Future feed interaction seed/sample files from `BK-293`. |
| Safety notes | Save state is a private reading shortcut only and must not be treated as model selection, portfolio allocation, or order intent. |

### `POST /api/feed/:postId/read`

| Field | Value |
| --- | --- |
| Purpose | Mark the signed-in user's feed post as read. |
| Request | Path parameter `postId`; optional JSON body `{ readAt?: string }` when a client timestamp is accepted later. |
| Response DTO | `FeedReactionStateDto` |
| Permission | Signed-in user; only the actor's own read state can change. |
| Screens | Feed Detail, Feed Insights list row actions |
| Source tables | Future `feed_post_reads` from `BK-293`, `feed_posts`, `users` |
| Mock source | Future feed interaction seed/sample files from `BK-293`. |
| Safety notes | Read state is private UI state. It must not expose other users' behavior or imply regulatory review/compliance approval. |

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
| Purpose | Provide Home/Portfolio with mock balance, selected model, simulated allocation, and sample positions. |
| Request | No body. Later query parameters may include `modelSelectionId`. |
| Response DTO | `PortfolioSummaryDto` |
| Permission | Signed-in `user` and only the user's own mock state. |
| Screens | Home, Portfolio |
| Source tables | `user_model_selections`, `mock_deposits`, `portfolios`, `portfolio_positions`, `market_instruments`, `model_signal_events` |
| Mock source | `lib/mock/invest-model-home.ts` |
| Safety notes | Must use mock/simulated labels. This route must not connect payments, bank accounts, brokerage accounts, or real balances. |

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
