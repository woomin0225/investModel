-- Feed topic cluster read-model projection sample for BK-516.
--
-- This query documents the DB-backed shape expected by Feed topic chips and
-- cluster rails. It reads only seeded FeedPost, SignalEvent, and model rows.
--
-- It does not call live news/search APIs, copy competitor brands, create
-- TradeIntent rows, real orders, broker connections, deposits, account links,
-- or external paid API calls.

SELECT
  'feed_topic_seed_ai_infra' AS cluster_public_id,
  'AI infrastructure attention' AS topic,
  'DB seed topic cluster only: no live news feed, paid API, copied competitor brand, financial advice, order, or brokerage connection.' AS safety_label,
  fp.public_id AS related_feed_post_public_id,
  fp.post_type AS related_feed_post_type,
  fp.title AS related_feed_post_title,
  im.name AS linked_model_name,
  mse.public_id AS related_signal_public_id,
  mse.signal_type AS related_signal_type,
  mse.title AS related_signal_title,
  mse.score AS related_signal_mock_score
FROM feed_posts fp
LEFT JOIN investment_models im
  ON im.id = fp.model_id
LEFT JOIN model_signal_events mse
  ON mse.signal_type IN ('news_traffic', 'price_trend')
WHERE fp.visibility = 'public'
  AND (
    LOWER(fp.title) LIKE '%ai%'
    OR LOWER(fp.title) LIKE '%semiconductor%'
    OR LOWER(fp.title) LIKE '%supply%'
    OR LOWER(fp.title) LIKE '%model%'
  )
ORDER BY fp.published_at DESC, mse.score DESC;

SELECT
  'feed_topic_seed_risk_watch' AS cluster_public_id,
  'Risk watch context' AS topic,
  'DB seed risk cluster only: no legal conclusion, recommendation, order, external paid API, or real account data.' AS safety_label,
  fp.public_id AS related_feed_post_public_id,
  fp.post_type AS related_feed_post_type,
  fp.title AS related_feed_post_title,
  im.name AS linked_model_name,
  mse.public_id AS related_signal_public_id,
  mse.signal_type AS related_signal_type,
  mse.title AS related_signal_title,
  mse.score AS related_signal_mock_score
FROM feed_posts fp
LEFT JOIN investment_models im
  ON im.id = fp.model_id
LEFT JOIN model_signal_events mse
  ON mse.signal_type = 'risk'
WHERE fp.visibility = 'public'
  AND (
    LOWER(fp.title) LIKE '%risk%'
    OR LOWER(fp.title) LIKE '%volatility%'
    OR LOWER(fp.title) LIKE '%concentration%'
  )
ORDER BY fp.published_at DESC, mse.score DESC;
