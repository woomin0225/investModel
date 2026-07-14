CREATE TABLE `feed_post_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`public_id` varchar(120) NOT NULL,
	`post_id` int NOT NULL,
	`parent_comment_id` int,
	`author_user_id` int NOT NULL,
	`body` text NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'visible',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_post_comments_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_feed_post_comments_public_id` UNIQUE(`public_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_post_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`user_id` int NOT NULL,
	`reaction_type` varchar(30) NOT NULL DEFAULT 'like',
	`status` varchar(30) NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_post_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_feed_post_reactions_post_user_type` UNIQUE(`post_id`,`user_id`,`reaction_type`)
);
--> statement-breakpoint
CREATE TABLE `feed_post_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`user_id` int NOT NULL,
	`read_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_post_reads_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_feed_post_reads_post_user` UNIQUE(`post_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_post_saves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`user_id` int NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'saved',
	`saved_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_post_saves_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_feed_post_saves_post_user` UNIQUE(`post_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`public_id` varchar(120) NOT NULL,
	`model_id` int,
	`author_user_id` int,
	`post_type` varchar(40) NOT NULL,
	`title` varchar(220) NOT NULL,
	`body` text NOT NULL,
	`visibility` varchar(30) NOT NULL DEFAULT 'public',
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_feed_posts_public_id` UNIQUE(`public_id`)
);
--> statement-breakpoint
ALTER TABLE `allocation_decisions` DROP FOREIGN KEY `fk_ad_version_id`;
--> statement-breakpoint
ALTER TABLE `allocation_decisions` DROP FOREIGN KEY `fk_ad_portfolio_id`;
--> statement-breakpoint
ALTER TABLE `compliance_reviews` DROP FOREIGN KEY `fk_cr_model_id`;
--> statement-breakpoint
ALTER TABLE `compliance_reviews` DROP FOREIGN KEY `fk_cr_version_id`;
--> statement-breakpoint
ALTER TABLE `compliance_reviews` DROP FOREIGN KEY `fk_cr_reviewer_user_id`;
--> statement-breakpoint
ALTER TABLE `mock_deposits` DROP FOREIGN KEY `fk_md_user_id`;
--> statement-breakpoint
ALTER TABLE `model_disclosures` DROP FOREIGN KEY `fk_md_version_id`;
--> statement-breakpoint
ALTER TABLE `model_performance_snapshots` DROP FOREIGN KEY `fk_mps_version_id`;
--> statement-breakpoint
ALTER TABLE `model_risk_profiles` DROP FOREIGN KEY `fk_mrp_version_id`;
--> statement-breakpoint
ALTER TABLE `model_versions` DROP FOREIGN KEY `fk_mv_model_id`;
--> statement-breakpoint
ALTER TABLE `model_versions` DROP FOREIGN KEY `fk_mv_created_by_user_id`;
--> statement-breakpoint
ALTER TABLE `portfolio_mandates` DROP FOREIGN KEY `fk_pm_version_id`;
--> statement-breakpoint
ALTER TABLE `portfolio_positions` DROP FOREIGN KEY `fk_pp_portfolio_id`;
--> statement-breakpoint
ALTER TABLE `portfolio_positions` DROP FOREIGN KEY `fk_pp_instrument_id`;
--> statement-breakpoint
ALTER TABLE `portfolios` DROP FOREIGN KEY `fk_pf_user_id`;
--> statement-breakpoint
ALTER TABLE `portfolios` DROP FOREIGN KEY `fk_pf_selection_id`;
--> statement-breakpoint
ALTER TABLE `trade_intents` DROP FOREIGN KEY `fk_ti_allocation_id`;
--> statement-breakpoint
ALTER TABLE `trade_intents` DROP FOREIGN KEY `fk_ti_portfolio_id`;
--> statement-breakpoint
ALTER TABLE `trade_intents` DROP FOREIGN KEY `fk_ti_instrument_id`;
--> statement-breakpoint
ALTER TABLE `user_model_selections` DROP FOREIGN KEY `fk_ums_user_id`;
--> statement-breakpoint
ALTER TABLE `user_model_selections` DROP FOREIGN KEY `fk_ums_model_id`;
--> statement-breakpoint
ALTER TABLE `user_model_selections` DROP FOREIGN KEY `fk_ums_version_id`;
--> statement-breakpoint
ALTER TABLE `feed_post_comments` ADD CONSTRAINT `feed_post_comments_post_id_feed_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `feed_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_post_comments` ADD CONSTRAINT `feed_post_comments_author_user_id_users_id_fk` FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_post_reactions` ADD CONSTRAINT `feed_post_reactions_post_id_feed_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `feed_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_post_reactions` ADD CONSTRAINT `feed_post_reactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_post_reads` ADD CONSTRAINT `feed_post_reads_post_id_feed_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `feed_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_post_reads` ADD CONSTRAINT `feed_post_reads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_post_saves` ADD CONSTRAINT `feed_post_saves_post_id_feed_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `feed_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_post_saves` ADD CONSTRAINT `feed_post_saves_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_posts` ADD CONSTRAINT `feed_posts_model_id_investment_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `investment_models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_posts` ADD CONSTRAINT `feed_posts_author_user_id_users_id_fk` FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_feed_post_comments_post_parent_time` ON `feed_post_comments` (`post_id`,`parent_comment_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_feed_post_comments_author_time` ON `feed_post_comments` (`author_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_feed_post_comments_status` ON `feed_post_comments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_feed_post_comments_parent_id` ON `feed_post_comments` (`parent_comment_id`);--> statement-breakpoint
CREATE INDEX `idx_feed_post_reactions_user_status` ON `feed_post_reactions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_feed_post_reads_user_time` ON `feed_post_reads` (`user_id`,`read_at`);--> statement-breakpoint
CREATE INDEX `idx_feed_post_saves_user_status_time` ON `feed_post_saves` (`user_id`,`status`,`saved_at`);--> statement-breakpoint
CREATE INDEX `idx_feed_posts_model_time` ON `feed_posts` (`model_id`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_feed_posts_type_visibility` ON `feed_posts` (`post_type`,`visibility`);--> statement-breakpoint
CREATE INDEX `idx_feed_posts_author_user_id` ON `feed_posts` (`author_user_id`);--> statement-breakpoint
ALTER TABLE `allocation_decisions` ADD CONSTRAINT `allocation_decisions_model_version_id_model_versions_id_fk` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `allocation_decisions` ADD CONSTRAINT `allocation_decisions_portfolio_id_portfolios_id_fk` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_reviews` ADD CONSTRAINT `compliance_reviews_model_id_investment_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `investment_models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_reviews` ADD CONSTRAINT `compliance_reviews_model_version_id_model_versions_id_fk` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_reviews` ADD CONSTRAINT `compliance_reviews_reviewer_user_id_users_id_fk` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mock_deposits` ADD CONSTRAINT `mock_deposits_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_disclosures` ADD CONSTRAINT `model_disclosures_model_version_id_model_versions_id_fk` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_performance_snapshots` ADD CONSTRAINT `fk_mps_version_id` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_risk_profiles` ADD CONSTRAINT `model_risk_profiles_model_version_id_model_versions_id_fk` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_versions` ADD CONSTRAINT `model_versions_model_id_investment_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `investment_models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_versions` ADD CONSTRAINT `model_versions_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_mandates` ADD CONSTRAINT `portfolio_mandates_model_version_id_model_versions_id_fk` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_positions` ADD CONSTRAINT `portfolio_positions_portfolio_id_portfolios_id_fk` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_positions` ADD CONSTRAINT `portfolio_positions_instrument_id_market_instruments_id_fk` FOREIGN KEY (`instrument_id`) REFERENCES `market_instruments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_model_selection_id_user_model_selections_id_fk` FOREIGN KEY (`model_selection_id`) REFERENCES `user_model_selections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_intents` ADD CONSTRAINT `trade_intents_allocation_decision_id_allocation_decisions_id_fk` FOREIGN KEY (`allocation_decision_id`) REFERENCES `allocation_decisions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_intents` ADD CONSTRAINT `trade_intents_portfolio_id_portfolios_id_fk` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_intents` ADD CONSTRAINT `trade_intents_instrument_id_market_instruments_id_fk` FOREIGN KEY (`instrument_id`) REFERENCES `market_instruments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_model_selections` ADD CONSTRAINT `user_model_selections_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_model_selections` ADD CONSTRAINT `user_model_selections_model_id_investment_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `investment_models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_model_selections` ADD CONSTRAINT `user_model_selections_model_version_id_model_versions_id_fk` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;
