-- Portfolio allocation split read-model sample for BK-508.
--
-- This projection derives mock allocation buckets from the 005 holdings seed.
-- It is read-only fixture evidence for mobile UI/API work and must not be used
-- as a user-directed allocation profile, a broker statement, or advice.

SET @seed_user_public_id := 'user_demo_001';
SET @expected_simulated_total := 78000.00;

WITH selected_portfolio AS (
  SELECT p.id AS portfolio_id
  FROM users u
  INNER JOIN user_model_selections ums ON ums.user_id = u.id
  INNER JOIN portfolios p ON p.user_model_selection_id = ums.id
  WHERE u.public_id = @seed_user_public_id
    AND p.status = 'simulation_ready'
  ORDER BY p.updated_at DESC
  LIMIT 1
),
seed_positions AS (
  SELECT
    mi.symbol,
    mi.asset_type,
    pp.market_value,
    CASE mi.symbol
      WHEN 'SAMPLE_AI_BASKET' THEN 'AI infrastructure'
      WHEN 'QQQ' THEN 'Broad technology'
      WHEN 'SHV' THEN 'Cash / T-bills'
      ELSE 'Other simulated sector'
    END AS sector_bucket
  FROM selected_portfolio sp
  INNER JOIN portfolio_positions pp ON pp.portfolio_id = sp.portfolio_id
  INNER JOIN market_instruments mi ON mi.id = pp.instrument_id
  WHERE mi.symbol IN ('SAMPLE_AI_BASKET', 'QQQ', 'SHV')
)
SELECT
  'sector' AS bucket_type,
  sector_bucket AS bucket_label,
  GROUP_CONCAT(symbol ORDER BY symbol SEPARATOR ';') AS source_symbols,
  ROUND(SUM(market_value), 2) AS simulated_market_value,
  ROUND((SUM(market_value) / @expected_simulated_total) * 100, 2) AS simulated_weight_pct,
  'simulated allocation bucket' AS safety_label
FROM seed_positions
GROUP BY sector_bucket
UNION ALL
SELECT
  'asset_class' AS bucket_type,
  asset_type AS bucket_label,
  GROUP_CONCAT(symbol ORDER BY symbol SEPARATOR ';') AS source_symbols,
  ROUND(SUM(market_value), 2) AS simulated_market_value,
  ROUND((SUM(market_value) / @expected_simulated_total) * 100, 2) AS simulated_weight_pct,
  'simulated allocation bucket' AS safety_label
FROM seed_positions
GROUP BY asset_type
ORDER BY bucket_type, simulated_market_value DESC;
