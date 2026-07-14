-- BK-311 local repair for a failed 0004 migration attempt.
--
-- Context:
-- - The first generated 0004 migration failed on MySQL identifier length.
-- - MySQL committed the new empty tables before the failure.
-- - __drizzle_migrations did not record 0004.
--
-- Preconditions checked before applying:
-- - model_versions row_count = 0
-- - portfolio_mandates row_count = 0
-- - compliance_reviews row_count = 0
-- - model_performance_snapshots row_count = 0
--
-- Apply this whole file only to the local invest_model database before
-- rerunning the corrected tracked 0004 migration.

DROP TABLE IF EXISTS `portfolio_mandates`;
DROP TABLE IF EXISTS `model_performance_snapshots`;
DROP TABLE IF EXISTS `compliance_reviews`;
DROP TABLE IF EXISTS `model_versions`;
