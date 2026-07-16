-- BK-567 Search no-result read-model seed slice.
--
-- Review and apply as a whole file only after the base user seed exists.
-- These rows are local zero-result search telemetry for empty-state read models.
-- They do not collect external search-volume data, live quotes, paid API data,
-- account data, deposits, TradeIntent rows, orders, brokerage links, or advice.

USE invest_model;

INSERT INTO search_query_logs (
  user_id,
  query_text,
  result_scope,
  result_count,
  created_at
)
SELECT
  u.id,
  seed_rows.query_text,
  seed_rows.result_scope,
  0,
  seed_rows.created_at
FROM users u
JOIN (
  SELECT
    'small cap crypto leverage' AS query_text,
    'models' AS result_scope,
    TIMESTAMP('2026-07-16 10:10:00') AS created_at
  UNION ALL
  SELECT
    'broker deposit bonus',
    'feed',
    TIMESTAMP('2026-07-16 10:12:00')
  UNION ALL
  SELECT
    'instant buy signal',
    'signals',
    TIMESTAMP('2026-07-16 10:14:00')
) seed_rows
WHERE u.public_id = 'user_demo_001'
  AND NOT EXISTS (
    SELECT 1
    FROM search_query_logs existing
    WHERE existing.user_id = u.id
      AND existing.query_text = seed_rows.query_text
      AND existing.result_scope = seed_rows.result_scope
  );
