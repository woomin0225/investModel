# Database Seed Files

This directory owns SQL seed files that can be reviewed and applied as whole
files. Do not insert sample rows directly in a MySQL console for product work.

## Current Scope

- `001_invest_model_domain_seed.sql` is the canonical mock-safe app seed for
  the currently implemented read models. It creates the demo user, model,
  signals, score snapshots/inputs, feed posts/interactions, notification
  candidates derived from FeedPost read state, and Portfolio mock summary rows.
  Its seeded `ai_attention` and `model_inclusion` score inputs are reused by
  the mock-safe signal scoring service as DB-backed score evidence.
- `002_feed_interaction_seed.sql` is the first focused seed slice. It creates
  the local sample user plus FeedPost, comment, reply, like, save, and read
  rows needed by Feed detail/read-state work.
- `003_signal_event_seed.sql` creates the local demo creator, model, model
  version, simulated instrument, and SignalEvent rows needed by Signals
  filter/detail read-model work.
- `004_price_history_seed.sql` creates a bounded
  `mock_seed_sample_backtest_window` slice in `market_price_snapshots` for
  future mini-chart work. It is sample/backtest fixture data only and does not
  require live quotes, broker connectivity, paid APIs, or real-time feeds.
- `005_portfolio_holdings_seed.sql` extends the PortfolioSummary seed with
  deterministic `portfolio_positions` rows for mobile holdings/allocation UI
  work. It keeps the simulated holdings total aligned with the seeded
  PortfolioSummary total and never represents broker-confirmed holdings.
- `006_portfolio_allocation_split_seed.sql` is a verification-only fixture
  guard for BK-508. It derives sector and asset-class allocation buckets from
  the `005` holdings rows, checks the 78000 USD simulated total, and adds no
  user-directed preference fields, broker/bank links, orders, fills, or live
  data dependencies.
- `007_interest_save_state_seed.sql` refreshes a small private mock
  user-scoped FeedPost save state for shared Signals/Feed/Models interest UI
  work. It does not create model selections, deposits, allocation decisions,
  TradeIntent rows, broker links, orders, legal judgments, or external data.
- `008_portfolio_insight_seed.sql` adds mock-safe
  `portfolio_analysis_snapshots` rows for allocation rationale and model status
  timeline read-model work. It keeps `mockOnly` safety metadata and never adds
  real balance, order, broker connection, legal judgment, or advice fields.
- `009_signal_detail_seed.sql` extends the `003` SignalEvent slice with
  deterministic `signal_score_snapshots` and `signal_score_inputs` rows for
  Signal detail driver breakdowns. It keeps public ids, source labels, and
  observed-only wording, and it does not require live traffic, live quotes,
  external paid APIs, TradeIntent rows, orders, brokerage/account links, or
  financial advice.
- `010_feed_detail_seed.sql` extends the FeedPost detail slice with additional
  informational body rows plus comments, replies, reactions, saves, reads, and
  ranking examples for mobile detail screens. It keeps user state mock-scoped
  and does not require live feeds, push delivery, deposits, broker/account
  links, orders, TradeIntent rows, external paid APIs, or financial advice.
- `011_model_compare_read_model_seed.sql` creates three model comparison rows
  using existing InvestmentModel, ModelVersion, risk, mandate, disclosure, and
  backtest tables. It stays mock/backtest-only and does not add account action,
  TradeIntent, broker/bank, deposit, paid external API, or final legal fields.
- `012_notification_unavailable_read_model_seed.sql` creates notification
  center fallback rows for empty and unavailable states. It keeps
  `delivery_channel = 'in_app_mock'` and does not add push, email, SMS,
  account, broker, order, external provider, secret, or advice delivery.
- `013_admin_review_queue_seed.sql` creates pending, rejected, and paused
  admin review queue rows using ComplianceReview metadata and InvestmentModel
  paused status. It keeps model artifacts metadata-only, marks disclosure copy
  as requiring review, and does not add legal judgments, suitability approvals,
  deposits, allocation decisions, TradeIntent rows, broker/account links,
  orders, live data, or paid external APIs.
- `014_search_no_result_read_model_seed.sql` creates local zero-result
  `search_query_logs` rows for Search empty-state read models. It uses only the
  `models`, `feed`, and `signals` scopes and does not add external providers,
  live search volume, live quotes, account data, deposits, TradeIntent rows,
  orders, brokerage links, or financial advice.
- `015_my_page_activity_read_model_seed.sql` adds deterministic in-app mock
  notification rows so My Page can project saved FeedPost, visible comments,
  and notifications into one user-scoped activity list. It does not add account
  linkage, deposits, orders, TradeIntent rows, broker connections, external
  delivery, paid API data, or financial advice.
- `signal-score-mock-ingestion-job.md` defines the BK-301 mock ingestion job
  contract for appending score snapshots after seed application. It covers
  run id, idempotency, system actor/audit notes, representative read-model
  verification, and mock-only/observed-only safety boundaries.
- `../search-read-model-projection.md` defines the BK-307 grouped local search
  projection for InvestmentModel, SignalEvent, and FeedPost seed/read-model
  rows. It keeps search local and read-only while IS-004 is open.
- `../samples/search-suggestion-read-model.sample.sql` documents the BK-529
  Search suggestion chip seed/read-model projection for topic/model/signal
  keywords. It stays local and seed-only while IS-004 blocks live search
  volume, live quotes, paid APIs, orders, deposits, brokerage/account links,
  and financial advice.
- `../samples/search-no-result-read-model.sample.sql` documents the BK-567
  Search no-result grouped fallback projection for model, feed, and signal
  categories. It stays local and seed-only while IS-004 blocks live search
  volume, live quotes, paid APIs, account data, orders, deposits,
  brokerage/account links, and financial advice.
- `../samples/my-page-activity-read-model.sample.sql` documents the BK-572 My
  Page activity projection for saved FeedPost rows, visible comments, and
  `in_app_mock` notification rows.
- `../samples/signal-detail-read-model.sample.sql` documents the BK-541 Signal
  detail projection for public SignalEvent ids, source labels, score snapshot
  ranks, and observed driver breakdown rows.

## Planned Seed Order

1. Identity and model creator rows for user 1 and sample creators.
2. InvestmentModel rows, model versions, mandates, risk profiles, disclosures.
   - Use `011_model_compare_read_model_seed.sql` when compare screens need a
     stable risk/mandate/disclosure/backtest trio without adding new schema.
3. SignalEvent rows, score snapshots, and mock ingestion inputs.
   - The first tracked slice is `003_signal_event_seed.sql`.
   - Use `signal-score-mock-ingestion-job.md` before adding a scheduled or
     manual snapshot append wrapper.
   - Use `009_signal_detail_seed.sql` when a screen needs stable detail
     driver rows without invoking an ingestion job.
4. Bounded price-history fixture rows for mini charts.
   - The first tracked slice is `004_price_history_seed.sql`.
   - Use `docs/database/samples/price-history-read-model.sample.sql` as the
     representative projection before adding API or UI mini-chart work.
5. FeedPost rows, comments, reactions, saves, reads, and ranking examples.
   - The first tracked slice is `002_feed_interaction_seed.sql`.
   - Use `007_interest_save_state_seed.sql` for the shared private
     interest/save fixture before adding Signals/Feed/Models saved-state UI.
   - Use `010_feed_detail_seed.sql` and
     `docs/database/samples/feed-detail-read-model.sample.sql` before adding
     new Feed detail API or mobile detail states.
6. MockDeposit, portfolio, positions, allocation decisions, and TradeIntent
   simulation rows.
   - The first dedicated holdings slice is
     `005_portfolio_holdings_seed.sql`.
   - Use `docs/database/samples/portfolio-holdings-read-model.sample.sql` as
     the representative projection before adding holdings API/UI work.
   - Use `006_portfolio_allocation_split_seed.sql` and
     `docs/database/samples/portfolio-allocation-split-read-model.sample.sql`
     before adding allocation split API/UI work.
   - Use `008_portfolio_insight_seed.sql` and
     `docs/database/samples/portfolio-insight-read-model.sample.sql` before
     adding portfolio insight timeline/rationale API or UI work.
7. User notifications and My Page activity rows.
   - Current notification center rows are derived from `feed_posts` and
     `feed_post_reads`, and `user_notifications` is now aligned in DBML, MySQL
     SQL, ORM schema, and migration.
   - Use `docs/database/samples/user-notifications-sample.sql` as the reviewed
     whole-file sample before promoting dedicated notification rows into a
     canonical seed file.
   - Use `012_notification_unavailable_read_model_seed.sql` and
     `../samples/notification-unavailable-read-model.sample.sql` when a screen
     or API needs explicit empty and unavailable notification fallback rows.
   - Use `015_my_page_activity_read_model_seed.sql` and
     `../samples/my-page-activity-read-model.sample.sql` when My Page needs a
     single activity list from saved FeedPost, comment, and notification rows.
   - Current Portfolio insight rows can use
     `008_portfolio_insight_seed.sql` as the first dedicated
     `portfolio_analysis_snapshots` SQL seed slice; API code should still wait
     for ORM/migration alignment before querying that table directly.

## Safety Rules

- Seed money must be named and documented as mock or simulated state.
- TradeIntent rows are pre-order simulation only, never orders or fills.
- SignalEvent and FeedPost rows are observed/informational context, not
  investment recommendations.
- External real-time search, traffic, or paid API data must not be required for
  seed application while IS-004 is open.
