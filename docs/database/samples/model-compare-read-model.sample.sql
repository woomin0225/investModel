-- Model compare read-model projection sample for BK-549.
--
-- This query documents the DB-backed shape expected by model comparison
-- screens. It reads seeded InvestmentModel, ModelVersion, risk, mandate,
-- disclosure, and backtest context only.
--
-- It does not create account actions, allocation decisions, TradeIntent rows,
-- broker connections, deposits, paid external API calls, or final legal copy.

SELECT
  im.public_id AS model_public_id,
  mv.public_id AS model_version_public_id,
  im.slug AS model_slug,
  im.name AS model_name,
  mc.display_name AS creator_name,
  im.status AS model_status,
  mv.strategy_summary,
  mrp.risk_level,
  mrp.leverage_allowed,
  mrp.derivative_allowed,
  mrp.short_selling_allowed,
  mrp.risk_summary,
  pm.allowed_markets,
  pm.allowed_asset_classes,
  pm.forbidden_assets,
  pm.min_cash_pct,
  pm.max_single_position_pct,
  pm.user_override_allowed,
  md.disclosure_type,
  md.title AS disclosure_title,
  md.requires_legal_review,
  mps.period_label AS backtest_period_label,
  mps.cumulative_return_pct,
  mps.volatility_pct,
  mps.max_drawdown_pct,
  mps.benchmark_symbol,
  mps.is_backtest,
  mps.measured_at,
  'mock_model_compare_projection' AS projection_source,
  'Mock model comparison only: informational metadata and backtest placeholders, no account action or paid external API.' AS safety_label
FROM investment_models im
INNER JOIN model_creators mc
  ON mc.id = im.creator_id
INNER JOIN model_versions mv
  ON mv.id = im.current_version_id
INNER JOIN model_risk_profiles mrp
  ON mrp.model_version_id = mv.id
INNER JOIN portfolio_mandates pm
  ON pm.model_version_id = mv.id
INNER JOIN model_disclosures md
  ON md.model_version_id = mv.id
INNER JOIN model_performance_snapshots mps
  ON mps.model_version_id = mv.id
WHERE im.slug IN (
  'quant-us-leverage-alpha',
  'macro-etf-balance',
  'defensive-income-rotation'
)
ORDER BY mps.measured_at DESC, im.name, md.disclosure_type;
