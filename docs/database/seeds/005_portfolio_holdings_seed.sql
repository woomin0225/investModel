-- Portfolio holdings seed slice for investModel.
--
-- Apply this file only as a complete tracked seed file after
-- 001_invest_model_domain_seed.sql. Do not copy individual statements into a
-- MySQL console for one-off edits.
--
-- Scope:
-- - Extends the demo PortfolioSummary with deterministic PortfolioPosition
--   rows for mobile holdings/allocation UI work.
-- - Keeps the simulated market values aligned with the existing seeded
--   PortfolioSummary total_market_value of 78000 USD.
-- - Uses only mock_seed / simulated context.
-- - Does not create real holdings, broker accounts, order execution, fills,
--   live balances, recommendations, bank links, or external paid API data.

SET @seed_user_public_id := 'user_demo_001';

SET @seed_user_id := (
  SELECT id FROM users WHERE public_id = @seed_user_public_id LIMIT 1
);

SET @seed_selection_id := (
  SELECT id FROM user_model_selections
  WHERE public_id = 'selection_demo_signal_001'
  LIMIT 1
);

SET @seed_portfolio_id := (
  SELECT id FROM portfolios
  WHERE user_id = @seed_user_id
    AND model_selection_id = @seed_selection_id
    AND status = 'mock_active'
  ORDER BY updated_at DESC
  LIMIT 1
);

INSERT INTO market_instruments (
  symbol,
  name,
  asset_type,
  market,
  exchange,
  currency,
  is_leveraged,
  is_active
)
SELECT 'QQQ', 'NASDAQ 100 sample ETF', 'equity_etf', 'US', 'SIMULATED', 'USD', 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM market_instruments WHERE symbol = 'QQQ' AND market = 'US'
);

INSERT INTO market_instruments (
  symbol,
  name,
  asset_type,
  market,
  exchange,
  currency,
  is_leveraged,
  is_active
)
SELECT 'SHV', 'Treasury bill sample ETF', 'cash_like_etf', 'US', 'SIMULATED', 'USD', 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM market_instruments WHERE symbol = 'SHV' AND market = 'US'
);

SET @sample_ai_basket_id := (
  SELECT id FROM market_instruments
  WHERE symbol = 'SAMPLE_AI_BASKET' AND market = 'US'
  LIMIT 1
);

SET @qqq_instrument_id := (
  SELECT id FROM market_instruments
  WHERE symbol = 'QQQ' AND market = 'US'
  LIMIT 1
);

SET @shv_instrument_id := (
  SELECT id FROM market_instruments
  WHERE symbol = 'SHV' AND market = 'US'
  LIMIT 1
);

UPDATE portfolio_positions
SET
  quantity = 12.50000000,
  average_price = 3120.000000,
  market_value = 39000.00,
  as_of = '2026-07-14 10:40:00'
WHERE portfolio_id = @seed_portfolio_id
  AND instrument_id = @sample_ai_basket_id;

INSERT INTO portfolio_positions (
  portfolio_id,
  instrument_id,
  quantity,
  average_price,
  market_value,
  as_of
)
SELECT
  @seed_portfolio_id,
  @qqq_instrument_id,
  60.00000000,
  390.000000,
  23400.00,
  '2026-07-14 10:40:00'
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_positions
  WHERE portfolio_id = @seed_portfolio_id
    AND instrument_id = @qqq_instrument_id
);

INSERT INTO portfolio_positions (
  portfolio_id,
  instrument_id,
  quantity,
  average_price,
  market_value,
  as_of
)
SELECT
  @seed_portfolio_id,
  @shv_instrument_id,
  130.00000000,
  120.000000,
  15600.00,
  '2026-07-14 10:40:00'
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_positions
  WHERE portfolio_id = @seed_portfolio_id
    AND instrument_id = @shv_instrument_id
);

-- Representative verification query:
-- SELECT
--   p.total_market_value AS portfolio_summary_total,
--   SUM(pp.market_value) AS simulated_holdings_total,
--   COUNT(pp.id) AS simulated_position_count
-- FROM portfolios p
-- JOIN portfolio_positions pp ON pp.portfolio_id = p.id
-- WHERE p.id = @seed_portfolio_id
-- GROUP BY p.total_market_value;
