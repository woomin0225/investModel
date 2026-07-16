-- Portfolio insight seed slice for investModel.
--
-- Apply this file only as a complete tracked seed file after
-- 001_invest_model_domain_seed.sql and 005_portfolio_holdings_seed.sql.
--
-- Scope:
-- - Adds deterministic portfolio_analysis_snapshots rows for allocation
--   rationale and model status timeline read-model work.
-- - Keeps every row mock_seed / simulated / read-only.
-- - Does not create real deposits, real balances, broker accounts, order
--   execution, fills, legal judgments, recommendations, or external paid API
--   dependencies.

SET @seed_user_public_id := 'user_demo_001';

SET @seed_user_id := (
  SELECT id FROM users WHERE public_id = @seed_user_public_id LIMIT 1
);

SET @seed_selection_id := (
  SELECT id FROM user_model_selections
  WHERE public_id = 'selection_demo_signal_001'
  LIMIT 1
);

SET @seed_portfolio_id := (
  SELECT id FROM portfolios
  WHERE user_id = @seed_user_id
    AND model_selection_id = @seed_selection_id
    AND status = 'mock_active'
  ORDER BY updated_at DESC
  LIMIT 1
);

SET @seed_allocation_decision_id := (
  SELECT id FROM allocation_decisions
  WHERE portfolio_id = @seed_portfolio_id
    AND decided_at = '2026-07-14 10:45:00'
  LIMIT 1
);

INSERT INTO portfolio_analysis_snapshots (
  portfolio_id,
  allocation_decision_id,
  snapshot_type,
  headline,
  summary,
  cash_balance,
  total_market_value,
  exposure_pct,
  metadata_json,
  captured_at
)
SELECT
  @seed_portfolio_id,
  @seed_allocation_decision_id,
  'allocation',
  'Mock allocation rationale reviewed',
  'AllocationDecision rationale is screen evidence for simulated analysis only; it is not advice, a command, or an order.',
  NULL,
  78000.00,
  50.0000,
  JSON_OBJECT(
    'mockOnly', true,
    'simulated', true,
    'readOnly', true,
    'realDeposit', false,
    'realBalance', false,
    'realOrder', false,
    'brokerageConnection', false,
    'financialAdvice', false,
    'sourceTables', JSON_ARRAY('portfolio_positions', 'allocation_decisions', 'portfolio_analysis_snapshots')
  ),
  '2026-07-14 10:45:00'
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_analysis_snapshots
  WHERE portfolio_id = @seed_portfolio_id
    AND snapshot_type = 'allocation'
    AND headline = 'Mock allocation rationale reviewed'
    AND captured_at = '2026-07-14 10:45:00'
);

INSERT INTO portfolio_analysis_snapshots (
  portfolio_id,
  allocation_decision_id,
  snapshot_type,
  headline,
  summary,
  cash_balance,
  total_market_value,
  exposure_pct,
  metadata_json,
  captured_at
)
SELECT
  @seed_portfolio_id,
  @seed_allocation_decision_id,
  'timeline',
  'MockDeposit context ready',
  'Seeded mock funding context is available only as simulated PortfolioSummary input.',
  39000.00,
  78000.00,
  NULL,
  JSON_OBJECT(
    'mockOnly', true,
    'timelineState', 'mock_deposit_ready',
    'previousStatus', 'not_seeded',
    'nextStatus', 'mock_context_ready',
    'actorRole', 'mock_seed',
    'reasonCode', 'mock_deposit_seeded',
    'realDeposit', false,
    'realBalance', false,
    'realOrder', false,
    'brokerageConnection', false,
    'financialAdvice', false
  ),
  '2026-07-14 10:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_analysis_snapshots
  WHERE portfolio_id = @seed_portfolio_id
    AND snapshot_type = 'timeline'
    AND headline = 'MockDeposit context ready'
    AND captured_at = '2026-07-14 10:30:00'
);

INSERT INTO portfolio_analysis_snapshots (
  portfolio_id,
  allocation_decision_id,
  snapshot_type,
  headline,
  summary,
  cash_balance,
  total_market_value,
  exposure_pct,
  metadata_json,
  captured_at
)
SELECT
  @seed_portfolio_id,
  @seed_allocation_decision_id,
  'timeline',
  'Execution boundary blocked',
  'The related TradeIntent remains blocked by policy because real orders and broker connections are outside this MVP.',
  NULL,
  78000.00,
  NULL,
  JSON_OBJECT(
    'mockOnly', true,
    'timelineState', 'policy_blocked',
    'previousStatus', 'pre_order_simulation',
    'nextStatus', 'blocked_policy_check',
    'actorRole', 'policy_guard',
    'reasonCode', 'trade_intent_policy_blocked',
    'realDeposit', false,
    'realBalance', false,
    'realOrder', false,
    'brokerageConnection', false,
    'financialAdvice', false,
    'sourceTables', JSON_ARRAY('trade_intents', 'portfolio_analysis_snapshots')
  ),
  '2026-07-14 10:50:00'
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_analysis_snapshots
  WHERE portfolio_id = @seed_portfolio_id
    AND snapshot_type = 'timeline'
    AND headline = 'Execution boundary blocked'
    AND captured_at = '2026-07-14 10:50:00'
);

-- Representative verification query:
-- SELECT
--   snapshot_type,
--   headline,
--   JSON_EXTRACT(metadata_json, '$.mockOnly') AS mock_only,
--   JSON_EXTRACT(metadata_json, '$.realOrder') AS real_order,
--   JSON_EXTRACT(metadata_json, '$.brokerageConnection') AS brokerage_connection
-- FROM portfolio_analysis_snapshots
-- WHERE portfolio_id = @seed_portfolio_id
--   AND captured_at BETWEEN '2026-07-14 10:30:00' AND '2026-07-14 10:50:00'
-- ORDER BY captured_at;
