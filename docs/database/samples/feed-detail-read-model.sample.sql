-- Feed detail read-model projection sample for BK-545.
--
-- This query documents the DB-backed shape expected by a Feed detail mobile
-- screen. It reads only seeded FeedPost body, reactions, saves, comments, and
-- read state.
--
-- It does not call live news/search APIs, create TradeIntent rows, real orders,
-- broker connections, deposits, push delivery, account links, or external paid
-- API calls.

SET @seed_user_public_id := 'user_demo_001';
SET @seed_user_id := (
  SELECT id FROM users WHERE public_id = @seed_user_public_id LIMIT 1
);

SELECT
  fp.public_id AS post_public_id,
  fp.title,
  fp.body,
  fp.post_type,
  fp.visibility,
  fp.published_at,
  im.public_id AS linked_model_public_id,
  im.name AS linked_model_name,
  GROUP_CONCAT(DISTINCT mse.public_id ORDER BY mse.score DESC) AS related_signal_public_ids,
  COUNT(DISTINCT visible_comments.id) AS visible_comment_count,
  COUNT(DISTINCT active_likes.id) AS active_like_count,
  MAX(CASE WHEN saves.status = 'saved' THEN 1 ELSE 0 END) AS saved_by_seed_user,
  MAX(CASE WHEN reads.read_at IS NOT NULL THEN 1 ELSE 0 END) AS read_by_seed_user,
  MAX(saves.saved_at) AS saved_at,
  MAX(reads.read_at) AS read_at,
  'mock/informational only: no advice, order, broker link, push delivery, live data, or paid API' AS safety_label
FROM feed_posts fp
LEFT JOIN investment_models im
  ON im.id = fp.model_id
LEFT JOIN model_versions mv
  ON mv.model_id = im.id
LEFT JOIN model_signal_events mse
  ON mse.model_version_id = mv.id
LEFT JOIN feed_post_comments visible_comments
  ON visible_comments.post_id = fp.id
  AND visible_comments.status = 'visible'
LEFT JOIN feed_post_reactions active_likes
  ON active_likes.post_id = fp.id
  AND active_likes.reaction_type = 'like'
  AND active_likes.status = 'active'
LEFT JOIN feed_post_saves saves
  ON saves.post_id = fp.id
  AND saves.user_id = @seed_user_id
LEFT JOIN feed_post_reads reads
  ON reads.post_id = fp.id
  AND reads.user_id = @seed_user_id
WHERE fp.visibility = 'public'
  AND fp.public_id IN ('feed_mock_detail_001', 'feed_mock_detail_002', 'feed_mock_001')
GROUP BY
  fp.public_id,
  fp.title,
  fp.body,
  fp.post_type,
  fp.visibility,
  fp.published_at,
  im.public_id,
  im.name
ORDER BY fp.published_at DESC;

SELECT
  fp.public_id AS post_public_id,
  c.public_id AS comment_public_id,
  parent.public_id AS parent_comment_public_id,
  c.body,
  c.status,
  c.created_at,
  'visible comments only; moderation states stay hidden from the public detail projection' AS moderation_label
FROM feed_post_comments c
JOIN feed_posts fp
  ON fp.id = c.post_id
LEFT JOIN feed_post_comments parent
  ON parent.id = c.parent_comment_id
WHERE fp.public_id IN ('feed_mock_detail_001', 'feed_mock_detail_002', 'feed_mock_001')
  AND c.status = 'visible'
ORDER BY fp.published_at DESC, c.created_at ASC;
