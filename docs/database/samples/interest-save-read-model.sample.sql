-- Interest/save read-model projection sample for BK-525.
--
-- This query documents the DB-backed FeedPost portion of the shared
-- Signals/Feed/Models interest-save fixture. SignalEvent and InvestmentModel
-- markers remain deterministic mock seed rows until companion storage is
-- explicitly designed.
--
-- It reads only private mock user-scoped save state. It does not create model
-- selections, allocation decisions, deposits, orders, TradeIntent rows,
-- brokerage connections, legal judgments, or paid external API calls.

SELECT
  CONCAT('interest_save_feed_', fp.public_id) AS interest_save_id,
  u.public_id AS user_public_id,
  'feed_post' AS item_type,
  fp.public_id AS item_public_id,
  fp.title AS display_title,
  'Feed' AS source_surface,
  CASE
    WHEN fps.status = 'saved' THEN 'saved'
    ELSE 'unsaved'
  END AS save_state,
  fps.saved_at AS created_at,
  fps.updated_at AS updated_at,
  'private_mock_shortcut_only' AS scope_label,
  'DB seed FeedPost save only: no model selection, allocation, deposit, order, TradeIntent, brokerage connection, or advice.' AS safety_label
FROM feed_post_saves fps
INNER JOIN feed_posts fp
  ON fp.id = fps.post_id
INNER JOIN users u
  ON u.id = fps.user_id
WHERE u.public_id = 'user_demo_001'
  AND fp.visibility = 'public'
ORDER BY fps.updated_at DESC, fps.saved_at DESC
LIMIT 6;
