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
| `GET` | `/api/feed` | List model notes, market context, risk notes, and review notes. | signed-in | mock-backed allowed |
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
