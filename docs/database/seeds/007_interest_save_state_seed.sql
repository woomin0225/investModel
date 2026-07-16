-- Interest/save state seed for investModel BK-525.
--
-- Apply this file only as a complete tracked seed file. It refreshes a small
-- private mock user-scoped FeedPost save state used by shared Signals/Feed/
-- Models interest UI work.
--
-- Scope:
-- - Ensures the local demo user exists.
-- - Ensures sample FeedPost save rows exist for the demo user.
-- - Keeps save state as a private reading/interest shortcut only.
-- - Does not create model selections, deposits, allocation decisions,
--   TradeIntent rows, broker links, orders, legal judgments, or external data.

SET @seed_user_public_id := 'user_demo_001';
SET @seed_user_email := 'demo-user@investmodel.local';

INSERT INTO users (public_id, name, email, password_hash, role)
SELECT
  @seed_user_public_id,
  'Demo User',
  @seed_user_email,
  'mock_password_hash_not_for_login',
  'member'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE public_id = @seed_user_public_id
);

SET @seed_user_id := (
  SELECT id FROM users WHERE public_id = @seed_user_public_id LIMIT 1
);

INSERT INTO feed_post_saves (post_id, user_id, status, saved_at)
SELECT fp.id, @seed_user_id, 'saved', '2026-07-14 10:05:00'
FROM feed_posts fp
WHERE fp.public_id = 'feed_mock_002'
  AND fp.visibility = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM feed_post_saves fps
    WHERE fps.post_id = fp.id
      AND fps.user_id = @seed_user_id
  );

UPDATE feed_post_saves fps
INNER JOIN feed_posts fp
  ON fp.id = fps.post_id
SET
  fps.status = 'saved',
  fps.saved_at = '2026-07-14 10:05:00',
  fps.updated_at = '2026-07-14 10:05:00'
WHERE fp.public_id = 'feed_mock_002'
  AND fps.user_id = @seed_user_id;

-- Verification query:
-- SELECT fp.public_id, fps.status, fps.saved_at
-- FROM feed_post_saves fps
-- INNER JOIN feed_posts fp ON fp.id = fps.post_id
-- INNER JOIN users u ON u.id = fps.user_id
-- WHERE u.public_id = 'user_demo_001'
--   AND fp.visibility = 'public';
