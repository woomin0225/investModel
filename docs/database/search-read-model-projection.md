# Search Read Model Projection

This document defines the BK-307 local DB search projection used by
`GET /api/search`. It is a read-model contract, not a new external search
provider.

## Scope

`GET /api/search` groups local DB-backed records into one search surface:

| Entity type | Source tables | Public id | Title | Snippet | Tags |
| --- | --- | --- | --- | --- | --- |
| `investment_model` | `investment_models`, `model_versions`, `model_risk_profiles`, `model_performance_snapshots`, `model_creators` | `investment_models.public_id` and `model_versions.public_id` | `investment_models.name` | `investment_models.short_description` or risk summary | target markets, asset classes, review label |
| `signal_event` | `model_signal_events`, `signal_score_snapshots`, `model_versions`, `investment_models`, `market_instruments` | `model_signal_events.public_id` | `model_signal_events.title` | signal summary and source label | signal type, linked model, score display |
| `feed_post` | `feed_posts`, `investment_models`, `users` | `feed_posts.public_id` | `feed_posts.title` | body/excerpt text | post type, linked model, tags |

The current implementation does this as a query-time projection in
`app/api/search/route.ts`. A physical `search_documents` table is not required
until query volume or ranking requirements outgrow the grouped read-model
approach.

## Result Shape

Every projected result must include:

- entity type through its group: `investmentModels`, `signalEvents`, or
  `feedPosts`
- public id only; no internal numeric database id
- `title` or group-specific display name
- `summary`/body/snippet text
- route-local `href`
- local seed/mock context through API `meta`

## Permission Filter

Search is signed-in read-only retrieval.

- Allowed roles: `user`, `admin`.
- Blocked roles: `public`, `creator`, `system`.
- `investment_model` rows must be public discovery rows only: marketplace/live
  or already-approved rows exposed by the model read model.
- `feed_post` rows must remain informational and visible to signed-in users.
- `signal_event` rows must remain observed input and visible to signed-in users.
- Hidden, private, admin-only, suspended, retired, draft, or pending-review-only
  rows must not appear in user search results.

## Query Strategy

The route may use current read-model helpers:

- `readModelCardDtos`
- `readSignalEventDtos`
- `readFeedPostDtos`

Filtering is local string matching over public display fields. Empty `q` returns
the grouped local discovery set. Query text is trimmed and capped at 120
characters. While IS-004 is open, the route must not call external search,
search traffic, news traffic, paid market data, brokerage, account, or
recommendation providers.

## Representative Seed Verification

After applying the tracked local seeds, the read model should prove that all
three groups can be searched without external data:

```sql
-- InvestmentModel discovery rows
SELECT im.public_id, im.slug, im.name, im.status, im.visibility
FROM investment_models im
WHERE im.status IN ('approved', 'live')
  AND im.visibility = 'marketplace';

-- SignalEvent search rows
SELECT mse.public_id, mse.title, mse.signal_type, mv.public_id AS model_version_public_id
FROM model_signal_events mse
JOIN model_versions mv ON mv.id = mse.model_version_id
WHERE mse.public_id LIKE 'sig_mock_%';

-- FeedPost search rows
SELECT fp.public_id, fp.title, fp.post_type, fp.visibility
FROM feed_posts fp
WHERE fp.public_id LIKE 'feed_mock_%'
  AND fp.visibility = 'signed_in';
```

## Safety Boundary

Search results are navigation and information retrieval only.

- No recommendation or suitability judgement.
- No model selection creation.
- No `TradeIntent` creation.
- No real order, execution, fill, settlement, or broker action.
- No real account, bank, brokerage, or cash-balance lookup.
- No external paid API, search provider, or secret key.

The API meta must keep `readOnly: true`, `modelDiscoveryOnly: true`,
`realtimeExternalData: false`, `financialAdvice: false`,
`modelSelectionCreated: false`, `tradeIntentCreated: false`, `realOrder: false`,
and `brokerageConnection: false`.
