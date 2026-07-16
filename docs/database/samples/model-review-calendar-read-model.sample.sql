-- Model review calendar read-model projection sample for BK-521.
--
-- This query documents the DB-backed shape expected by Home/Models review
-- calendar strips. It reads only seeded InvestmentModel, ModelVersion, and
-- ComplianceReview metadata.
--
-- It does not create legal judgments, execute rebalances, create TradeIntent
-- rows, place orders, connect brokerage accounts, move deposits, or call paid
-- external APIs.

SELECT
  CONCAT('review_calendar_seed_', cr.id) AS review_public_id,
  im.public_id AS model_public_id,
  mv.public_id AS model_version_public_id,
  im.name AS model_name,
  mv.version_label AS version_label,
  CASE
    WHEN im.status = 'paused' THEN 'paused'
    WHEN cr.status = 'approved' OR cr.reviewed_at IS NOT NULL THEN 'reviewed'
    ELSE 'review_due'
  END AS review_calendar_status,
  cr.created_at AS due_at,
  cr.reviewed_at AS last_reviewed_at,
  'compliance_review_projection' AS schedule_source,
  cr.review_type AS review_type,
  cr.status AS compliance_review_status,
  cr.notes AS review_metadata_summary,
  'DB seed review calendar only: no legal judgment, rebalance execution, order, TradeIntent, brokerage connection, or paid external API.' AS safety_label
FROM compliance_reviews cr
LEFT JOIN investment_models im
  ON im.id = cr.model_id
LEFT JOIN model_versions mv
  ON mv.id = cr.model_version_id
ORDER BY cr.created_at DESC
LIMIT 8;
