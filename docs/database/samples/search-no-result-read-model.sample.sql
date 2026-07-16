-- Search no-result seed/read-model projection sample for BK-567.
--
-- This documents grouped empty-state fallback rows for Search. It reads only
-- seeded InvestmentModel, FeedPost, and SignalEvent context while IS-004 blocks
-- live search volume, live quotes, paid APIs, broker accounts, deposits,
-- TradeIntent creation, real orders, account data, and financial advice.

SELECT
  'search_no_result_seed_model_keywords' AS group_public_id,
  'model' AS category,
  'Try a seeded model keyword' AS title,
  'No InvestmentModel matched this search. These fallback terms come from local InvestmentModel suggestion seeds.' AS empty_message,
  GROUP_CONCAT(DISTINCT im.name ORDER BY im.updated_at DESC SEPARATOR '|') AS suggested_keywords,
  'Seeded InvestmentModel fallback keywords' AS helper,
  'investment_models,model_versions' AS source_tables,
  'Model no-result fallback only: local seed keywords do not select a model, create a TradeIntent, place an order, or connect brokerage.' AS safety_label
FROM investment_models im
LEFT JOIN model_versions mv
  ON mv.id = im.current_version_id
WHERE im.visibility = 'marketplace'
  AND im.status IN ('approved', 'live')
LIMIT 1;

SELECT
  'search_no_result_seed_feed_keywords' AS group_public_id,
  'feed' AS category,
  'Try a seeded feed topic' AS title,
  'No FeedPost matched this search. These fallback terms come from local FeedPost and topic suggestion seeds.' AS empty_message,
  GROUP_CONCAT(DISTINCT fp.post_type ORDER BY fp.published_at DESC SEPARATOR '|') AS suggested_keywords,
  'Seeded FeedPost fallback keywords' AS helper,
  'feed_posts,search_query_logs' AS source_tables,
  'Feed no-result fallback only: informational seed context with no live search volume, no external search provider, no paid API, and no orders, deposits, or brokerage.' AS safety_label
FROM feed_posts fp
LEFT JOIN search_query_logs sqlg
  ON sqlg.result_scope = 'feed'
WHERE fp.visibility IN ('public', 'signed_in')
  AND fp.public_id LIKE 'feed_mock_%'
LIMIT 1;

SELECT
  'search_no_result_seed_signal_keywords' AS group_public_id,
  'signal' AS category,
  'Try a seeded signal keyword' AS title,
  'No SignalEvent matched this search. These fallback terms come from local observed SignalEvent suggestion seeds.' AS empty_message,
  GROUP_CONCAT(DISTINCT mse.signal_type ORDER BY mse.score DESC SEPARATOR '|') AS suggested_keywords,
  'Seeded SignalEvent fallback keywords' AS helper,
  'model_signal_events' AS source_tables,
  'Signal no-result fallback only: observed seed context with no live quote lookup, no realtime external data, no financial advice, and no orders, deposits, or brokerage.' AS safety_label
FROM model_signal_events mse
WHERE mse.public_id LIKE 'sig_mock_%'
LIMIT 1;
