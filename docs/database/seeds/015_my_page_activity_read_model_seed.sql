-- My Page activity read-model seed slice.
--
-- Apply after `001_invest_model_domain_seed.sql`.
--
-- Scope:
-- - Adds deterministic in-app mock notification rows for the demo user so
--   My Page can project saved FeedPost, visible comments, and notifications
--   into one user-scoped activity list.
-- - Does not create account linkage, deposits, orders, TradeIntent rows,
--   broker connections, external delivery, paid API data, or advice.

SET @my_page_activity_user_public_id := 'user_demo_001';

SET @my_page_activity_user_id := (
  SELECT id FROM users
  WHERE public_id = @my_page_activity_user_public_id
    AND deleted_at IS NULL
  LIMIT 1
);

INSERT INTO user_notifications (
  public_id,
  user_id,
  source_type,
  source_public_id,
  title,
  body,
  status,
  delivery_channel,
  created_at
)
SELECT
  'notif_my_page_activity_saved_digest_001',
  @my_page_activity_user_id,
  'my_page_activity',
  'feed_mock_002',
  'Saved feed digest ready',
  'In-app mock notification for the saved FeedPost activity row. This is read-model state only and does not send push, email, SMS, account, broker, order, or advice messages.',
  'unread',
  'in_app_mock',
  '2026-07-15 10:00:00'
WHERE @my_page_activity_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_notifications
    WHERE public_id = 'notif_my_page_activity_saved_digest_001'
  );

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
  'notif_my_page_activity_comment_digest_001',
  @my_page_activity_user_id,
  'my_page_activity',
  'feed_comment_mock_001',
  'Comment activity reviewed',
  'In-app mock notification for a visible comment activity row. It is local read-model state only and never performs external delivery or financial action.',
  'read',
  'in_app_mock',
  '2026-07-15 09:45:00',
  '2026-07-15 10:05:00'
WHERE @my_page_activity_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_notifications
    WHERE public_id = 'notif_my_page_activity_comment_digest_001'
  );

-- Representative verification query:
-- SELECT u.public_id AS user_public_id, un.public_id, un.source_type,
--        un.source_public_id, un.status, un.delivery_channel, un.created_at
-- FROM user_notifications un
-- JOIN users u ON u.id = un.user_id
-- WHERE u.public_id = 'user_demo_001'
--   AND un.source_type = 'my_page_activity'
--   AND un.delivery_channel = 'in_app_mock'
-- ORDER BY un.created_at DESC;
