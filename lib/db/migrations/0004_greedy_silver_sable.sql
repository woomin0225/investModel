CREATE TABLE `compliance_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_id` int NOT NULL,
	`model_version_id` int,
	`review_type` varchar(40) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`reviewer_user_id` int,
	`notes` text,
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_performance_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_version_id` int NOT NULL,
	`period_label` varchar(40) NOT NULL,
	`cumulative_return_pct` decimal(8,4),
	`volatility_pct` decimal(8,4),
	`max_drawdown_pct` decimal(8,4),
	`benchmark_symbol` varchar(30),
	`is_backtest` boolean NOT NULL DEFAULT true,
	`measured_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_performance_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_id` int NOT NULL,
	`version_label` varchar(60) NOT NULL,
	`strategy_summary` text NOT NULL,
	`target_markets` varchar(500) NOT NULL,
	`asset_universe_summary` varchar(700) NOT NULL,
	`rebalance_frequency` varchar(80),
	`input_data_summary` text,
	`forbidden_scope` text,
	`model_artifact_status` varchar(30) NOT NULL DEFAULT 'metadata_only',
	`created_by_user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`effective_from` timestamp,
	`retired_at` timestamp,
	CONSTRAINT `model_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_model_versions_model_label` UNIQUE(`model_id`,`version_label`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_mandates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_version_id` int NOT NULL,
	`allowed_markets` varchar(700) NOT NULL,
	`allowed_asset_classes` varchar(700) NOT NULL,
	`forbidden_assets` text,
	`min_cash_pct` decimal(5,2),
	`max_single_position_pct` decimal(5,2),
	`leverage_policy` varchar(500),
	`rebalance_policy` varchar(700),
	`user_override_allowed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolio_mandates_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_portfolio_mandates_version_id` UNIQUE(`model_version_id`)
);
--> statement-breakpoint
ALTER TABLE `compliance_reviews` ADD CONSTRAINT `fk_cr_model_id` FOREIGN KEY (`model_id`) REFERENCES `investment_models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_reviews` ADD CONSTRAINT `fk_cr_version_id` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_reviews` ADD CONSTRAINT `fk_cr_reviewer_user_id` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_performance_snapshots` ADD CONSTRAINT `fk_mps_version_id` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_versions` ADD CONSTRAINT `fk_mv_model_id` FOREIGN KEY (`model_id`) REFERENCES `investment_models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_versions` ADD CONSTRAINT `fk_mv_created_by_user_id` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_mandates` ADD CONSTRAINT `fk_pm_version_id` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_compliance_reviews_model_status` ON `compliance_reviews` (`model_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_compliance_reviews_version_type` ON `compliance_reviews` (`model_version_id`,`review_type`);--> statement-breakpoint
CREATE INDEX `idx_compliance_reviews_reviewer` ON `compliance_reviews` (`reviewer_user_id`);--> statement-breakpoint
CREATE INDEX `idx_model_performance_version_period` ON `model_performance_snapshots` (`model_version_id`,`period_label`,`measured_at`);--> statement-breakpoint
CREATE INDEX `idx_model_versions_artifact_status` ON `model_versions` (`model_artifact_status`);--> statement-breakpoint
CREATE INDEX `idx_model_versions_created_by_user_id` ON `model_versions` (`created_by_user_id`);--> statement-breakpoint
ALTER TABLE `model_disclosures` ADD CONSTRAINT `fk_md_version_id` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_risk_profiles` ADD CONSTRAINT `fk_mrp_version_id` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;
