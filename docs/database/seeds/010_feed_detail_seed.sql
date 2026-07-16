-- Feed detail seed for investModel.
--
-- Apply this file only as a complete tracked seed file. It extends the Feed
-- detail/read-state slice with sample body, comments, reactions, saves, reads,
-- and ranking rows that can be projected into a mobile detail screen.
--
-- Scope:
-- - Requires applying 003_signal_event_seed.sql and
--   002_feed_interaction_seed.sql first as whole files.
-- - Keeps FeedPost content informational and mock-scoped.
-- - Does not create real investment advice, real orders, broker links,
--   deposits, push delivery, live traffic/search data, or external paid APIs.

SET @seed_user_public_id := 'user_demo_001';
SET @seed_user_id := (
  SELECT id FROM users WHERE public_id = @seed_user_public_id LIMIT 1
);
SET @seed_model_id := (
  SELECT MIN(id) FROM investment_models
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_detail_001',
  @seed_model_id,
  @seed_user_id,
  'market_context',
  'Seeded context around AI infrastructure attention',
  'This detail seed explains observed model input context from seeded FeedPost and SignalEvent rows. It is reading material for mobile UI testing, not a trade instruction or portfolio action.',
  'public',
  '2026-07-16 12:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_detail_001'
);

INSERT INTO feed_posts (
  public_id,
  model_id,
  author_user_id,
  post_type,
  title,
  body,
  visibility,
  published_at
)
SELECT
  'feed_mock_detail_002',
  @seed_model_id,
  @seed_user_id,
  'risk_note',
  'Seeded risk note discussion state',
  'This detail seed keeps risk commentary as informational context for a mock FeedPost. It records discussion and read state without legal conclusions, delivery setup, or account actions.',
  'public',
  '2026-07-16 12:42:00'
WHERE NOT EXISTS (
  SELECT 1 FROM feed_posts WHERE public_id = 'feed_mock_detail_002'
);

INSERT INTO feed_post_comments (
  public_id,
  post_id,
  parent_comment_id,
  author_user_id,
  body,
  status,
  created_at
)
SELECT
  'feed_comment_detail_001',
  fp.id,
  NULL,
  @seed_user_id,
  'The seeded context is useful when source labels and score breakdowns stay visible beside the commentary.',
  'visible',
  '2026-07-16 12:46:00'
FROM feed_posts fp
WHERE fp.public_id = 'feed_mock_detail_001'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_comments
    WHERE public_id = 'feed_comment_detail_001'
  );

INSERT INTO feed_post_comments (
  public_id,
  post_id,
  parent_comment_id,
  author_user_id,
  body,
  status,
  created_at
)
SELECT
  'feed_comment_detail_002',
  fp.id,
  parent.id,
  @seed_user_id,
  'Agreed. The detail screen should keep the evidence label close to the discussion thread.',
  'visible',
  '2026-07-16 12:48:00'
FROM feed_posts fp
JOIN feed_post_comments parent
  ON parent.public_id = 'feed_comment_detail_001'
WHERE fp.public_id = 'feed_mock_detail_001'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_comments
    WHERE public_id = 'feed_comment_detail_002'
  );

INSERT INTO feed_post_comments (
  public_id,
  post_id,
  parent_comment_id,
  author_user_id,
  body,
  status,
  created_at
)
SELECT
  'feed_comment_detail_003',
  fp.id,
  NULL,
  @seed_user_id,
  'The risk note reads safer when uncertainty and mock-source labels are shown before any metric.',
  'visible',
  '2026-07-16 12:50:00'
FROM feed_posts fp
WHERE fp.public_id = 'feed_mock_detail_002'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_comments
    WHERE public_id = 'feed_comment_detail_003'
  );

INSERT INTO feed_post_reactions (post_id, user_id, reaction_type, status, created_at)
SELECT fp.id, @seed_user_id, 'like', 'active', '2026-07-16 12:52:00'
FROM feed_posts fp
WHERE fp.public_id IN ('feed_mock_detail_001', 'feed_mock_detail_002')
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_reactions r
    WHERE r.post_id = fp.id
      AND r.user_id = @seed_user_id
      AND r.reaction_type = 'like'
  );

INSERT INTO feed_post_saves (post_id, user_id, status, saved_at)
SELECT fp.id, @seed_user_id, 'saved', '2026-07-16 12:54:00'
FROM feed_posts fp
WHERE fp.public_id = 'feed_mock_detail_002'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_saves s
    WHERE s.post_id = fp.id
      AND s.user_id = @seed_user_id
  );

INSERT INTO feed_post_reads (post_id, user_id, read_at)
SELECT fp.id, @seed_user_id, '2026-07-16 12:56:00'
FROM feed_posts fp
WHERE fp.public_id IN ('feed_mock_detail_001', 'feed_mock_detail_002')
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_reads rd
    WHERE rd.post_id = fp.id
      AND rd.user_id = @seed_user_id
  );

INSERT INTO feed_post_ranking_snapshots (
  post_id,
  ranking_window,
  ranking_basis,
  rank_value,
  score_value,
  captured_at
)
SELECT fp.id, 'feed_detail_seed', 'active_like_count', 1, 1.000000, '2026-07-16 12:58:00'
FROM feed_posts fp
WHERE fp.public_id = 'feed_mock_detail_001'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_ranking_snapshots rs
    WHERE rs.post_id = fp.id
      AND rs.ranking_window = 'feed_detail_seed'
  );

-- Representative verification query:
-- SELECT
--   fp.public_id,
--   fp.title,
--   fp.post_type,
--   COUNT(DISTINCT c.id) AS visible_comment_count,
--   COUNT(DISTINCT r.id) AS active_like_count,
--   MAX(CASE WHEN s.status = 'saved' THEN 1 ELSE 0 END) AS saved_by_seed_user,
--   MAX(CASE WHEN rd.read_at IS NOT NULL THEN 1 ELSE 0 END) AS read_by_seed_user,
--   'mock/informational only: no advice, order, broker link, push delivery, live data, or paid API' AS safety_label
-- FROM feed_posts fp
-- LEFT JOIN feed_post_comments c ON c.post_id = fp.id AND c.status = 'visible'
-- LEFT JOIN feed_post_reactions r
--   ON r.post_id = fp.id AND r.reaction_type = 'like' AND r.status = 'active'
-- LEFT JOIN feed_post_saves s ON s.post_id = fp.id AND s.user_id = @seed_user_id
-- LEFT JOIN feed_post_reads rd ON rd.post_id = fp.id AND rd.user_id = @seed_user_id
-- WHERE fp.public_id LIKE 'feed_mock_detail_%'
-- GROUP BY fp.public_id, fp.title, fp.post_type
-- ORDER BY fp.published_at DESC;
