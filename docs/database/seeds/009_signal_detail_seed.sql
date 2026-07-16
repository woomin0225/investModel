-- Signal detail seed slice for investModel.
--
-- Apply this file only as a complete tracked seed file after
-- 003_signal_event_seed.sql.
--
-- Scope:
-- - Adds deterministic signal_score_snapshots and signal_score_inputs rows
--   for SignalEvent detail screens and observed driver breakdowns.
-- - Keeps every row mock_seed / observed-only / read-only.
-- - Does not create live market data, external paid API lookups, investment
--   advice, TradeIntent rows, real orders, broker links, deposits, or account
--   connections.

SET @signal_news_id := (
  SELECT id FROM model_signal_events
  WHERE public_id = 'sig_mock_news_traffic_001'
  LIMIT 1
);

SET @signal_price_id := (
  SELECT id FROM model_signal_events
  WHERE public_id = 'sig_mock_price_trend_001'
  LIMIT 1
);

SET @signal_risk_id := (
  SELECT id FROM model_signal_events
  WHERE public_id = 'sig_mock_risk_001'
  LIMIT 1
);

INSERT INTO signal_score_snapshots (
  signal_event_id,
  total_score,
  rank_value,
  rank_delta,
  calculation_context,
  captured_at
)
SELECT
  @signal_news_id,
  84.7500,
  1,
  NULL,
  'mock_seed',
  '2026-07-14 10:15:00'
WHERE @signal_news_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_snapshots
    WHERE signal_event_id = @signal_news_id
      AND calculation_context = 'mock_seed'
      AND captured_at = '2026-07-14 10:15:00'
  );

INSERT INTO signal_score_snapshots (
  signal_event_id,
  total_score,
  rank_value,
  rank_delta,
  calculation_context,
  captured_at
)
SELECT
  @signal_price_id,
  78.4000,
  2,
  -1,
  'mock_seed',
  '2026-07-14 10:15:00'
WHERE @signal_price_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_snapshots
    WHERE signal_event_id = @signal_price_id
      AND calculation_context = 'mock_seed'
      AND captured_at = '2026-07-14 10:15:00'
  );

INSERT INTO signal_score_snapshots (
  signal_event_id,
  total_score,
  rank_value,
  rank_delta,
  calculation_context,
  captured_at
)
SELECT
  @signal_risk_id,
  70.2500,
  3,
  1,
  'mock_seed',
  '2026-07-14 10:15:00'
WHERE @signal_risk_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_snapshots
    WHERE signal_event_id = @signal_risk_id
      AND calculation_context = 'mock_seed'
      AND captured_at = '2026-07-14 10:15:00'
  );

SET @snapshot_news_id := (
  SELECT id FROM signal_score_snapshots
  WHERE signal_event_id = @signal_news_id
    AND calculation_context = 'mock_seed'
    AND captured_at = '2026-07-14 10:15:00'
  LIMIT 1
);

SET @snapshot_price_id := (
  SELECT id FROM signal_score_snapshots
  WHERE signal_event_id = @signal_price_id
    AND calculation_context = 'mock_seed'
    AND captured_at = '2026-07-14 10:15:00'
  LIMIT 1
);

SET @snapshot_risk_id := (
  SELECT id FROM signal_score_snapshots
  WHERE signal_event_id = @signal_risk_id
    AND calculation_context = 'mock_seed'
    AND captured_at = '2026-07-14 10:15:00'
  LIMIT 1
);

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at
)
SELECT
  @snapshot_news_id,
  'news_traffic',
  128.000000,
  86.0000,
  0.4500,
  'Observed-only seeded headline traffic; not advice, allocation, or order evidence.',
  '2026-07-14 10:15:00'
WHERE @snapshot_news_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_inputs
    WHERE score_snapshot_id = @snapshot_news_id
      AND source_type = 'news_traffic'
  );

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at
)
SELECT
  @snapshot_news_id,
  'ai_attention',
  4.000000,
  82.0000,
  0.2500,
  'Observed-only seeded model attention overlap; no live search or paid API source.',
  '2026-07-14 10:15:00'
WHERE @snapshot_news_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_inputs
    WHERE score_snapshot_id = @snapshot_news_id
      AND source_type = 'ai_attention'
  );

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at
)
SELECT
  @snapshot_news_id,
  'model_inclusion',
  1.000000,
  74.0000,
  0.1000,
  'Observed-only link to the public mock ModelVersion; no model selection command.',
  '2026-07-14 10:15:00'
WHERE @snapshot_news_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_inputs
    WHERE score_snapshot_id = @snapshot_news_id
      AND source_type = 'model_inclusion'
  );

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at
)
SELECT
  @snapshot_price_id,
  'price_trend',
  6.200000,
  80.0000,
  0.5000,
  'Observed-only seeded SAMPLE_AI_BASKET movement; no live quote provider.',
  '2026-07-14 10:15:00'
WHERE @snapshot_price_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_inputs
    WHERE score_snapshot_id = @snapshot_price_id
      AND source_type = 'price_trend'
  );

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at
)
SELECT
  @snapshot_price_id,
  'model_inclusion',
  1.000000,
  70.0000,
  0.1500,
  'Observed-only model linkage for detail UI context; not a buy, sell, or hold signal.',
  '2026-07-14 10:15:00'
WHERE @snapshot_price_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_inputs
    WHERE score_snapshot_id = @snapshot_price_id
      AND source_type = 'model_inclusion'
  );

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at
)
SELECT
  @snapshot_risk_id,
  'risk',
  3.000000,
  72.0000,
  0.5500,
  'Observed-only seeded volatility and concentration caution; not suitability advice.',
  '2026-07-14 10:15:00'
WHERE @snapshot_risk_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_inputs
    WHERE score_snapshot_id = @snapshot_risk_id
      AND source_type = 'risk'
  );

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at
)
SELECT
  @snapshot_risk_id,
  'model_inclusion',
  1.000000,
  68.0000,
  0.1500,
  'Observed-only risk context attached to the public mock ModelVersion; no broker action.',
  '2026-07-14 10:15:00'
WHERE @snapshot_risk_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM signal_score_inputs
    WHERE score_snapshot_id = @snapshot_risk_id
      AND source_type = 'model_inclusion'
  );

-- Representative verification query:
-- SELECT
--   mse.public_id AS signal_public_id,
--   mse.signal_type,
--   sss.total_score,
--   sss.rank_value,
--   sss.calculation_context,
--   ssi.source_type,
--   ssi.source_label,
--   ssi.normalized_score,
--   ssi.weight
-- FROM model_signal_events mse
-- JOIN signal_score_snapshots sss ON sss.signal_event_id = mse.id
-- JOIN signal_score_inputs ssi ON ssi.score_snapshot_id = sss.id
-- WHERE mse.public_id IN (
--   'sig_mock_news_traffic_001',
--   'sig_mock_price_trend_001',
--   'sig_mock_risk_001'
-- )
--   AND sss.calculation_context = 'mock_seed'
--   AND sss.captured_at = '2026-07-14 10:15:00'
-- ORDER BY sss.rank_value, ssi.normalized_score DESC;
