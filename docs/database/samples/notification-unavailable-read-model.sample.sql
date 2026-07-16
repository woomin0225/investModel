-- Notification unavailable read-model projection sample for BK-554.
--
-- This documents the local DB-backed shape expected by notification center
-- empty and unavailable states. It reads only user_notifications rows with
-- delivery_channel = 'in_app_mock'. It does not send push, email, SMS,
-- account, broker, order, or advice notifications.

SET @seed_user_public_id := 'user_demo_001';

SELECT
  un.public_id AS notification_public_id,
  u.public_id AS user_public_id,
  un.source_type,
  un.source_public_id,
  CASE
    WHEN un.status = 'empty' THEN 'empty'
    WHEN un.status = 'unavailable' THEN 'unavailable'
    ELSE 'unavailable'
  END AS fallback_kind,
  un.title,
  un.body,
  un.status,
  un.delivery_channel,
  un.created_at,
  un.read_at,
  'in_app_mock read-model fallback only: no push, email, SMS, account, broker, order, external provider, or advice delivery.' AS safety_label
FROM user_notifications un
JOIN users u ON u.id = un.user_id
WHERE u.public_id = @seed_user_public_id
  AND un.source_type = 'notification_fallback'
  AND un.source_public_id IN (
    'notification_center_empty_state',
    'notification_center_unavailable_state'
  )
  AND un.status IN ('empty', 'unavailable')
  AND un.delivery_channel = 'in_app_mock'
ORDER BY un.created_at;
