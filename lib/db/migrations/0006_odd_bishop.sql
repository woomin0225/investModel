ALTER TABLE `users` ADD `public_id` varchar(120);
--> statement-breakpoint
UPDATE `users` SET `public_id` = CONCAT('user_', `id`) WHERE `public_id` IS NULL OR `public_id` = '';
--> statement-breakpoint
ALTER TABLE `users` MODIFY `public_id` varchar(120) NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_public_id_unique` UNIQUE(`public_id`);
--> statement-breakpoint
ALTER TABLE `investment_models` ADD `public_id` varchar(120);
--> statement-breakpoint
UPDATE `investment_models` SET `public_id` = CONCAT('model_', `id`) WHERE `public_id` IS NULL OR `public_id` = '';
--> statement-breakpoint
ALTER TABLE `investment_models` MODIFY `public_id` varchar(120) NOT NULL;
--> statement-breakpoint
ALTER TABLE `investment_models` ADD CONSTRAINT `uq_investment_models_public_id` UNIQUE(`public_id`);
--> statement-breakpoint
ALTER TABLE `model_versions` ADD `public_id` varchar(120);
--> statement-breakpoint
UPDATE `model_versions` SET `public_id` = CONCAT('model_version_', `id`) WHERE `public_id` IS NULL OR `public_id` = '';
--> statement-breakpoint
ALTER TABLE `model_versions` MODIFY `public_id` varchar(120) NOT NULL;
--> statement-breakpoint
ALTER TABLE `model_versions` ADD CONSTRAINT `uq_model_versions_public_id` UNIQUE(`public_id`);
--> statement-breakpoint
ALTER TABLE `user_model_selections` ADD `public_id` varchar(120);
--> statement-breakpoint
UPDATE `user_model_selections` SET `public_id` = CONCAT('model_selection_', `id`) WHERE `public_id` IS NULL OR `public_id` = '';
--> statement-breakpoint
ALTER TABLE `user_model_selections` MODIFY `public_id` varchar(120) NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_model_selections` ADD CONSTRAINT `uq_user_model_selections_public_id` UNIQUE(`public_id`);
