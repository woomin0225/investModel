-- Repair for a local partial application of migration 0007.
--
-- The first 0007 attempt created the Feed interaction tables and re-added
-- foreign keys up to model_disclosures, then stopped on MySQL's identifier
-- length limit for model_performance_snapshots. Apply this complete file only
-- after confirming the partial state. Do not copy individual statements into
-- a MySQL console.

ALTER TABLE `model_performance_snapshots`
  ADD CONSTRAINT `fk_mps_version_id`
  FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `model_risk_profiles`
  ADD CONSTRAINT `model_risk_profiles_model_version_id_model_versions_id_fk`
  FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `model_versions`
  ADD CONSTRAINT `model_versions_model_id_investment_models_id_fk`
  FOREIGN KEY (`model_id`) REFERENCES `investment_models`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `model_versions`
  ADD CONSTRAINT `model_versions_created_by_user_id_users_id_fk`
  FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `portfolio_mandates`
  ADD CONSTRAINT `portfolio_mandates_model_version_id_model_versions_id_fk`
  FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `portfolio_positions`
  ADD CONSTRAINT `portfolio_positions_portfolio_id_portfolios_id_fk`
  FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `portfolio_positions`
  ADD CONSTRAINT `portfolio_positions_instrument_id_market_instruments_id_fk`
  FOREIGN KEY (`instrument_id`) REFERENCES `market_instruments`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `portfolios`
  ADD CONSTRAINT `portfolios_user_id_users_id_fk`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `portfolios`
  ADD CONSTRAINT `portfolios_model_selection_id_user_model_selections_id_fk`
  FOREIGN KEY (`model_selection_id`) REFERENCES `user_model_selections`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `trade_intents`
  ADD CONSTRAINT `trade_intents_allocation_decision_id_allocation_decisions_id_fk`
  FOREIGN KEY (`allocation_decision_id`) REFERENCES `allocation_decisions`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `trade_intents`
  ADD CONSTRAINT `trade_intents_portfolio_id_portfolios_id_fk`
  FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `trade_intents`
  ADD CONSTRAINT `trade_intents_instrument_id_market_instruments_id_fk`
  FOREIGN KEY (`instrument_id`) REFERENCES `market_instruments`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `user_model_selections`
  ADD CONSTRAINT `user_model_selections_user_id_users_id_fk`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `user_model_selections`
  ADD CONSTRAINT `user_model_selections_model_id_investment_models_id_fk`
  FOREIGN KEY (`model_id`) REFERENCES `investment_models`(`id`)
  ON DELETE no action ON UPDATE no action;

ALTER TABLE `user_model_selections`
  ADD CONSTRAINT `user_model_selections_model_version_id_model_versions_id_fk`
  FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`)
  ON DELETE no action ON UPDATE no action;

INSERT INTO `__drizzle_migrations` (`hash`, `created_at`)
SELECT
  '946cc6e163a38d800bbdb9c6da7dda454f6219c49f8efb94ddaac7ceb912e6ab',
  1784032532312
WHERE NOT EXISTS (
  SELECT 1
  FROM `__drizzle_migrations`
  WHERE `hash` = '946cc6e163a38d800bbdb9c6da7dda454f6219c49f8efb94ddaac7ceb912e6ab'
);
