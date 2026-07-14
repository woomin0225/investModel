# Requested Feature DB Gap Plan

This document completes BK-258. It reconciles the requested mobile/PWA features
with the current DB, API, and UI implementation so later automation loops do not
re-open already completed work or skip older `todo` rows.

Last checked: 2026-07-15

## Safety Boundary

All items below remain mock-safe or read-model based unless a later reviewed
task explicitly changes that boundary.

- Do not add real deposits, withdrawals, payment processing, brokerage account
  connections, live orders, fills, settlements, or broker webhooks.
- `SignalEvent` is observed input, not buy/sell/hold advice.
- `FeedPost` and comments are informational discussion, not investment advice.
- `MockDeposit`, `AllocationDecision`, and `TradeIntent` remain simulated
  prototype state.
- External search volume, traffic, price, or paid data APIs remain blocked by
  IS-004 until the data source, key ownership, terms, and review path are
  settled.

## Current Coverage

| Area | Current DB/API/UI coverage | Remaining gap |
| --- | --- | --- |
| Search | `GET /api/search` groups discoverable `InvestmentModel`, DB-backed `FeedPost`, and DB-backed `SignalEvent` results. `/invest-model/search` uses that route contract. | Ranking and external realtime search/traffic sources remain out of scope under IS-004. |
| Notifications | `GET /api/notifications` and `POST /api/notifications/mark-all-read` use FeedPost/read-state derived notification DTOs. `/invest-model/notifications` renders the route contract. | Dedicated notification schema, push, email, SMS, broker/account notifications are not implemented. |
| Signals list/filter | `model_signal_events` exists, seed rows exist, `GET /api/signals` supports `signalType`, and `/invest-model/signals` uses the DB read model. | Score snapshot table/service and realtime refresh remain pending; external inputs blocked by IS-004. |
| Signal detail | `GET /api/signals/:signalId` and `/invest-model/signals/:signalId` exist. Related Feed search link exists. | Evidence tables, score history, and richer source rows remain pending. |
| Feed list/detail | `GET /api/feed`, `GET /api/feed/:postId`, and `/invest-model/feed` plus detail routes exist. | Some legacy checklist rows still say todo, but core detail flow is implemented. |
| Feed comments/replies | Comment and reply create APIs exist and the detail UI can submit them. | Moderation admin workflow and delete/block states are not implemented. |
| Feed likes/saves/reads/ranking | Like, save, read APIs exist; detail UI is connected; ranking API and ranking card exist. | Cross-surface ranking reuse and long-window ranking snapshots remain pending. |
| Portfolio | `GET /api/portfolio/mock-summary` reads mock-safe DB-backed portfolio state; `/invest-model/portfolio` uses the route contract. | Time dashboard is currently a mock/read-model view; richer timeline rows and calculation rules remain pending. |
| My Page | `GET /api/my/activity` and `/invest-model/my` use DB-backed Feed activity and user summary data. | Full profile editing, dedicated saved/comment pages, and notification preferences remain pending. |
| Models | Discover, compare, search result, and detail screens exist with visible safety boundaries. | Model Detail still uses mock detail data rather than a fully DB-backed `GET /api/models/:id` contract. |

## Required Table Groups

Already represented in code or tracked migrations:

- `users`, `model_creators`
- `investment_models`, `model_versions`, `model_risk_profiles`,
  `model_disclosures`, `portfolio_mandates`, `compliance_reviews`,
  `model_performance_snapshots`
- `user_model_selections`
- `mock_deposits`, `portfolios`, `portfolio_positions`,
  `allocation_decisions`, `trade_intents`
- `model_signal_events`
- `feed_posts`, `feed_post_comments`, `feed_post_reactions`,
  `feed_post_saves`, `feed_post_reads`

Still needed before closing the older BK-259/BK-286 family completely:

- Signal score snapshot storage for raw source values, normalized score,
  weight, rank, and `captured_at`.
- Optional notification center tables if the prototype moves beyond FeedPost
  read-state derived notifications.
- Optional portfolio timeline/snapshot tables if the time dashboard stops using
  existing mock-safe summary rows.

## Implementation Order

1. Close bookkeeping first: completed `BK-258+` work must be mirrored into the
   `Done` sheet, not only marked `done` in `Backlog`.
2. Keep P0 work focused on contract gaps that still affect core user flows:
   Model Detail DB-backed detail API, signal score snapshots, and portfolio
   timeline read model.
3. Keep Feed mutation work bounded to local informational interaction state.
   Do not interpret likes, saves, reads, comments, or rankings as model quality,
   investment suitability, or return signals.
4. Keep notifications local until a dedicated notification schema is approved.
   Do not add push, email, SMS, broker, account, or order delivery channels.
5. Treat external data as research-only while IS-004 is open. Any implementation
   before source approval must use tracked mock or seed data.

## Checklist Reconciliation Notes

- `BK-258` can be considered complete when this document is committed and the
  row is copied to `Done`.
- `BK-259`, `BK-260`, `BK-286`, and `BK-287` are partially overtaken by later
  completed rows. They should be closed only after a targeted reconciliation
  pass compares their acceptance criteria against migrations, seeds, API routes,
  and smoke tests.
- Rows that are completed in `Backlog` but missing from `Done` should be copied
  to `Done` in the same automation loop that closes or reconciles them.
