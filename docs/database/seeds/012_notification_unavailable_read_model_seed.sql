-- Notification unavailable read-model seed for investModel.
--
-- Apply this file only as a complete tracked seed file. Do not copy individual
-- statements into a MySQL console for one-off edits.
--
-- Scope:
-- - Creates two notification center fallback rows for empty and unavailable
--   states.
-- - Uses user_notifications with delivery_channel = 'in_app_mock' only.
-- - Does not send push, email, SMS, account, broker, order, or advice
--   notifications and does not require secrets or external providers.

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
  'notif_fallback_empty_user_demo_001',
  @seed_user_id,
  'notification_fallback',
  'notification_center_empty_state',
  'No in-app notification rows yet',
  'Empty notification center state for the prototype. Local in-app read-model state only: no push, email, SMS, account, broker, order, or advice delivery.',
  'empty',
  'in_app_mock',
  '2026-07-16 13:20:00',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM user_notifications
  WHERE public_id = 'notif_fallback_empty_user_demo_001'
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
  'notif_fallback_unavailable_user_demo_001',
  @seed_user_id,
  'notification_fallback',
  'notification_center_unavailable_state',
  'Notification read model temporarily unavailable',
  'Unavailable notification center state for DB or seed gaps. External push, email, SMS, account, broker, order, and advice channels stay disabled.',
  'unavailable',
  'in_app_mock',
  '2026-07-16 13:21:00',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM user_notifications
  WHERE public_id = 'notif_fallback_unavailable_user_demo_001'
);

-- Representative verification query:
-- SELECT public_id, source_type, source_public_id, status, delivery_channel
-- FROM user_notifications
-- WHERE user_id = @seed_user_id
--   AND source_type = 'notification_fallback'
-- ORDER BY created_at;
