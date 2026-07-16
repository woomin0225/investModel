# DB schema drift read-only check

BK-485 compares the tracked schema surfaces without opening a database
connection or generating a migration:

- `docs/database/invest-model.dbml`
- `docs/database/invest-model.mysql.sql`
- `lib/db/schema.ts`

This check is intentionally read-only. It is a guard for naming and safety
drift, not a schema migration workflow.

## Expected coverage

The DBML and MySQL export are table-list aligned and are the broad canonical
contract for the investModel data model. They include identity, creator
marketplace metadata, model selection state, mock portfolio state, market/news
read models, signal scoring snapshots, feed interaction state, notifications,
and audit rows.

`lib/db/schema.ts` is the runtime Drizzle subset used by current app code. It
must keep the core app tables aligned with DBML/SQL for:

- identity and creator marketplace tables: `users`, `model_creators`,
  `investment_models`, `model_versions`, `model_risk_profiles`,
  `model_disclosures`, `portfolio_mandates`, `compliance_reviews`,
  `model_performance_snapshots`
- mock user state and portfolio tables: `user_model_selections`,
  `mock_deposits`, `portfolios`, `portfolio_positions`,
  `allocation_decisions`, `trade_intents`
- signal/feed tables currently used by runtime surfaces:
  `market_instruments`, `model_signal_events`, `signal_score_snapshots`,
  `signal_score_inputs`, `feed_posts`, `feed_post_comments`,
  `feed_post_reactions`, `feed_post_saves`, `feed_post_reads`,
  `user_notifications`

The DBML/SQL-only read-model and audit tables are expected to remain present in
the canonical docs until runtime code needs them:

- `user_profiles`
- `search_query_logs`
- `portfolio_analysis_snapshots`
- `market_price_snapshots`
- `news_sources`
- `news_articles`
- `news_traffic_snapshots`
- `feed_post_ranking_snapshots`
- `audit_logs`

`lib/db/schema.ts` also still contains starter SaaS tables that are outside the
investModel canonical DBML/SQL export:

- `teams`
- `team_members`
- `activity_logs`
- `invitations`

These are implementation residue from the starter app. They are not brokerage,
banking, payment-account, or order execution tables.

## Known drift to track

Current drift is documented here so it does not become silent:

- `users`: DBML/SQL define `public_id CHAR(36)`, `display_name`, nullable
  `password_hash`, `role` default `user`, and `status` default `active`.
  Drizzle currently defines `public_id varchar(120)`, `name`, non-null
  `password_hash`, `role` default `member`, and no `status`.
- `model_signal_events.source_article_id`: Drizzle has the column, but
  `news_articles` is still a DBML/SQL-only planning table, so the runtime schema
  cannot represent the SQL foreign key yet.
- `feed_post_ranking_snapshots`: DBML/SQL define the ranking read-model table,
  while Drizzle does not expose it yet.
- News and search provenance tables (`search_query_logs`,
  `market_price_snapshots`, `news_sources`, `news_articles`,
  `news_traffic_snapshots`) remain planning-only until their backend read models
  are implemented.

Future schema work should either close these drifts with a database workflow or
keep them listed here as intentional planning-only/runtime-subset differences.

## Safety guard

The schema surfaces must not introduce real-money or live brokerage execution
tables. `mock_deposits` is allowed because it is simulation-only seed/mock
state. The read-only smoke fails if these table names appear:

- `broker_orders`
- `order_executions`
- `executed_orders`
- `brokerage_accounts`
- `bank_accounts`
- `real_deposits`
- `payments`
- `withdrawals`

The allowed execution-adjacent table is `trade_intents`. It records simulated
intent state from model decisions and must not be treated as an actual order
execution or brokerage instruction.

## Naming contract

Canonical table and column names remain snake_case in all schema surfaces. The
important safety terms are:

- `mock_deposits` for simulated cash input
- `trade_intents` for simulated decision output
- `model_signal_events` for scored signal observations
- `feed_posts` and related `feed_post_*` tables for informational/social state
- `user_notifications` for app notification rows

Use `npm run test:db-schema-drift` before changing the schema contract. If a
future migration intentionally adds a new canonical table, update both this
document and `scripts/smoke/db-schema-drift-readonly-smoke.ts` in the same
commit.
