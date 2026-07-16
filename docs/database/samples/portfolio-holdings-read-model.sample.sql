-- Portfolio holdings read-model sample for investModel.
--
-- This representative projection supports BK-505/BK-507 mobile holdings and
-- allocation UI work. It reads tracked mock_seed rows only and must not be run
-- as an ad hoc data fix.
--
-- Scope:
-- - Projects PortfolioPositions with their MarketInstrument labels and the
--   parent PortfolioSummary simulated total.
-- - Keeps the allocation basis aligned to the PortfolioSummary total market
--   value and MockDeposit context.
-- - Does not create real holdings, broker positions, account links, orders,
--   fills, live balances, recommendations, or external paid API calls.

SELECT
  CONCAT('portfolio_holding_', pp.id) AS holding_public_id,
  p.id AS portfolio_id,
  mi.symbol,
  CONCAT(mi.name, ' simulated holding') AS holding_name,
  pp.quantity AS simulated_quantity,
  pp.market_value AS simulated_market_value,
  p.total_market_value AS source_portfolio_summary_total,
  ROUND((pp.market_value / NULLIF(p.total_market_value, 0)) * 100, 2) AS simulated_allocation_pct,
  md.source_type AS mock_deposit_source_type,
  'PortfolioSummary simulated total' AS allocation_basis_label,
  'not broker-confirmed' AS safety_label,
  pp.as_of AS captured_at
FROM portfolio_positions pp
JOIN portfolios p ON p.id = pp.portfolio_id
JOIN market_instruments mi ON mi.id = pp.instrument_id
LEFT JOIN mock_deposits md
  ON md.user_id = p.user_id
  AND md.source_type IN ('mock_seed', 'mock')
WHERE p.status = 'mock_active'
ORDER BY pp.market_value DESC, mi.symbol ASC
LIMIT 20;
