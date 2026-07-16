-- Home/Signals watchlist read-model sample for investModel.
--
-- This is a representative projection query, not an applyable migration or
-- seed file. It reads deterministic mock_seed rows created by tracked seed
-- files and explains the mobile watchlist shape expected by BK-492.
--
-- Scope:
-- - Projects existing InvestmentModel, ModelVersion, SignalEvent, and score
--   snapshot rows into a screen-facing watchlist fixture.
-- - Uses only mock_seed / simulated context for Home and Signals UI work.
-- - Does not create real accounts, real deposits, live market feeds, broker
--   connections, trade execution, recommendations, or external paid API calls.

SELECT
  CONCAT('watch_seed_', mse.public_id) AS watchlist_public_id,
  'model_signal_event' AS item_kind,
  im.public_id AS model_public_id,
  mv.public_id AS model_version_public_id,
  mse.public_id AS signal_public_id,
  mse.title,
  sss.rank_value AS rank_value,
  COALESCE(sss.total_score, mse.score) AS mock_score,
  mse.signal_type AS source_type,
  'mock_seed' AS seed_source_label,
  sss.calculation_context,
  COALESCE(sss.captured_at, mse.created_at) AS captured_at,
  'home_signals' AS display_surface,
  'observation_only' AS status_label,
  'No live trading, brokerage connection, real deposit, or financial advice' AS safety_label
FROM model_signal_events mse
JOIN model_versions mv ON mv.id = mse.model_version_id
JOIN investment_models im ON im.id = mv.model_id
LEFT JOIN signal_score_snapshots sss ON sss.signal_event_id = mse.id
WHERE mse.public_id LIKE 'sig_mock_%'
  AND (sss.calculation_context = 'mock_seed' OR sss.calculation_context IS NULL)
ORDER BY COALESCE(sss.rank_value, 999), COALESCE(sss.total_score, mse.score) DESC, mse.created_at DESC
LIMIT 6;
