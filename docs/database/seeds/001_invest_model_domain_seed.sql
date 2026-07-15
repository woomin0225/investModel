-- investModel application seed.
--
-- Apply this file only as a complete tracked seed file. Do not copy individual
-- statements into a MySQL console for one-off edits.
--
-- Scope:
-- - Creates the demo user, creator, InvestmentModel, ModelVersion, risk,
--   mandate, disclosure, and backtest context rows.
-- - Creates mock-safe SignalEvent rows, score snapshots, and score inputs.
-- - Creates informational FeedPost rows plus comments, likes, saves, and read
--   states. Notification center rows are currently derived from FeedPost read
--   state, not a real push/email/SMS provider.
-- - Creates MockDeposit, Portfolio, PortfolioPosition, AllocationDecision, and
--   TradeIntent simulation rows used by Home/Portfolio read models.
-- - Does not create real deposits, balances, orders, fills, broker links,
--   bank links, financial advice, legal conclusions, or external paid API data.

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
  'Demo Model Creator',
  'Local seed creator for mock-safe investModel screens.',
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
  'Seeded model shell for simulated signal, feed, and portfolio read models.'
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
  'Seeded rows only; no external realtime search, traffic, broker, or paid market API is required.',
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

INSERT INTO model_risk_profiles (
  model_version_id,
  risk_level,
  leverage_allowed,
  derivative_allowed,
  short_selling_allowed,
  concentration_limit_pct,
  expected_volatility_note,
  max_drawdown_note,
  risk_summary
)
SELECT
  @seed_version_id,
  'high',
  0,
  0,
  0,
  35.00,
  'Seeded volatility context only; not a future risk estimate.',
  'Seeded drawdown context only; not a loss limit or guarantee.',
  'Mock risk profile for AI infrastructure concentration and headline sensitivity.'
WHERE NOT EXISTS (
  SELECT 1 FROM model_risk_profiles
  WHERE model_version_id = @seed_version_id
);

INSERT INTO portfolio_mandates (
  model_version_id,
  allowed_markets,
  allowed_asset_classes,
  forbidden_assets,
  min_cash_pct,
  max_single_position_pct,
  leverage_policy,
  rebalance_policy,
  user_override_allowed
)
SELECT
  @seed_version_id,
  'US simulated market references only',
  'Equity basket references and cash-like mock state',
  'No leverage, derivatives, short selling, crypto, real orders, deposits, withdrawals, broker, or bank actions.',
  5.00,
  35.00,
  'No leverage in this seed.',
  'No rebalance is executed by this seed.',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_mandates
  WHERE model_version_id = @seed_version_id
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT
  @seed_version_id,
  'mock_seed_boundary',
  'Mock seed boundary',
  'This seeded model is for UI and API development only. It is not financial advice, a recommendation, or legal disclosure.',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @seed_version_id
    AND disclosure_type = 'mock_seed_boundary'
);

INSERT INTO model_performance_snapshots (
  model_version_id,
  period_label,
  cumulative_return_pct,
  volatility_pct,
  max_drawdown_pct,
  benchmark_symbol,
  is_backtest,
  measured_at
)
SELECT
  @seed_version_id,
  'sample_backtest_30d',
  4.2000,
  18.5000,
  -7.2500,
  'SAMPLE_AI_BASKET',
  1,
  '2026-07-14 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_performance_snapshots
  WHERE model_version_id = @seed_version_id
    AND period_label = 'sample_backtest_30d'
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
  'Seeded observation: mock risk checks flag concentration and volatility pressure. This is cautionary context, not legal, financial, or suitability advice.',
  68.7500,
  NULL,
  @seed_instrument_id,
  '2026-07-14 09:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_signal_events
  WHERE public_id = 'sig_mock_risk_001'
);

SET @signal_news_id := (
  SELECT id FROM model_signal_events WHERE public_id = 'sig_mock_news_traffic_001' LIMIT 1
);
SET @signal_price_id := (
  SELECT id FROM model_signal_events WHERE public_id = 'sig_mock_price_trend_001' LIMIT 1
);
SET @signal_risk_id := (
  SELECT id FROM model_signal_events WHERE public_id = 'sig_mock_risk_001' LIMIT 1
);

INSERT INTO signal_score_snapshots (
  signal_event_id,
  total_score,
  rank_value,
  rank_delta,
  calculation_context,
  captured_at,
  created_at
)
SELECT @signal_news_id, 84.7500, 1, NULL, 'mock_seed', '2026-07-14 10:00:00', '2026-07-14 10:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM signal_score_snapshots
  WHERE signal_event_id = @signal_news_id AND captured_at = '2026-07-14 10:00:00'
);

INSERT INTO signal_score_snapshots (
  signal_event_id,
  total_score,
  rank_value,
  rank_delta,
  calculation_context,
  captured_at,
  created_at
)
SELECT @signal_price_id, 78.4000, 2, NULL, 'mock_seed', '2026-07-14 10:00:00', '2026-07-14 10:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM signal_score_snapshots
  WHERE signal_event_id = @signal_price_id AND captured_at = '2026-07-14 10:00:00'
);

INSERT INTO signal_score_snapshots (
  signal_event_id,
  total_score,
  rank_value,
  rank_delta,
  calculation_context,
  captured_at,
  created_at
)
SELECT @signal_risk_id, 70.2500, 3, NULL, 'mock_seed', '2026-07-14 10:00:00', '2026-07-14 10:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM signal_score_snapshots
  WHERE signal_event_id = @signal_risk_id AND captured_at = '2026-07-14 10:00:00'
);

SET @snapshot_news_id := (
  SELECT id FROM signal_score_snapshots
  WHERE signal_event_id = @signal_news_id AND captured_at = '2026-07-14 10:00:00'
  LIMIT 1
);
SET @snapshot_price_id := (
  SELECT id FROM signal_score_snapshots
  WHERE signal_event_id = @signal_price_id AND captured_at = '2026-07-14 10:00:00'
  LIMIT 1
);
SET @snapshot_risk_id := (
  SELECT id FROM signal_score_snapshots
  WHERE signal_event_id = @signal_risk_id AND captured_at = '2026-07-14 10:00:00'
  LIMIT 1
);

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at,
  created_at
)
SELECT @snapshot_news_id, 'news_traffic', 84200.000000, 84.2000, 0.4500, 'Seeded mock headline traffic', '2026-07-14 10:00:00', '2026-07-14 10:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM signal_score_inputs
  WHERE score_snapshot_id = @snapshot_news_id AND source_type = 'news_traffic'
);

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at,
  created_at
)
SELECT @snapshot_news_id, 'ai_attention', 78000.000000, 78.0000, 0.2500, 'Seeded mock AI model attention', '2026-07-14 10:00:00', '2026-07-14 10:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM signal_score_inputs
  WHERE score_snapshot_id = @snapshot_news_id AND source_type = 'ai_attention'
);

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at,
  created_at
)
SELECT @snapshot_price_id, 'price_trend', 78100.000000, 78.1000, 0.4500, 'Seeded mock price trend', '2026-07-14 10:00:00', '2026-07-14 10:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM signal_score_inputs
  WHERE score_snapshot_id = @snapshot_price_id AND source_type = 'price_trend'
);

INSERT INTO signal_score_inputs (
  score_snapshot_id,
  source_type,
  raw_value,
  normalized_score,
  weight,
  source_label,
  captured_at,
  created_at
)
SELECT @snapshot_risk_id, 'model_inclusion', 70250.000000, 70.2500, 0.3000, 'Seeded mock risk model inclusion', '2026-07-14 10:00:00', '2026-07-14 10:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM signal_score_inputs
  WHERE score_snapshot_id = @snapshot_risk_id AND source_type = 'model_inclusion'
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_001',
  @seed_model_id,
  @seed_user_id,
  'market_context',
  'News traffic clusters around semiconductor supply chains',
  'Seeded informational commentary: public headlines mention semiconductor supply chain and AI infrastructure demand. This is reading context only, not buy, sell, hold, or rebalance advice.',
  'public',
  '2026-07-14 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_001'
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_002',
  @seed_model_id,
  @seed_user_id,
  'model_note',
  'Model note on seeded AI attention inputs',
  'Seeded model note: search traffic, news mentions, and price trend inputs are mock observations. No external realtime API, broker account, or investment decision is connected.',
  'public',
  '2026-07-14 09:12:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_002'
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_003',
  @seed_model_id,
  @seed_user_id,
  'risk_note',
  'Risk note for concentration and volatility context',
  'Seeded risk note: the sample data highlights volatility, concentration, and stale data risk. It does not recommend a transaction or guarantee an outcome.',
  'public',
  '2026-07-14 09:24:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_003'
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_004',
  @seed_model_id,
  @seed_user_id,
  'review_note',
  'Operator review placeholder for feed copy',
  'Seeded review note: this row helps verify feed detail and notification read state. It is not a legal conclusion, compliance approval, or performance claim.',
  'public',
  '2026-07-14 09:36:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_004'
);

INSERT INTO feed_post_comments (
  public_id,
  post_id,
  parent_comment_id,
  author_user_id,
  body,
  status,
  created_at
)
SELECT
  'feed_comment_mock_001',
  fp.id,
  NULL,
  @seed_user_id,
  'Sample comment: useful context, but not advice or an order signal.',
  'visible',
  '2026-07-14 09:45:00'
FROM feed_posts fp
WHERE fp.public_id = 'feed_mock_001'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_comments
    WHERE public_id = 'feed_comment_mock_001'
  );

INSERT INTO feed_post_comments (
  public_id,
  post_id,
  parent_comment_id,
  author_user_id,
  body,
  status,
  created_at
)
SELECT
  'feed_comment_mock_002',
  fp.id,
  parent.id,
  @seed_user_id,
  'Sample reply: score sources should stay visible and mock-labeled.',
  'visible',
  '2026-07-14 09:48:00'
FROM feed_posts fp
JOIN feed_post_comments parent
  ON parent.public_id = 'feed_comment_mock_001'
WHERE fp.public_id = 'feed_mock_001'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_comments
    WHERE public_id = 'feed_comment_mock_002'
  );

INSERT INTO feed_post_comments (
  public_id,
  post_id,
  parent_comment_id,
  author_user_id,
  body,
  status,
  created_at
)
SELECT
  'feed_comment_mock_003',
  fp.id,
  NULL,
  @seed_user_id,
  'Sample comment: risk notes need safety copy beside any score movement.',
  'visible',
  '2026-07-14 09:55:00'
FROM feed_posts fp
WHERE fp.public_id = 'feed_mock_003'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_comments
    WHERE public_id = 'feed_comment_mock_003'
  );

INSERT INTO feed_post_reactions (post_id, user_id, reaction_type, status, created_at)
SELECT fp.id, @seed_user_id, 'like', 'active', '2026-07-14 10:00:00'
FROM feed_posts fp
WHERE fp.public_id IN ('feed_mock_001', 'feed_mock_002', 'feed_mock_003')
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_reactions r
    WHERE r.post_id = fp.id
      AND r.user_id = @seed_user_id
      AND r.reaction_type = 'like'
  );

INSERT INTO feed_post_saves (post_id, user_id, status, saved_at)
SELECT fp.id, @seed_user_id, 'saved', '2026-07-14 10:05:00'
FROM feed_posts fp
WHERE fp.public_id IN ('feed_mock_002', 'feed_mock_003')
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_saves s
    WHERE s.post_id = fp.id
      AND s.user_id = @seed_user_id
  );

INSERT INTO feed_post_reads (post_id, user_id, read_at)
SELECT fp.id, @seed_user_id, '2026-07-14 10:10:00'
FROM feed_posts fp
WHERE fp.public_id IN ('feed_mock_001', 'feed_mock_002', 'feed_mock_003')
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_reads rd
    WHERE rd.post_id = fp.id
      AND rd.user_id = @seed_user_id
  );

-- Keep one deterministic unread notification candidate for notification center
-- smoke tests. This only resets demo FeedPost read state and never sends a real
-- push, email, SMS, account, broker, order, or advice notification.
DELETE rd
FROM feed_post_reads rd
JOIN feed_posts fp ON fp.id = rd.post_id
WHERE fp.public_id = 'feed_mock_004'
  AND rd.user_id = @seed_user_id;

INSERT INTO user_model_selections (
  public_id,
  user_id,
  model_id,
  model_version_id,
  status,
  risk_acknowledged_at,
  selected_at
)
SELECT
  'selection_demo_signal_001',
  @seed_user_id,
  @seed_model_id,
  @seed_version_id,
  'active',
  '2026-07-14 10:15:00',
  '2026-07-14 10:15:00'
WHERE NOT EXISTS (
  SELECT 1 FROM user_model_selections
  WHERE public_id = 'selection_demo_signal_001'
);

SET @seed_selection_id := (
  SELECT id FROM user_model_selections
  WHERE public_id = 'selection_demo_signal_001'
  LIMIT 1
);

INSERT INTO mock_deposits (
  user_id,
  amount,
  currency,
  status,
  source_type,
  memo,
  created_at,
  completed_at
)
SELECT
  @seed_user_id,
  100000.00,
  'USD',
  'simulated_available',
  'mock_seed',
  'MockDeposit seed only; not a real deposit, payment, bank transfer, or cash balance.',
  '2026-07-14 10:20:00',
  '2026-07-14 10:20:00'
WHERE NOT EXISTS (
  SELECT 1 FROM mock_deposits
  WHERE user_id = @seed_user_id
    AND source_type = 'mock_seed'
    AND memo LIKE 'MockDeposit seed only%'
);

INSERT INTO portfolios (
  user_id,
  model_selection_id,
  cash_balance,
  total_market_value,
  currency,
  status,
  created_at,
  updated_at
)
SELECT
  @seed_user_id,
  @seed_selection_id,
  22000.00,
  78000.00,
  'USD',
  'mock_active',
  '2026-07-14 10:25:00',
  '2026-07-14 10:40:00'
WHERE NOT EXISTS (
  SELECT 1 FROM portfolios
  WHERE user_id = @seed_user_id
    AND model_selection_id = @seed_selection_id
    AND status = 'mock_active'
);

SET @seed_portfolio_id := (
  SELECT id FROM portfolios
  WHERE user_id = @seed_user_id
    AND model_selection_id = @seed_selection_id
    AND status = 'mock_active'
  ORDER BY updated_at DESC
  LIMIT 1
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
  @seed_instrument_id,
  12.50000000,
  3120.000000,
  39000.00,
  '2026-07-14 10:40:00'
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_positions
  WHERE portfolio_id = @seed_portfolio_id
    AND instrument_id = @seed_instrument_id
);

INSERT INTO allocation_decisions (
  model_version_id,
  portfolio_id,
  decision_status,
  rationale,
  input_snapshot_json,
  policy_result_json,
  decided_at
)
SELECT
  @seed_version_id,
  @seed_portfolio_id,
  'ready_for_simulation',
  'Seeded AllocationDecision uses mock SignalEvent and portfolio context only. It is not advice, a rebalance command, or an order.',
  JSON_OBJECT(
    'source', 'BK-286 seed',
    'signalPublicIds', JSON_ARRAY('sig_mock_news_traffic_001', 'sig_mock_price_trend_001', 'sig_mock_risk_001'),
    'mockOnly', true
  ),
  JSON_OBJECT(
    'realOrderAllowed', false,
    'brokerageConnection', false,
    'financialAdvice', false
  ),
  '2026-07-14 10:45:00'
WHERE NOT EXISTS (
  SELECT 1 FROM allocation_decisions
  WHERE portfolio_id = @seed_portfolio_id
    AND decided_at = '2026-07-14 10:45:00'
);

SET @seed_allocation_decision_id := (
  SELECT id FROM allocation_decisions
  WHERE portfolio_id = @seed_portfolio_id
    AND decided_at = '2026-07-14 10:45:00'
  LIMIT 1
);

INSERT INTO trade_intents (
  allocation_decision_id,
  portfolio_id,
  instrument_id,
  intent_type,
  target_quantity,
  target_value,
  status,
  blocked_reason,
  created_at
)
SELECT
  @seed_allocation_decision_id,
  @seed_portfolio_id,
  @seed_instrument_id,
  'rebalance_simulation',
  0.00000000,
  0.00,
  'blocked_policy_check',
  'Seeded TradeIntent is blocked because real orders, fills, broker connections, and cash movement are outside MVP scope.',
  '2026-07-14 10:50:00'
WHERE NOT EXISTS (
  SELECT 1 FROM trade_intents
  WHERE allocation_decision_id = @seed_allocation_decision_id
    AND portfolio_id = @seed_portfolio_id
    AND instrument_id = @seed_instrument_id
    AND status = 'blocked_policy_check'
);

-- Representative verification queries:
-- SELECT COUNT(*) AS signal_count FROM model_signal_events WHERE public_id LIKE 'sig_mock_%';
-- SELECT COUNT(*) AS score_snapshot_count FROM signal_score_snapshots WHERE calculation_context = 'mock_seed';
-- SELECT COUNT(*) AS feed_post_count FROM feed_posts WHERE public_id LIKE 'feed_mock_%';
-- SELECT COUNT(*) AS notification_candidate_count
-- FROM feed_posts fp
-- LEFT JOIN feed_post_reads rd ON rd.post_id = fp.id AND rd.user_id = @seed_user_id
-- WHERE fp.public_id LIKE 'feed_mock_%' AND rd.id IS NULL;
-- SELECT p.status, p.cash_balance, p.total_market_value, COUNT(pp.id) AS position_count
-- FROM portfolios p
-- LEFT JOIN portfolio_positions pp ON pp.portfolio_id = p.id
-- WHERE p.id = @seed_portfolio_id
-- GROUP BY p.status, p.cash_balance, p.total_market_value;
