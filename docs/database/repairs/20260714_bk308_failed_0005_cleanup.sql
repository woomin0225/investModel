-- BK-308 repair: clean up a local partial 0005 migration attempt before reapplying the tracked migration.
-- Reason: drizzle-kit attempted an empty trailing statement after the Portfolio ORM migration DDL.
-- Safe scope: these tables are new BK-308 mock/simulation read-model tables and had no seed rows when repaired.
-- Apply as a whole file, then rerun the tracked Drizzle migration.

DROP TABLE IF EXISTS trade_intents;
DROP TABLE IF EXISTS portfolio_positions;
DROP TABLE IF EXISTS allocation_decisions;
DROP TABLE IF EXISTS portfolios;
DROP TABLE IF EXISTS mock_deposits;
DROP TABLE IF EXISTS user_model_selections;
DROP TABLE IF EXISTS market_instruments;
