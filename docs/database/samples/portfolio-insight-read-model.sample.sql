-- Portfolio insight read-model sample for BK-536.
--
-- This projection joins the seeded PortfolioSummary, AllocationDecision,
-- TradeIntent, and portfolio_analysis_snapshots rows into screen-facing
-- allocation rationale and model status timeline evidence.
-- It is read-only fixture evidence and must not be used as advice, a real
-- account statement, or an order-capable workflow.

SET @seed_user_public_id := 'user_demo_001';

WITH selected_portfolio AS (
  SELECT
    p.id AS portfolio_id,
    'portfolio_demo_001' AS portfolio_public_id,
    ims.public_id AS selection_public_id,
    im.public_id AS model_public_id,
    mv.version_label,
    p.total_market_value
  FROM users u
  INNER JOIN user_model_selections ims ON ims.user_id = u.id
  INNER JOIN portfolios p ON p.model_selection_id = ims.id
  INNER JOIN investment_models im ON im.id = ims.model_id
  INNER JOIN model_versions mv ON mv.id = ims.model_version_id
  WHERE u.public_id = @seed_user_public_id
    AND ims.public_id = 'selection_demo_signal_001'
    AND p.status = 'mock_active'
  ORDER BY p.updated_at DESC
  LIMIT 1
),
latest_decision AS (
  SELECT
    ad.id AS allocation_decision_id,
    ad.portfolio_id,
    ad.decision_status,
    ad.rationale,
    ad.decided_at
  FROM allocation_decisions ad
  INNER JOIN selected_portfolio sp ON sp.portfolio_id = ad.portfolio_id
  ORDER BY ad.decided_at DESC
  LIMIT 1
),
policy_boundary AS (
  SELECT
    ti.portfolio_id,
    ti.status,
    ti.blocked_reason,
    ti.created_at
  FROM trade_intents ti
  INNER JOIN latest_decision lr
    ON lr.allocation_decision_id = ti.allocation_decision_id
  ORDER BY ti.created_at DESC
  LIMIT 1
),
timeline_rows AS (
  SELECT
    pas.snapshot_type,
    pas.headline,
    pas.summary,
    pas.total_market_value,
    pas.exposure_pct,
    pas.metadata_json,
    pas.captured_at
  FROM portfolio_analysis_snapshots pas
  INNER JOIN selected_portfolio sp ON sp.portfolio_id = pas.portfolio_id
  WHERE pas.snapshot_type IN ('allocation', 'timeline')
)
SELECT
  sp.portfolio_public_id,
  sp.selection_public_id,
  sp.model_public_id,
  CONCAT('ModelVersion ', sp.version_label, ' DB mock') AS model_version_label,
  lr.decision_status AS allocation_status,
  lr.rationale AS allocation_rationale,
  pb.status AS policy_boundary_status,
  pb.blocked_reason AS policy_boundary_reason,
  tr.snapshot_type,
  tr.headline,
  tr.summary,
  tr.total_market_value AS simulated_total_market_value,
  tr.exposure_pct AS simulated_exposure_pct,
  JSON_EXTRACT(tr.metadata_json, '$.mockOnly') AS mock_only,
  JSON_EXTRACT(tr.metadata_json, '$.realDeposit') AS real_deposit,
  JSON_EXTRACT(tr.metadata_json, '$.realBalance') AS real_balance,
  JSON_EXTRACT(tr.metadata_json, '$.realOrder') AS real_order,
  JSON_EXTRACT(tr.metadata_json, '$.brokerageConnection') AS brokerage_connection,
  JSON_EXTRACT(tr.metadata_json, '$.financialAdvice') AS financial_advice,
  JSON_UNQUOTE(JSON_EXTRACT(tr.metadata_json, '$.previousStatus')) AS previous_status,
  JSON_UNQUOTE(JSON_EXTRACT(tr.metadata_json, '$.nextStatus')) AS next_status,
  JSON_UNQUOTE(JSON_EXTRACT(tr.metadata_json, '$.actorRole')) AS actor_role,
  JSON_UNQUOTE(JSON_EXTRACT(tr.metadata_json, '$.reasonCode')) AS reason_code,
  tr.captured_at
FROM selected_portfolio sp
INNER JOIN latest_decision lr ON lr.portfolio_id = sp.portfolio_id
LEFT JOIN policy_boundary pb ON pb.portfolio_id = sp.portfolio_id
INNER JOIN timeline_rows tr ON TRUE
ORDER BY tr.captured_at;
