-- Price history mini-chart read-model sample for investModel.
--
-- This is a representative projection query, not an applyable migration.
-- It reads deterministic mock_seed rows from market_price_snapshots and shows
-- the shape expected by BK-501/BK-502/BK-503.
--
-- Scope:
-- - Projects bounded sample price snapshots into mini-chart points.
-- - Uses only mock_seed / sample_backtest_window context.
-- - Does not create live quotes, real-time market data, broker connections,
--   trade instructions, recommendations, or external paid API calls.

SELECT
  CONCAT('price_hist_', mi.symbol, '_', DATE_FORMAT(mps.captured_at, '%Y%m%d%H%i')) AS point_public_id,
  mi.symbol AS instrument_symbol,
  mi.name AS instrument_name,
  mps.price AS sample_price,
  mps.volume AS sample_volume,
  mps.captured_at,
  mps.provider AS seed_provider,
  'sample_backtest_window' AS data_window_label,
  'mock_seed' AS seed_source_label,
  'mini_chart' AS display_surface,
  'No live market data, external paid API, brokerage connection, trade instruction, or financial advice' AS safety_label
FROM market_price_snapshots mps
JOIN market_instruments mi ON mi.id = mps.instrument_id
WHERE mi.symbol = 'SAMPLE_AI_BASKET'
  AND mps.provider = 'mock_seed_sample_backtest_window'
ORDER BY mps.captured_at;
