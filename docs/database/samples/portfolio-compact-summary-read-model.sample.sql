-- Portfolio compact summary read-model sample for investModel.
--
-- This is a representative projection query, not an applyable migration or
-- seed file. It reads deterministic mock_seed rows created by tracked seed
-- files and explains the mobile compact PortfolioSummary shape expected by
-- BK-496.
--
-- Scope:
-- - Projects existing MockDeposit, PortfolioSummary, PortfolioPositions,
--   AllocationDecision, and pre-order TradeIntent context into a compact
--   mobile card fixture.
-- - Uses only mock_seed / simulated context for Portfolio UI work.
-- - Does not create real accounts, real deposits, live balances, broker
--   connections, order execution, recommendations, or external paid API calls.

SELECT
  CONCAT('portfolio_compact_', p.id) AS compact_summary_public_id,
  'PortfolioSummary' AS read_model_kind,
  ums.public_id AS selection_public_id,
  im.public_id AS model_public_id,
  mv.public_id AS model_version_public_id,
  CONCAT(md.amount, ' ', md.currency, ' MockDeposit') AS mock_deposit_label,
  md.status AS mock_deposit_status,
  md.source_type AS seed_source_label,
  CONCAT(p.total_market_value, ' ', p.currency, ' simulated') AS simulated_value_label,
  CONCAT(p.cash_balance, ' ', p.currency, ' mock cash buffer') AS mock_cash_buffer_label,
  COUNT(pp.id) AS simulated_position_count,
  COALESCE(ad.decision_status, 'mock_safe_fallback') AS allocation_decision_status,
  COALESCE(ti.status, 'mock_safe_fallback') AS trade_intent_status,
  'pre-order simulation only' AS trade_intent_boundary,
  'No real deposit, real balance, live order, brokerage connection, or financial advice' AS safety_label,
  p.updated_at AS captured_at
FROM portfolios p
JOIN user_model_selections ums ON ums.id = p.model_selection_id
JOIN investment_models im ON im.id = ums.model_id
JOIN model_versions mv ON mv.id = ums.model_version_id
LEFT JOIN mock_deposits md
  ON md.user_id = p.user_id
  AND md.source_type IN ('mock_seed', 'mock')
LEFT JOIN portfolio_positions pp ON pp.portfolio_id = p.id
LEFT JOIN allocation_decisions ad ON ad.portfolio_id = p.id
LEFT JOIN trade_intents ti ON ti.portfolio_id = p.id
WHERE p.status = 'mock_active'
  AND ums.status = 'active'
GROUP BY
  p.id,
  ums.public_id,
  im.public_id,
  mv.public_id,
  md.amount,
  md.currency,
  md.status,
  md.source_type,
  p.total_market_value,
  p.cash_balance,
  p.currency,
  ad.decision_status,
  ti.status,
  p.updated_at
ORDER BY p.updated_at DESC
LIMIT 3;
