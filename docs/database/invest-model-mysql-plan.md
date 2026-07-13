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
  - Realtime Signals: `model_signal_events`, `news_articles`, `news_traffic_snapshots`, `market_price_snapshots`
  - Model Detail: `model_versions`, `portfolio_mandates`, `model_risk_profiles`, `model_disclosures`
  - Feed Insights: `feed_posts`, `investment_models`, `users`

## Main Domains

- Identity and roles: `users`, `model_creators`
- AI model marketplace: `investment_models`, `model_versions`, `model_risk_profiles`, `model_disclosures`, `portfolio_mandates`, `compliance_reviews`
- User investment state: `user_model_selections`, `mock_deposits`, `portfolios`, `portfolio_positions`
- Decision pipeline: `allocation_decisions`, `trade_intents`
- Market and news signals: `market_instruments`, `market_price_snapshots`, `news_sources`, `news_articles`, `news_traffic_snapshots`, `model_signal_events`
- Product feed and auditability: `feed_posts`, `audit_logs`

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
