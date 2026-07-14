# investModel MySQL Database Plan

<!--
This document plans the MySQL database for investModel.
It translates the product goal, checklist, and Figma-based screens into database domains before implementation.
-->

## Scope

This is a planning schema, not a live migration.

The current starter still uses PostgreSQL and Drizzle. The requested target database is MySQL, so this plan creates MySQL-ready DBML and SQL separately. A later implementation task should update the runtime driver, ORM schema, migrations, environment variables, and seed scripts.

## Product Rules Reflected

- Users cannot manually choose risk style, stock/bond ratio, leverage preference, or asset allocation.
- Investment behavior comes from the selected AI model version and its mandate.
- Real fund movement and real brokerage order execution are not implemented in this schema. `mock_deposits`, `allocation_decisions`, and `trade_intents` keep this in a pre-order planning layer.
- Model status, review state, disclosure, and audit logs are first-class data.
- Figma screens are supported by direct read models:
  - Home: `user_model_selections`, `mock_deposits`, `portfolios`, `model_signal_events`
  - Discover Models: `investment_models`, `model_versions`, `model_risk_profiles`, `model_performance_snapshots`
  - Realtime Signals: `model_signal_events`, `signal_score_snapshots`, `signal_score_inputs`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots`
  - Model Detail: `model_versions`, `portfolio_mandates`, `model_risk_profiles`, `model_disclosures`
  - Feed Insights: `feed_posts`, `feed_post_comments`, `feed_post_reactions`, `feed_post_saves`, `feed_post_reads`, `feed_post_ranking_snapshots`, `investment_models`, `users`
  - Search: `search_query_logs` plus read-only queries over `investment_models`, `model_signal_events`, and `feed_posts`
  - Notifications: `user_notifications` for in-app mock notifications only; push, email, SMS, broker, order, and account notifications remain outside MVP scope
  - Portfolio timeline: `portfolio_analysis_snapshots` over simulated portfolio, allocation, SignalEvent, and MockDeposit context
  - My Page: `users`, `user_profiles`, user-scoped Feed interaction tables, and selected model state

## Main Domains

- Identity and roles: `users`, `user_profiles`, `model_creators`
- AI model marketplace: `investment_models`, `model_versions`, `model_risk_profiles`, `model_disclosures`, `portfolio_mandates`, `compliance_reviews`
- User investment state: `user_model_selections`, `mock_deposits`, `portfolios`, `portfolio_positions`, `portfolio_analysis_snapshots`
- Decision pipeline: `allocation_decisions`, `trade_intents`
- Market and news signals: `market_instruments`, `market_price_snapshots`, `news_sources`, `news_articles`, `news_traffic_snapshots`, `model_signal_events`, `signal_score_snapshots`, `signal_score_inputs`
- Search, notifications, and user activity: `search_query_logs`, `user_notifications`
- Product feed and auditability: `feed_posts`, `feed_post_comments`, `feed_post_reactions`, `feed_post_saves`, `feed_post_reads`, `feed_post_ranking_snapshots`, `audit_logs`

## Extension Boundaries

- `user_notifications` is an in-app mock notification ledger only. It must not be wired to push, email, SMS, broker, order, or account systems without a separate security/legal review.
- `search_query_logs` stores local prototype search telemetry. It does not collect external browser search-volume data.
- `signal_score_snapshots` and `signal_score_inputs` can store mock or reviewed scheduled scoring inputs. External search traffic, news traffic, AI attention, or paid market data remain blocked by `IS-004` until sources, keys, and terms are approved.
- `portfolio_analysis_snapshots` stores simulated timeline read-model values only. It does not represent real broker balances, real holdings, settled trades, or user-directed allocation preferences.

## Files

- DBML for dbdiagram: `docs/database/invest-model.dbml`
- MySQL script: `docs/database/invest-model.mysql.sql`
- dbdiagram render link: `docs/database/invest-model-dbdiagram-link-compressed.txt`
- ERD image: `dberd/invest-model-erd.png`
- dbdiagram render screenshot: `dberd/invest-model-dbdiagram-render.png`
- ERD source data: `dberd/invest-model-erd.json`

## Open Implementation Notes

- Choose whether to keep the SaaS starter `teams` and billing tables or replace them with simpler app roles.
- Update Drizzle from PostgreSQL to MySQL in a separate implementation task.
- Replace all `mock_*` data with regulated real-fund integrations only after legal, security, and financial-operation review.
- Legal wording in disclosures should remain placeholder data until reviewed by a qualified professional.
