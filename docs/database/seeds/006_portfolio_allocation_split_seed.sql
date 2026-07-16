-- BK-508 Portfolio allocation split fixture guard.
-- Verification-only: this file documents and checks the derived allocation
-- split fixture; it does not insert rows.
--
-- Apply 001 and 005 before using this file. This fixture intentionally does
-- not insert rows: allocation split buckets are derived from the deterministic
-- PortfolioPosition rows created by 005_portfolio_holdings_seed.sql.
--
-- Expected simulated values:
-- - SAMPLE_AI_BASKET: 39000.00 USD (50%)
-- - QQQ: 23400.00 USD (30%)
-- - SHV: 15600.00 USD (20%)
-- - total simulated holdings: 78000.00 USD
--
-- Safety boundary:
-- - mock_seed / simulated read-model evidence only.
-- - no user-directed investment profile fields.
-- - no broker account, bank account, real cash movement, order execution,
--   fills, live quote dependency, paid API dependency, or investment advice.

SET @seed_user_id := (
  SELECT id FROM users
  WHERE public_id = 'user_demo_001'
  LIMIT 1
);

SET @seed_portfolio_id := (
  SELECT p.id
  FROM portfolios p
  INNER JOIN user_model_selections ums ON ums.id = p.user_model_selection_id
  WHERE ums.user_id = @seed_user_id
    AND p.status = 'simulation_ready'
  ORDER BY p.updated_at DESC
  LIMIT 1
);

-- Representative sector buckets. Sector labels are fixture-derived because
-- market_instruments does not currently own a sector column.
SELECT
  CASE mi.symbol
    WHEN 'SAMPLE_AI_BASKET' THEN 'AI infrastructure'
    WHEN 'QQQ' THEN 'Broad technology'
    WHEN 'SHV' THEN 'Cash / T-bills'
    ELSE 'Other simulated sector'
  END AS sector_bucket,
  GROUP_CONCAT(mi.symbol ORDER BY mi.symbol SEPARATOR ';') AS source_symbols,
  ROUND(SUM(pp.market_value), 2) AS simulated_market_value,
  ROUND((SUM(pp.market_value) / 78000.00) * 100, 2) AS simulated_weight_pct
FROM portfolio_positions pp
INNER JOIN market_instruments mi ON mi.id = pp.instrument_id
WHERE pp.portfolio_id = @seed_portfolio_id
  AND mi.symbol IN ('SAMPLE_AI_BASKET', 'QQQ', 'SHV')
GROUP BY sector_bucket
ORDER BY simulated_market_value DESC;

-- Representative asset-class buckets from market_instruments.asset_type.
SELECT
  mi.asset_type AS asset_class_bucket,
  GROUP_CONCAT(mi.symbol ORDER BY mi.symbol SEPARATOR ';') AS source_symbols,
  ROUND(SUM(pp.market_value), 2) AS simulated_market_value,
  ROUND((SUM(pp.market_value) / 78000.00) * 100, 2) AS simulated_weight_pct
FROM portfolio_positions pp
INNER JOIN market_instruments mi ON mi.id = pp.instrument_id
WHERE pp.portfolio_id = @seed_portfolio_id
  AND mi.symbol IN ('SAMPLE_AI_BASKET', 'QQQ', 'SHV')
GROUP BY mi.asset_type
ORDER BY simulated_market_value DESC;

-- Whole-fixture total guard. This must stay aligned with the PortfolioSummary
-- seed total from 001 and the PortfolioPosition seed values from 005.
SELECT
  ROUND(SUM(pp.market_value), 2) AS simulated_holdings_total,
  78000.00 AS expected_portfolio_summary_total,
  CASE
    WHEN ROUND(SUM(pp.market_value), 2) = 78000.00 THEN 'aligned'
    ELSE 'mismatch'
  END AS allocation_fixture_state
FROM portfolio_positions pp
INNER JOIN market_instruments mi ON mi.id = pp.instrument_id
WHERE pp.portfolio_id = @seed_portfolio_id
  AND mi.symbol IN ('SAMPLE_AI_BASKET', 'QQQ', 'SHV');
