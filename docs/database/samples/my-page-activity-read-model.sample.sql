-- My Page activity read-model representative projection.
--
-- This sample documents the screen-facing rows built from saved FeedPost
-- state, visible comment state, and in-app mock notification state. It is
-- read-only sample SQL and must not be applied as an ad hoc mutation.
--
-- Safety boundary:
-- - User-scoped rows only.
-- - Notification rows are `delivery_channel = 'in_app_mock'` only.
-- - No account linkage, deposits, orders, TradeIntent rows, broker
--   connections, external delivery, paid API data, or financial advice.

SET @my_page_activity_user_public_id := 'user_demo_001';

SELECT *
FROM (
  SELECT
    CONCAT('my_activity_saved_', fp.public_id) AS activity_public_id,
    u.public_id AS user_public_id,
    'saved_feed' AS activity_type,
    fp.public_id AS source_public_id,
    fp.title,
    NULL AS body_preview,
    fps.saved_at AS activity_at,
    'db_seed_projection' AS source_label,
    'feed_post_saves;feed_posts;users' AS source_tables,
    TRUE AS user_scoped,
    TRUE AS in_app_read_model_only,
    FALSE AS account_linkage,
    FALSE AS real_deposit,
    FALSE AS real_order,
    FALSE AS brokerage_connection,
    FALSE AS external_delivery,
    FALSE AS paid_external_api,
    FALSE AS financial_advice
  FROM feed_post_saves fps
  JOIN feed_posts fp ON fp.id = fps.post_id
  JOIN users u ON u.id = fps.user_id
  WHERE u.public_id = @my_page_activity_user_public_id
    AND u.deleted_at IS NULL
    AND fps.status = 'saved'
    AND fp.visibility = 'public'

  UNION ALL

  SELECT
    CONCAT('my_activity_comment_', fpc.public_id) AS activity_public_id,
    u.public_id AS user_public_id,
    'comment' AS activity_type,
    fpc.public_id AS source_public_id,
    fp.title,
    LEFT(fpc.body, 140) AS body_preview,
    fpc.created_at AS activity_at,
    'db_seed_projection' AS source_label,
    'feed_post_comments;feed_posts;users' AS source_tables,
    TRUE AS user_scoped,
    TRUE AS in_app_read_model_only,
    FALSE AS account_linkage,
    FALSE AS real_deposit,
    FALSE AS real_order,
    FALSE AS brokerage_connection,
    FALSE AS external_delivery,
    FALSE AS paid_external_api,
    FALSE AS financial_advice
  FROM feed_post_comments fpc
  JOIN feed_posts fp ON fp.id = fpc.post_id
  JOIN users u ON u.id = fpc.author_user_id
  WHERE u.public_id = @my_page_activity_user_public_id
    AND u.deleted_at IS NULL
    AND fpc.status = 'visible'
    AND fp.visibility = 'public'

  UNION ALL

  SELECT
    CONCAT('my_activity_notification_', un.public_id) AS activity_public_id,
    u.public_id AS user_public_id,
    'notification' AS activity_type,
    un.source_public_id,
    un.title,
    LEFT(un.body, 140) AS body_preview,
    un.created_at AS activity_at,
    'db_seed_projection' AS source_label,
    'user_notifications;users' AS source_tables,
    TRUE AS user_scoped,
    TRUE AS in_app_read_model_only,
    FALSE AS account_linkage,
    FALSE AS real_deposit,
    FALSE AS real_order,
    FALSE AS brokerage_connection,
    FALSE AS external_delivery,
    FALSE AS paid_external_api,
    FALSE AS financial_advice
  FROM user_notifications un
  JOIN users u ON u.id = un.user_id
  WHERE u.public_id = @my_page_activity_user_public_id
    AND u.deleted_at IS NULL
    AND un.delivery_channel = 'in_app_mock'
    AND un.status IN ('unread', 'read', 'empty', 'unavailable')
) activity_rows
ORDER BY activity_at DESC
LIMIT 8;
