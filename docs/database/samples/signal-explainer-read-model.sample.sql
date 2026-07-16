-- Signal explainer read-model projection sample for BK-512.
--
-- This query documents the DB-backed shape expected by the mobile
-- "why it moved" SignalEvent explainer. It reads only tracked seed/mock
-- SignalEvent, score snapshot, and score input rows.
--
-- It does not create TradeIntent rows, real orders, broker connections,
-- deposits, account links, live quote lookups, or external paid API calls.

SELECT
  mse.public_id AS signal_public_id,
  mse.signal_type,
  mse.title AS signal_title,
  mse.summary AS explanation_summary,
  im.name AS linked_model_name,
  mi.symbol AS source_symbol,
  mi.name AS source_name,
  sss.total_score AS snapshot_total_score,
  sss.rank_value AS snapshot_rank,
  sss.rank_delta AS snapshot_rank_delta,
  sss.calculation_context,
  ssi.source_type AS driver_source_type,
  ssi.source_label AS driver_evidence_label,
  ssi.normalized_score AS driver_normalized_score,
  ssi.weight AS driver_weight
FROM model_signal_events mse
JOIN model_versions mv
  ON mv.id = mse.model_version_id
JOIN investment_models im
  ON im.id = mv.model_id
LEFT JOIN market_instruments mi
  ON mi.id = mse.source_instrument_id
JOIN signal_score_snapshots sss
  ON sss.signal_event_id = mse.id
JOIN signal_score_inputs ssi
  ON ssi.score_snapshot_id = sss.id
WHERE mse.public_id = 'sig_mock_news_traffic_001'
  AND sss.calculation_context = 'mock_seed'
ORDER BY sss.captured_at DESC, ssi.normalized_score DESC;
