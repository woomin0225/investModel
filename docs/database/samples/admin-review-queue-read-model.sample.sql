-- Representative admin review queue read-model projection.
--
-- This sample is read-only documentation for screen/API development. It reads
-- review workflow metadata only and must not be treated as a legal judgment,
-- final suitability approval, order, broker connection, deposit movement, or
-- live/external paid data integration.

SELECT
  CONCAT('admin_review_queue_seed_', cr.id) AS review_public_id,
  im.public_id AS model_public_id,
  mv.public_id AS model_version_public_id,
  im.name AS model_name,
  mc.display_name AS creator_name,
  mv.version_label,
  im.status AS model_status,
  cr.status AS compliance_review_status,
  CASE
    WHEN im.status = 'paused' THEN 'paused'
    WHEN cr.status = 'rejected' THEN 'rejected'
    ELSE 'pending_review'
  END AS queue_status,
  cr.review_type,
  cr.reviewer_user_id,
  cr.created_at AS submitted_at,
  cr.reviewed_at,
  cr.notes AS reason_placeholder,
  'Admin review metadata only: no legal judgment, no final suitability approval, no real order, no broker connection, and no deposit movement.' AS safety_label
FROM compliance_reviews cr
JOIN investment_models im ON im.id = cr.model_id
JOIN model_versions mv ON mv.id = cr.model_version_id
JOIN model_creators mc ON mc.id = im.creator_id
WHERE im.public_id IN (
  'model_admin_review_pending_001',
  'model_admin_review_rejected_001',
  'model_admin_review_paused_001'
)
ORDER BY cr.created_at;
