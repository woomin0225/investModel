-- Search suggestion seed/read-model projection sample for BK-529.
--
-- This documents the local DB-backed shape expected by Search suggestion chips.
-- It reads only seeded search/model/signal/feed context while IS-004 blocks
-- live search volume, live quotes, paid APIs, broker accounts, deposits,
-- TradeIntent creation, real orders, and financial advice.

SELECT
  'search_suggestion_seed_recent_query' AS suggestion_public_id,
  'topic' AS kind,
  sqlg.query_text AS label,
  sqlg.query_text AS query_text,
  'Seeded recent search query log keyword' AS helper,
  sqlg.result_scope AS result_scope,
  'DB seed search suggestion only: no live search volume, live quote lookup, paid API, advice, order, or brokerage connection.' AS safety_label
FROM search_query_logs sqlg
WHERE sqlg.query_text IS NOT NULL
ORDER BY sqlg.created_at DESC
LIMIT 6;

SELECT
  'search_suggestion_seed_model' AS suggestion_public_id,
  'model' AS kind,
  im.name AS label,
  im.name AS query_text,
  'Seeded InvestmentModel discovery keyword' AS helper,
  im.public_id AS related_model_public_id,
  mv.public_id AS related_model_version_public_id,
  'DB seed model suggestion only: local discovery context without model selection, TradeIntent creation, order, or broker action.' AS safety_label
FROM investment_models im
LEFT JOIN model_versions mv
  ON mv.id = im.current_version_id
WHERE im.visibility = 'marketplace'
  AND im.status IN ('approved', 'live')
ORDER BY im.updated_at DESC
LIMIT 6;

SELECT
  'search_suggestion_seed_signal' AS suggestion_public_id,
  'signal' AS kind,
  mse.title AS label,
  mse.signal_type AS query_text,
  'Seeded SignalEvent caution or attention keyword' AS helper,
  mse.public_id AS related_signal_public_id,
  'DB seed signal suggestion only: observed input context without realtime external data, advice, order, or brokerage action.' AS safety_label
FROM model_signal_events mse
WHERE mse.public_id LIKE 'sig_mock_%'
ORDER BY mse.score DESC, mse.created_at DESC
LIMIT 6;

SELECT
  'search_suggestion_seed_feed_topic' AS suggestion_public_id,
  'topic' AS kind,
  fp.title AS label,
  fp.post_type AS query_text,
  'Seeded FeedPost topic keyword' AS helper,
  fp.public_id AS related_feed_post_public_id,
  'DB seed FeedPost suggestion only: informational context without live feeds, paid APIs, advice, orders, or broker actions.' AS safety_label
FROM feed_posts fp
WHERE fp.visibility IN ('public', 'signed_in')
  AND fp.public_id LIKE 'feed_mock_%'
ORDER BY fp.published_at DESC, fp.created_at DESC
LIMIT 6;
