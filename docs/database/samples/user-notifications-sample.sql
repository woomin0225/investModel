-- User notifications sample rows for review only.
-- Apply only as a whole tracked sample/seed file after migration review.
-- These rows are in-app mock notification events. They do not send push,
-- email, SMS, broker, order, account, delivery-provider, or advice messages.

SET @seed_user_public_id := 'user_demo_001';

INSERT INTO user_notifications (
  public_id,
  user_id,
  source_type,
  source_public_id,
  title,
  body,
  status,
  delivery_channel,
  created_at,
  read_at
)
SELECT
  CONCAT('notif_mock_feed_', fp.public_id),
  u.id,
  'feed_post',
  fp.public_id,
  CONCAT('Feed update: ', LEFT(fp.title, 180)),
  'In-app mock notification derived from FeedPost seed data. No external delivery or advice.',
  CASE WHEN rd.read_at IS NULL THEN 'unread' ELSE 'read' END,
  'in_app_mock',
  COALESCE(rd.read_at, fp.published_at, CURRENT_TIMESTAMP),
  rd.read_at
FROM users u
JOIN feed_posts fp ON fp.status = 'published'
LEFT JOIN feed_post_reads rd ON rd.user_id = u.id AND rd.post_id = fp.id
WHERE u.public_id = @seed_user_public_id
  AND NOT EXISTS (
    SELECT 1
    FROM user_notifications existing
    WHERE existing.public_id = CONCAT('notif_mock_feed_', fp.public_id)
  )
LIMIT 12;

-- Representative read-model verification:
-- SELECT public_id, source_type, source_public_id, status, delivery_channel
-- FROM user_notifications
-- WHERE user_id = (SELECT id FROM users WHERE public_id = @seed_user_public_id)
-- ORDER BY created_at DESC;
