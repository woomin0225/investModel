-- Price history seed fixture for investModel mini charts.
--
-- Apply this file only as a complete tracked seed file. Do not copy individual
-- statements into a MySQL console for one-off edits.
--
-- Scope:
-- - Creates bounded sample market_price_snapshots for the existing
--   SAMPLE_AI_BASKET instrument used by seeded SignalEvent rows.
-- - Marks every row as sample_backtest_window context through the provider and
--   source_url fields.
-- - Does not require live market data, broker links, external paid APIs, or
--   real-time quotes while IS-004 is open.

SET @price_seed_symbol := 'SAMPLE_AI_BASKET';
SET @price_seed_market := 'US';

SET @price_seed_instrument_id := (
  SELECT id
  FROM market_instruments
  WHERE symbol = @price_seed_symbol
    AND market = @price_seed_market
  LIMIT 1
);

INSERT INTO market_price_snapshots (
  instrument_id,
  provider,
  price,
  volume,
  captured_at,
  source_url
)
SELECT
  @price_seed_instrument_id,
  'mock_seed_sample_backtest_window',
  seed_rows.price,
  seed_rows.volume,
  seed_rows.captured_at,
  'mock://invest-model/price-history/sample-backtest-window'
FROM (
  SELECT CAST('124.100000' AS DECIMAL(18, 6)) AS price,
    CAST('120000.0000' AS DECIMAL(24, 4)) AS volume,
    CAST('2026-07-14 09:00:00' AS DATETIME) AS captured_at
  UNION ALL
  SELECT 125.350000, 118400.0000, '2026-07-14 10:00:00'
  UNION ALL
  SELECT 126.020000, 121800.0000, '2026-07-14 11:00:00'
  UNION ALL
  SELECT 124.880000, 119250.0000, '2026-07-14 12:00:00'
  UNION ALL
  SELECT 127.440000, 123100.0000, '2026-07-14 13:00:00'
  UNION ALL
  SELECT 128.120000, 122600.0000, '2026-07-14 14:00:00'
) AS seed_rows
WHERE @price_seed_instrument_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM market_price_snapshots mps
    WHERE mps.instrument_id = @price_seed_instrument_id
      AND mps.provider = 'mock_seed_sample_backtest_window'
      AND mps.captured_at = seed_rows.captured_at
  );

-- Representative verification query:
-- SELECT
--   mi.symbol,
--   mps.provider,
--   mps.price,
--   mps.volume,
--   mps.captured_at,
--   mps.source_url
-- FROM market_price_snapshots mps
-- JOIN market_instruments mi ON mi.id = mps.instrument_id
-- WHERE mi.symbol = 'SAMPLE_AI_BASKET'
--   AND mps.provider = 'mock_seed_sample_backtest_window'
-- ORDER BY mps.captured_at;
