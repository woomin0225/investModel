-- BK-563 / 013_admin_review_queue_seed: Admin review queue read-model seed for investModel.
--
-- Apply this file only as a complete tracked seed file. Do not copy individual
-- statements into a MySQL console for one-off edits.
--
-- Scope:
-- - Creates three admin review queue rows for pending, rejected, and paused
--   operator-review states.
-- - Uses existing users, model_creators, investment_models, model_versions,
--   model_disclosures, and compliance_reviews tables.
-- - Keeps model artifacts metadata-only and disclosure copy marked as requiring
--   review.
-- - Does not create legal judgments, final suitability approvals, deposits,
--   allocation decisions, TradeIntent rows, broker links, bank links, orders,
--   fills, live data, or external paid API data.

SET @seed_admin_public_id := 'user_admin_review_queue_001';
SET @seed_admin_email := 'admin-review-queue@investmodel.local';

INSERT INTO users (public_id, name, email, password_hash, role)
SELECT
  @seed_admin_public_id,
  'Admin Review Queue Operator',
  @seed_admin_email,
  'mock_password_hash_not_for_login',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE public_id = @seed_admin_public_id
);

SET @seed_admin_user_id := (
  SELECT id FROM users WHERE public_id = @seed_admin_public_id LIMIT 1
);

SET @seed_creator_user_public_id := 'user_admin_review_queue_creator_001';
SET @seed_creator_user_email := 'admin-review-queue-creator@investmodel.local';

INSERT INTO users (public_id, name, email, password_hash, role)
SELECT
  @seed_creator_user_public_id,
  'Admin Review Queue Creator',
  @seed_creator_user_email,
  'mock_password_hash_not_for_login',
  'member'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE public_id = @seed_creator_user_public_id
);

SET @seed_creator_user_id := (
  SELECT id FROM users WHERE public_id = @seed_creator_user_public_id LIMIT 1
);

INSERT INTO model_creators (user_id, display_name, bio, verification_status)
SELECT
  @seed_creator_user_id,
  'Admin Review Seed Creator',
  'Local seed creator for admin review queue metadata samples.',
  'sample_only'
WHERE NOT EXISTS (
  SELECT 1 FROM model_creators WHERE user_id = @seed_creator_user_id
);

SET @seed_creator_id := (
  SELECT id FROM model_creators WHERE user_id = @seed_creator_user_id LIMIT 1
);

INSERT INTO investment_models (
  public_id,
  creator_id,
  slug,
  name,
  status,
  visibility,
  short_description
)
SELECT
  'model_admin_review_pending_001',
  @seed_creator_id,
  'admin-review-pending-sample',
  'Admin Pending Sample',
  'pending_review',
  'private',
  'Mock admin review queue row awaiting operator checklist review.'
WHERE NOT EXISTS (
  SELECT 1 FROM investment_models
  WHERE public_id = 'model_admin_review_pending_001'
);

SET @pending_model_id := (
  SELECT id FROM investment_models
  WHERE public_id = 'model_admin_review_pending_001'
  LIMIT 1
);

INSERT INTO model_versions (
  public_id,
  model_id,
  version_label,
  strategy_summary,
  target_markets,
  asset_universe_summary,
  rebalance_frequency,
  input_data_summary,
  forbidden_scope,
  model_artifact_status,
  created_by_user_id,
  effective_from
)
SELECT
  'model_version_admin_review_pending_001',
  @pending_model_id,
  'v1-admin-review-pending',
  'Metadata-only sample awaiting admin review queue checklist.',
  'US simulated equity references',
  'Seed-only broad equity and cash-like references',
  'Monthly mock review cadence only',
  'Seeded admin review queue metadata only; no live market data or paid API source is required.',
  'No account action, allocation decision, TradeIntent, broker connection, legal judgment, or cash movement is produced by this seed.',
  'metadata_only',
  @seed_creator_user_id,
  '2026-07-16 09:10:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_versions
  WHERE public_id = 'model_version_admin_review_pending_001'
);

SET @pending_version_id := (
  SELECT id FROM model_versions
  WHERE public_id = 'model_version_admin_review_pending_001'
  LIMIT 1
);

UPDATE investment_models
SET current_version_id = @pending_version_id
WHERE id = @pending_model_id
  AND (current_version_id IS NULL OR current_version_id <> @pending_version_id);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT
  @pending_version_id,
  'admin_review_placeholder',
  'Admin review pending placeholder',
  'Placeholder copy for operator checklist review. It is not final legal copy and does not imply suitability approval.',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @pending_version_id
    AND disclosure_type = 'admin_review_placeholder'
);

INSERT INTO compliance_reviews (
  model_id,
  model_version_id,
  review_type,
  status,
  reviewer_user_id,
  notes,
  reviewed_at,
  created_at
)
SELECT
  @pending_model_id,
  @pending_version_id,
  'model_release_candidate',
  'pending',
  NULL,
  'Pending checklist review placeholder; no legal judgment, no final suitability approval, no real order, no broker connection, and no deposit movement.',
  NULL,
  '2026-07-16 09:10:00'
WHERE NOT EXISTS (
  SELECT 1 FROM compliance_reviews
  WHERE model_id = @pending_model_id
    AND model_version_id = @pending_version_id
    AND review_type = 'model_release_candidate'
);

INSERT INTO investment_models (
  public_id,
  creator_id,
  slug,
  name,
  status,
  visibility,
  short_description
)
SELECT
  'model_admin_review_rejected_001',
  @seed_creator_id,
  'admin-review-rejected-sample',
  'Admin Rejected Sample',
  'pending_review',
  'private',
  'Mock admin review queue row with rejected ComplianceReview metadata.'
WHERE NOT EXISTS (
  SELECT 1 FROM investment_models
  WHERE public_id = 'model_admin_review_rejected_001'
);

SET @rejected_model_id := (
  SELECT id FROM investment_models
  WHERE public_id = 'model_admin_review_rejected_001'
  LIMIT 1
);

INSERT INTO model_versions (
  public_id,
  model_id,
  version_label,
  strategy_summary,
  target_markets,
  asset_universe_summary,
  rebalance_frequency,
  input_data_summary,
  forbidden_scope,
  model_artifact_status,
  created_by_user_id,
  effective_from
)
SELECT
  'model_version_admin_review_rejected_001',
  @rejected_model_id,
  'v1-admin-review-rejected',
  'Metadata-only sample with a rejected admin checklist outcome.',
  'US simulated equity references',
  'Seed-only broad equity and cash-like references',
  'Monthly mock review cadence only',
  'Seeded admin review queue metadata only; no live market data or paid API source is required.',
  'No account action, allocation decision, TradeIntent, broker connection, legal judgment, or cash movement is produced by this seed.',
  'metadata_only',
  @seed_creator_user_id,
  '2026-07-16 09:15:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_versions
  WHERE public_id = 'model_version_admin_review_rejected_001'
);

SET @rejected_version_id := (
  SELECT id FROM model_versions
  WHERE public_id = 'model_version_admin_review_rejected_001'
  LIMIT 1
);

UPDATE investment_models
SET current_version_id = @rejected_version_id
WHERE id = @rejected_model_id
  AND (current_version_id IS NULL OR current_version_id <> @rejected_version_id);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT
  @rejected_version_id,
  'admin_review_placeholder',
  'Admin review rejected placeholder',
  'Placeholder revision note for creator follow-up. It is not final legal copy and does not imply suitability approval.',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @rejected_version_id
    AND disclosure_type = 'admin_review_placeholder'
);

INSERT INTO compliance_reviews (
  model_id,
  model_version_id,
  review_type,
  status,
  reviewer_user_id,
  notes,
  reviewed_at,
  created_at
)
SELECT
  @rejected_model_id,
  @rejected_version_id,
  'model_release_candidate',
  'rejected',
  @seed_admin_user_id,
  'Rejected placeholder: disclosure and leverage wording require revision; no legal judgment, no final suitability approval, no real order, no broker connection, and no deposit movement.',
  '2026-07-16 09:20:00',
  '2026-07-16 09:15:00'
WHERE NOT EXISTS (
  SELECT 1 FROM compliance_reviews
  WHERE model_id = @rejected_model_id
    AND model_version_id = @rejected_version_id
    AND review_type = 'model_release_candidate'
);

INSERT INTO investment_models (
  public_id,
  creator_id,
  slug,
  name,
  status,
  visibility,
  short_description
)
SELECT
  'model_admin_review_paused_001',
  @seed_creator_id,
  'admin-review-paused-sample',
  'Admin Paused Sample',
  'paused',
  'private',
  'Mock admin review queue row paused for operator metadata review.'
WHERE NOT EXISTS (
  SELECT 1 FROM investment_models
  WHERE public_id = 'model_admin_review_paused_001'
);

SET @paused_model_id := (
  SELECT id FROM investment_models
  WHERE public_id = 'model_admin_review_paused_001'
  LIMIT 1
);

INSERT INTO model_versions (
  public_id,
  model_id,
  version_label,
  strategy_summary,
  target_markets,
  asset_universe_summary,
  rebalance_frequency,
  input_data_summary,
  forbidden_scope,
  model_artifact_status,
  created_by_user_id,
  effective_from
)
SELECT
  'model_version_admin_review_paused_001',
  @paused_model_id,
  'v1-admin-review-paused',
  'Metadata-only sample paused for admin review queue follow-up.',
  'US simulated equity references',
  'Seed-only broad equity and cash-like references',
  'Monthly mock review cadence only',
  'Seeded admin review queue metadata only; no live market data or paid API source is required.',
  'No account action, allocation decision, TradeIntent, broker connection, legal judgment, or cash movement is produced by this seed.',
  'metadata_only',
  @seed_creator_user_id,
  '2026-07-16 09:25:00'
WHERE NOT EXISTS (
  SELECT 1 FROM model_versions
  WHERE public_id = 'model_version_admin_review_paused_001'
);

SET @paused_version_id := (
  SELECT id FROM model_versions
  WHERE public_id = 'model_version_admin_review_paused_001'
  LIMIT 1
);

UPDATE investment_models
SET current_version_id = @paused_version_id
WHERE id = @paused_model_id
  AND (current_version_id IS NULL OR current_version_id <> @paused_version_id);

INSERT INTO model_disclosures (
  model_version_id,
  disclosure_type,
  title,
  body,
  requires_legal_review
)
SELECT
  @paused_version_id,
  'admin_review_placeholder',
  'Admin review paused placeholder',
  'Placeholder paused-state note for operator follow-up. It is not final legal copy and does not imply suitability approval.',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM model_disclosures
  WHERE model_version_id = @paused_version_id
    AND disclosure_type = 'admin_review_placeholder'
);

INSERT INTO compliance_reviews (
  model_id,
  model_version_id,
  review_type,
  status,
  reviewer_user_id,
  notes,
  reviewed_at,
  created_at
)
SELECT
  @paused_model_id,
  @paused_version_id,
  'model_pause_review',
  'pending',
  @seed_admin_user_id,
  'Paused placeholder: operator metadata review is open; no legal judgment, no final suitability approval, no real order, no broker connection, and no deposit movement.',
  NULL,
  '2026-07-16 09:25:00'
WHERE NOT EXISTS (
  SELECT 1 FROM compliance_reviews
  WHERE model_id = @paused_model_id
    AND model_version_id = @paused_version_id
    AND review_type = 'model_pause_review'
);

-- Representative verification query:
-- SELECT
--   CONCAT('admin_review_queue_seed_', cr.id) AS review_public_id,
--   im.public_id AS model_public_id,
--   mv.public_id AS model_version_public_id,
--   im.status AS model_status,
--   cr.status AS compliance_review_status,
--   CASE
--     WHEN im.status = 'paused' THEN 'paused'
--     WHEN cr.status = 'rejected' THEN 'rejected'
--     ELSE 'pending_review'
--   END AS queue_status,
--   cr.review_type,
--   cr.reviewer_user_id,
--   cr.notes
-- FROM compliance_reviews cr
-- JOIN investment_models im ON im.id = cr.model_id
-- JOIN model_versions mv ON mv.id = cr.model_version_id
-- WHERE im.public_id IN (
--   'model_admin_review_pending_001',
--   'model_admin_review_rejected_001',
--   'model_admin_review_paused_001'
-- )
-- ORDER BY cr.created_at;
