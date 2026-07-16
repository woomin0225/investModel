-- Signal detail read-model sample for BK-541.
--
-- This projection joins seeded SignalEvent rows with score snapshots and
-- weighted driver inputs for the mobile Signal detail screen.
-- It is read-only observed context and must not be used as advice, a trading
-- recommendation, an order workflow, a broker connection, or live data source.

WITH latest_seed_snapshot AS (
  SELECT
    sss.id AS snapshot_id,
    sss.signal_event_id,
    sss.total_score,
    sss.rank_value,
    sss.rank_delta,
    sss.calculation_context,
    sss.captured_at
  FROM signal_score_snapshots sss
  WHERE sss.calculation_context = 'mock_seed'
    AND sss.captured_at = '2026-07-14 10:15:00'
)
SELECT
  mse.public_id AS signal_public_id,
  mv.public_id AS model_version_public_id,
  im.public_id AS model_public_id,
  im.name AS linked_model_name,
  mse.signal_type,
  mse.title AS signal_title,
  mse.summary AS observed_only_summary,
  mi.symbol AS source_symbol,
  mi.name AS source_label,
  lss.total_score AS snapshot_total_score,
  lss.rank_value AS snapshot_rank,
  lss.rank_delta AS snapshot_rank_delta,
  lss.calculation_context,
  ssi.source_type AS driver_source_type,
  ssi.source_label AS observed_driver_label,
  ssi.normalized_score AS driver_normalized_score,
  ssi.weight AS driver_weight,
  'observed-only seed/mock detail; no advice, no TradeIntent, no order, no brokerage, no live external data' AS safety_boundary
FROM model_signal_events mse
INNER JOIN model_versions mv
  ON mv.id = mse.model_version_id
INNER JOIN investment_models im
  ON im.id = mv.model_id
LEFT JOIN market_instruments mi
  ON mi.id = mse.source_instrument_id
INNER JOIN latest_seed_snapshot lss
  ON lss.signal_event_id = mse.id
INNER JOIN signal_score_inputs ssi
  ON ssi.score_snapshot_id = lss.snapshot_id
WHERE mse.public_id IN (
  'sig_mock_news_traffic_001',
  'sig_mock_price_trend_001',
  'sig_mock_risk_001'
)
ORDER BY lss.rank_value, ssi.normalized_score DESC;
