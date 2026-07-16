-- Model compare read-model seed for investModel.
--
-- Apply this file only as a complete tracked seed file. Do not copy individual
-- statements into a MySQL console for one-off edits.
--
-- Scope:
-- - Creates three model comparison rows with risk, mandate, disclosure, and
--   backtest placeholder context.
-- - Uses existing InvestmentModel, ModelVersion, ModelRiskProfile,
--   PortfolioMandate, ModelDisclosure, and ModelPerformanceSnapshot tables.
-- - Does not create account actions, allocation decisions, TradeIntent rows,
--   broker links, bank links, deposits, final legal copy, or external paid API
--   data.

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
  'Demo Compare Creator',
  'Local seed creator for mock-safe model comparison rows.',
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
  'model_compare_quant_us_leverage_alpha',
  @seed_creator_id,
  'quant-us-leverage-alpha',
  'Quant US Leverage Alpha',
  'approved',
  'marketplace',
  'Mock compare row for a higher-volatility US equity factor model.'
WHERE NOT EXISTS (
  SELECT 1 FROM investment_models
  WHERE public_id = 'model_compare_quant_us_leverage_alpha'
);

SET @quant_model_id := (
  SELECT id FROM investment_models
  WHERE public_id = 'model_compare_quant_us_leverage_alpha'
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
  'model_version_compare_quant_us_leverage_alpha_v1',
  @quant_model_id,
  'v1-compare-seed',
  'Mock compare row for a higher-volatility US equity factor model.',
  'US simulated equity references',
  'Large-cap equity factors and cash-like mock state',
  'Monthly mock review cadence only',
  'Seeded compare rows only; no live market data, broker, or paid API source is required.',
  'No account action, allocation decision, TradeIntent, broker connection, or cash movement is produced by this seed.',
  'metadata_only',
  @seed_user_id,
  '2026-07-16 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_versions
  WHERE public_id = 'model_version_compare_quant_us_leverage_alpha_v1'
);

SET @quant_version_id := (
  SELECT id FROM model_versions
  WHERE public_id = 'model_version_compare_quant_us_leverage_alpha_v1'
  LIMIT 1
);

UPDATE investment_models
SET current_version_id = @quant_version_id
WHERE id = @quant_model_id
  AND (current_version_id IS NULL OR current_version_id <> @quant_version_id);

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
  @quant_version_id,
  'very_high',
  0,
  0,
  0,
  18.00,
  'Seeded high-volatility comparison context only.',
  'Seeded drawdown context only; not a loss limit or guarantee.',
  'Very high risk placeholder with concentration and drawdown context.'
WHERE NOT EXISTS (
  SELECT 1 FROM model_risk_profiles
  WHERE model_version_id = @quant_version_id
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
  @quant_version_id,
  'US simulated equity references',
  'Large-cap equity factors, cash-like mock state',
  'No leverage, derivatives, short selling, crypto, real account actions, or external paid data.',
  3.00,
  18.00,
  'No leverage in this compare seed.',
  'Monthly mock review cadence only.',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_mandates
  WHERE model_version_id = @quant_version_id
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT
  @quant_version_id,
  'mock_seed_boundary',
  'Mock seed boundary',
  'This compare row is for UI and API development only. It is informational placeholder copy awaiting review.',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @quant_version_id
    AND disclosure_type = 'mock_seed_boundary'
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT
  @quant_version_id,
  'risk_notice',
  'High volatility placeholder',
  'Risk text is seeded for comparison display and is not a finalized disclosure.',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @quant_version_id
    AND disclosure_type = 'risk_notice'
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT
  @quant_version_id,
  'backtest_notice',
  'Backtest-only context',
  'Backtest values are placeholders and do not imply future performance.',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @quant_version_id
    AND disclosure_type = 'backtest_notice'
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
  @quant_version_id,
  'sample_backtest_12m',
  11.8000,
  24.4000,
  -15.2000,
  'SAMPLE_US_FACTOR',
  1,
  '2026-07-16 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_performance_snapshots
  WHERE model_version_id = @quant_version_id
    AND period_label = 'sample_backtest_12m'
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
  'model_compare_macro_etf_balance',
  @seed_creator_id,
  'macro-etf-balance',
  'Macro ETF Balance',
  'live',
  'marketplace',
  'Mock compare row for diversified ETF rotation context.'
WHERE NOT EXISTS (
  SELECT 1 FROM investment_models
  WHERE public_id = 'model_compare_macro_etf_balance'
);

SET @macro_model_id := (
  SELECT id FROM investment_models
  WHERE public_id = 'model_compare_macro_etf_balance'
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
  'model_version_compare_macro_etf_balance_v1',
  @macro_model_id,
  'v1-compare-seed',
  'Mock compare row for diversified ETF rotation context.',
  'US simulated ETF references',
  'Equity ETF, bond ETF, and cash-like mock state',
  'Quarterly mock review cadence only',
  'Seeded compare rows only; no live market data, broker, or paid API source is required.',
  'No account action, allocation decision, TradeIntent, broker connection, or cash movement is produced by this seed.',
  'metadata_only',
  @seed_user_id,
  '2026-07-16 09:05:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_versions
  WHERE public_id = 'model_version_compare_macro_etf_balance_v1'
);

SET @macro_version_id := (
  SELECT id FROM model_versions
  WHERE public_id = 'model_version_compare_macro_etf_balance_v1'
  LIMIT 1
);

UPDATE investment_models
SET current_version_id = @macro_version_id
WHERE id = @macro_model_id
  AND (current_version_id IS NULL OR current_version_id <> @macro_version_id);

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
  @macro_version_id,
  'medium',
  0,
  0,
  0,
  28.00,
  'Seeded medium-volatility comparison context only.',
  'Seeded drawdown context only; not a loss limit or guarantee.',
  'Medium risk placeholder across broad ETF references and cash buffers.'
WHERE NOT EXISTS (
  SELECT 1 FROM model_risk_profiles
  WHERE model_version_id = @macro_version_id
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
  @macro_version_id,
  'US simulated ETF references',
  'Equity ETF, bond ETF, cash-like mock state',
  'No individual security execution, leverage, derivatives, crypto, or real account actions.',
  8.00,
  28.00,
  'No leverage in this compare seed.',
  'Quarterly mock review cadence only.',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_mandates
  WHERE model_version_id = @macro_version_id
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT @macro_version_id, 'mock_seed_boundary', 'Mock seed boundary',
  'This compare row is for UI and API development only. It is informational placeholder copy awaiting review.', 1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @macro_version_id
    AND disclosure_type = 'mock_seed_boundary'
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT @macro_version_id, 'risk_notice', 'Diversification placeholder',
  'Risk text is seeded for comparison display and is not a finalized disclosure.', 1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @macro_version_id
    AND disclosure_type = 'risk_notice'
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT @macro_version_id, 'backtest_notice', 'Backtest-only context',
  'Backtest values are placeholders and do not imply future performance.', 1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @macro_version_id
    AND disclosure_type = 'backtest_notice'
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
  @macro_version_id,
  'sample_backtest_12m',
  6.4000,
  11.9000,
  -6.8000,
  'SAMPLE_BALANCED_ETF',
  1,
  '2026-07-16 09:05:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_performance_snapshots
  WHERE model_version_id = @macro_version_id
    AND period_label = 'sample_backtest_12m'
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
  'model_compare_defensive_income_rotation',
  @seed_creator_id,
  'defensive-income-rotation',
  'Defensive Income Rotation',
  'approved',
  'marketplace',
  'Mock compare row for defensive income and lower drawdown context.'
WHERE NOT EXISTS (
  SELECT 1 FROM investment_models
  WHERE public_id = 'model_compare_defensive_income_rotation'
);

SET @income_model_id := (
  SELECT id FROM investment_models
  WHERE public_id = 'model_compare_defensive_income_rotation'
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
  'model_version_compare_defensive_income_rotation_v1',
  @income_model_id,
  'v1-compare-seed',
  'Mock compare row for defensive income and lower drawdown context.',
  'US simulated income references',
  'Dividend equity basket, bond ETF, and cash-like mock state',
  'Monthly mock risk review cadence only',
  'Seeded compare rows only; no live market data, broker, or paid API source is required.',
  'No account action, allocation decision, TradeIntent, broker connection, or cash movement is produced by this seed.',
  'metadata_only',
  @seed_user_id,
  '2026-07-16 09:10:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_versions
  WHERE public_id = 'model_version_compare_defensive_income_rotation_v1'
);

SET @income_version_id := (
  SELECT id FROM model_versions
  WHERE public_id = 'model_version_compare_defensive_income_rotation_v1'
  LIMIT 1
);

UPDATE investment_models
SET current_version_id = @income_version_id
WHERE id = @income_model_id
  AND (current_version_id IS NULL OR current_version_id <> @income_version_id);

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
  @income_version_id,
  'low',
  0,
  0,
  0,
  16.00,
  'Seeded low-volatility comparison context only.',
  'Seeded drawdown context only; not a loss limit or guarantee.',
  'Low risk placeholder focused on defensive income references.'
WHERE NOT EXISTS (
  SELECT 1 FROM model_risk_profiles
  WHERE model_version_id = @income_version_id
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
  @income_version_id,
  'US simulated income references',
  'Dividend equity basket, bond ETF, cash-like mock state',
  'No leverage, derivatives, short selling, crypto, or real account actions.',
  12.00,
  16.00,
  'No leverage in this compare seed.',
  'Monthly mock risk review cadence only.',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_mandates
  WHERE model_version_id = @income_version_id
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT @income_version_id, 'mock_seed_boundary', 'Mock seed boundary',
  'This compare row is for UI and API development only. It is informational placeholder copy awaiting review.', 1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @income_version_id
    AND disclosure_type = 'mock_seed_boundary'
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT @income_version_id, 'risk_notice', 'Income stability placeholder',
  'Risk text is seeded for comparison display and is not a finalized disclosure.', 1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @income_version_id
    AND disclosure_type = 'risk_notice'
);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT @income_version_id, 'backtest_notice', 'Backtest-only context',
  'Backtest values are placeholders and do not imply future performance.', 1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @income_version_id
    AND disclosure_type = 'backtest_notice'
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
  @income_version_id,
  'sample_backtest_12m',
  3.9000,
  7.4000,
  -3.6000,
  'SAMPLE_INCOME_BASKET',
  1,
  '2026-07-16 09:10:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_performance_snapshots
  WHERE model_version_id = @income_version_id
    AND period_label = 'sample_backtest_12m'
);

-- Representative verification query:
-- SELECT im.public_id, im.slug, mrp.risk_level, pm.user_override_allowed,
--   mps.period_label, mps.is_backtest, COUNT(md.id) AS disclosure_count
-- FROM investment_models im
-- JOIN model_versions mv ON mv.id = im.current_version_id
-- JOIN model_risk_profiles mrp ON mrp.model_version_id = mv.id
-- JOIN portfolio_mandates pm ON pm.model_version_id = mv.id
-- JOIN model_performance_snapshots mps ON mps.model_version_id = mv.id
-- JOIN model_disclosures md ON md.model_version_id = mv.id
-- WHERE im.slug IN ('quant-us-leverage-alpha', 'macro-etf-balance',
--   'defensive-income-rotation')
-- GROUP BY im.public_id, im.slug, mrp.risk_level, pm.user_override_allowed,
--   mps.period_label, mps.is_backtest;
