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

## Planned Seed Order

1. Identity and model creator rows for user 1 and sample creators.
2. InvestmentModel rows, model versions, mandates, risk profiles, disclosures.
3. SignalEvent rows, score snapshots, and mock ingestion inputs.
   - The first tracked slice is `003_signal_event_seed.sql`.
4. FeedPost rows, comments, reactions, saves, reads, and ranking examples.
   - The first tracked slice is `002_feed_interaction_seed.sql`.
5. MockDeposit, portfolio, positions, allocation decisions, and TradeIntent
   simulation rows.
6. User notifications and My Page activity rows.
   - Current notification center rows are derived from `feed_posts` and
     `feed_post_reads`, and `user_notifications` is now aligned in DBML, MySQL
     SQL, ORM schema, and migration.
   - Use `docs/database/samples/user-notifications-sample.sql` as the reviewed
     whole-file sample before promoting dedicated notification rows into a
     canonical seed file.
   - Current Portfolio time dashboard rows are derived from `portfolios`,
     `portfolio_positions`, `allocation_decisions`, and `trade_intents`;
     dedicated `portfolio_analysis_snapshots` seed rows should wait until that
     canonical table is aligned in ORM/migrations.

## Safety Rules

- Seed money must be named and documented as mock or simulated state.
- TradeIntent rows are pre-order simulation only, never orders or fills.
- SignalEvent and FeedPost rows are observed/informational context, not
  investment recommendations.
- External real-time search, traffic, or paid API data must not be required for
  seed application while IS-004 is open.
