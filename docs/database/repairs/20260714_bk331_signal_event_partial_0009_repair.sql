-- Repair for BK-331 when 0009_melodic_zombie.sql partially applied before the
-- source instrument FK name was shortened for MySQL's 64-character identifier limit.
-- Safe to run after the table exists; it does not insert sample or production data.

SET @drop_old_model_fk = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'model_signal_events'
        AND constraint_name = 'model_signal_events_model_version_id_model_versions_id_fk'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE model_signal_events DROP FOREIGN KEY model_signal_events_model_version_id_model_versions_id_fk',
    'SELECT 1'
  )
);
PREPARE stmt FROM @drop_old_model_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_model_fk = (
  SELECT IF(
    NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'model_signal_events'
        AND constraint_name = 'fk_signal_model_version'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE model_signal_events ADD CONSTRAINT fk_signal_model_version FOREIGN KEY (model_version_id) REFERENCES model_versions(id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @add_model_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_source_instrument_fk = (
  SELECT IF(
    NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'model_signal_events'
        AND constraint_name = 'fk_signal_source_instrument'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE model_signal_events ADD CONSTRAINT fk_signal_source_instrument FOREIGN KEY (source_instrument_id) REFERENCES market_instruments(id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @add_source_instrument_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_version_time_index = (
  SELECT IF(
    NOT EXISTS (
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'model_signal_events'
        AND index_name = 'idx_model_signal_version_time'
    ),
    'CREATE INDEX idx_model_signal_version_time ON model_signal_events (model_version_id, created_at)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @add_version_time_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_type_score_index = (
  SELECT IF(
    NOT EXISTS (
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'model_signal_events'
        AND index_name = 'idx_model_signal_type_score'
    ),
    'CREATE INDEX idx_model_signal_type_score ON model_signal_events (signal_type, score)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @add_type_score_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_source_article_index = (
  SELECT IF(
    NOT EXISTS (
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'model_signal_events'
        AND index_name = 'idx_model_signal_source_article_id'
    ),
    'CREATE INDEX idx_model_signal_source_article_id ON model_signal_events (source_article_id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @add_source_article_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_source_instrument_index = (
  SELECT IF(
    NOT EXISTS (
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'model_signal_events'
        AND index_name = 'idx_model_signal_source_instrument_id'
    ),
    'CREATE INDEX idx_model_signal_source_instrument_id ON model_signal_events (source_instrument_id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @add_source_instrument_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE __drizzle_migrations
SET hash = '075eb5c62edae5ad298a73094d086da851c13ceb9f2fcd7af6f46afb7da263f9',
    created_at = 1784039478656
WHERE id = 9
  AND created_at = 1784032750648;
