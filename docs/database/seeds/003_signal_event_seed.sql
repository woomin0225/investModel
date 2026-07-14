-- Signal event seed for investModel.
--
-- Apply this file only as a complete tracked seed file. Do not copy individual
-- statements into a MySQL console for one-off edits.
--
-- Scope:
-- - Creates a local demo user, creator, model, model version, and instrument
--   when they are missing.
-- - Creates informational SignalEvent rows for seeded UI/API read-model work.
-- - Does not create real investment advice, real orders, broker links, or
--   external traffic/search data.

SET @seed_user_public_id := 'user_demo_001';
SET @seed_user_email := 'demo-user@investmodel.local';

INSERT INTO users (public_id, name, email, password_hash, role)
SELECT
  @seed_user_public_id,
  'Demo User',
  @seed_user_email,
  'mock_password_hash_not_for_login',
  'member'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE public_id = @seed_user_public_id
);

SET @seed_user_id := (
  SELECT id FROM users WHERE public_id = @seed_user_public_id LIMIT 1
);

INSERT INTO model_creators (user_id, display_name, bio, verification_status)
SELECT
  @seed_user_id,
  'Demo Signal Creator',
  'Local seed creator for simulated signal read-model screens.',
  'sample_only'
WHERE NOT EXISTS (
  SELECT 1 FROM model_creators WHERE user_id = @seed_user_id
);

SET @seed_creator_id := (
  SELECT id FROM model_creators WHERE user_id = @seed_user_id LIMIT 1
);

INSERT INTO investment_models (
  public_id,
  creator_id,
  slug,
  name,
  status,
  visibility,
  short_description
)
SELECT
  'model_demo_signal_001',
  @seed_creator_id,
  'demo-signal-observer',
  'Demo Signal Observer',
  'live',
  'public',
  'Seeded model shell for simulated signal ranking and detail screens.'
WHERE NOT EXISTS (
  SELECT 1 FROM investment_models WHERE public_id = 'model_demo_signal_001'
);

SET @seed_model_id := (
  SELECT id FROM investment_models
  WHERE public_id = 'model_demo_signal_001'
  LIMIT 1
);

INSERT INTO model_versions (
  public_id,
  model_id,
  version_label,
  strategy_summary,
  target_markets,
  asset_universe_summary,
  rebalance_frequency,
  input_data_summary,
  forbidden_scope,
  model_artifact_status,
  created_by_user_id,
  effective_from
)
SELECT
  'model_version_demo_signal_001',
  @seed_model_id,
  'v1.0-sample',
  'Tracks seeded model attention, mock news traffic, and price trend context for UI read-model development.',
  'US listed equities and thematic baskets in simulated context only.',
  'AI infrastructure and broad technology reference instruments used as mock observations.',
  'Not rebalanced by this seed file',
  'Seeded SignalEvent rows only; no external realtime search, traffic, broker, or paid market API is required.',
  'No buy, sell, hold, allocation, deposit, withdrawal, order, or broker connection instruction is produced by this seed.',
  'metadata_only',
  @seed_user_id,
  '2026-07-14 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_versions
  WHERE public_id = 'model_version_demo_signal_001'
);

SET @seed_version_id := (
  SELECT id FROM model_versions
  WHERE public_id = 'model_version_demo_signal_001'
  LIMIT 1
);

UPDATE investment_models
SET current_version_id = @seed_version_id
WHERE id = @seed_model_id
  AND (current_version_id IS NULL OR current_version_id <> @seed_version_id);

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
SELECT
  'SAMPLE_AI_BASKET',
  'Sample AI Infrastructure Basket',
  'equity_basket',
  'US',
  'SIMULATED',
  'USD',
  0,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM market_instruments
  WHERE symbol = 'SAMPLE_AI_BASKET'
    AND market = 'US'
);

SET @seed_instrument_id := (
  SELECT id FROM market_instruments
  WHERE symbol = 'SAMPLE_AI_BASKET'
    AND market = 'US'
  LIMIT 1
);

INSERT INTO model_signal_events (
  public_id,
  model_version_id,
  signal_type,
  title,
  summary,
  score,
  source_article_id,
  source_instrument_id,
  created_at
)
SELECT
  'sig_mock_news_traffic_001',
  @seed_version_id,
  'news_traffic',
  'AI chip headline traffic acceleration',
  'Seeded observation: multiple mock model notes and sample headlines point to higher attention around AI infrastructure. This is informational context only.',
  82.5000,
  NULL,
  @seed_instrument_id,
  '2026-07-14 09:10:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_signal_events
  WHERE public_id = 'sig_mock_news_traffic_001'
);

INSERT INTO model_signal_events (
  public_id,
  model_version_id,
  signal_type,
  title,
  summary,
  score,
  source_article_id,
  source_instrument_id,
  created_at
)
SELECT
  'sig_mock_price_trend_001',
  @seed_version_id,
  'price_trend',
  'Semiconductor basket trend watch',
  'Seeded observation: mock price trend inputs show stronger relative movement for the sample basket. The row does not imply a trade or allocation change.',
  76.2500,
  NULL,
  @seed_instrument_id,
  '2026-07-14 09:20:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_signal_events
  WHERE public_id = 'sig_mock_price_trend_001'
);

INSERT INTO model_signal_events (
  public_id,
  model_version_id,
  signal_type,
  title,
  summary,
  score,
  source_article_id,
  source_instrument_id,
  created_at
)
SELECT
  'sig_mock_risk_001',
  @seed_version_id,
  'risk',
  'Volatility and concentration risk alert',
  'Seeded observation: mock risk checks flag concentration and volatility pressure. This is a cautionary context row, not legal, financial, or suitability advice.',
  68.7500,
  NULL,
  @seed_instrument_id,
  '2026-07-14 09:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_signal_events
  WHERE public_id = 'sig_mock_risk_001'
);

-- Representative verification query:
-- SELECT
--   mse.public_id,
--   mse.signal_type,
--   mse.score,
--   mv.public_id AS model_version_public_id,
--   im.public_id AS model_public_id,
--   mi.symbol AS source_symbol
-- FROM model_signal_events mse
-- JOIN model_versions mv ON mv.id = mse.model_version_id
-- JOIN investment_models im ON im.id = mv.model_id
-- LEFT JOIN market_instruments mi ON mi.id = mse.source_instrument_id
-- WHERE mse.public_id LIKE 'sig_mock_%'
-- ORDER BY mse.score DESC, mse.created_at DESC;
