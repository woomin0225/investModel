CREATE TABLE `allocation_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_version_id` int NOT NULL,
	`portfolio_id` int NOT NULL,
	`decision_status` varchar(40) NOT NULL DEFAULT 'draft',
	`rationale` text NOT NULL,
	`input_snapshot_json` json,
	`policy_result_json` json,
	`decided_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `allocation_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_instruments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(40) NOT NULL,
	`name` varchar(200) NOT NULL,
	`asset_type` varchar(30) NOT NULL,
	`market` varchar(30) NOT NULL,
	`exchange` varchar(60),
	`currency` varchar(3) NOT NULL,
	`is_leveraged` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_instruments_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_market_instruments_symbol_market` UNIQUE(`symbol`,`market`)
);
--> statement-breakpoint
CREATE TABLE `mock_deposits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'KRW',
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`source_type` varchar(40) NOT NULL DEFAULT 'mock',
	`memo` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `mock_deposits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolio_id` int NOT NULL,
	`instrument_id` int NOT NULL,
	`quantity` decimal(24,8) NOT NULL DEFAULT '0',
	`average_price` decimal(18,6),
	`market_value` decimal(18,2),
	`as_of` timestamp NOT NULL,
	CONSTRAINT `portfolio_positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_portfolio_positions_portfolio_instrument` UNIQUE(`portfolio_id`,`instrument_id`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`model_selection_id` int NOT NULL,
	`cash_balance` decimal(18,2) NOT NULL DEFAULT '0',
	`total_market_value` decimal(18,2) NOT NULL DEFAULT '0',
	`currency` varchar(3) NOT NULL DEFAULT 'KRW',
	`status` varchar(30) NOT NULL DEFAULT 'mock_active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_intents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`allocation_decision_id` int NOT NULL,
	`portfolio_id` int NOT NULL,
	`instrument_id` int NOT NULL,
	`intent_type` varchar(40) NOT NULL,
	`target_quantity` decimal(24,8),
	`target_value` decimal(18,2),
	`status` varchar(40) NOT NULL DEFAULT 'pending_policy_check',
	`blocked_reason` varchar(700),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_intents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_model_selections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`model_id` int NOT NULL,
	`model_version_id` int NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'active',
	`risk_acknowledged_at` timestamp,
	`selected_at` timestamp NOT NULL DEFAULT (now()),
	`revoked_at` timestamp,
	CONSTRAINT `user_model_selections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `allocation_decisions` ADD CONSTRAINT `fk_ad_version_id` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `allocation_decisions` ADD CONSTRAINT `fk_ad_portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mock_deposits` ADD CONSTRAINT `fk_md_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_positions` ADD CONSTRAINT `fk_pp_portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_positions` ADD CONSTRAINT `fk_pp_instrument_id` FOREIGN KEY (`instrument_id`) REFERENCES `market_instruments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolios` ADD CONSTRAINT `fk_pf_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolios` ADD CONSTRAINT `fk_pf_selection_id` FOREIGN KEY (`model_selection_id`) REFERENCES `user_model_selections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_intents` ADD CONSTRAINT `fk_ti_allocation_id` FOREIGN KEY (`allocation_decision_id`) REFERENCES `allocation_decisions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_intents` ADD CONSTRAINT `fk_ti_portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_intents` ADD CONSTRAINT `fk_ti_instrument_id` FOREIGN KEY (`instrument_id`) REFERENCES `market_instruments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_model_selections` ADD CONSTRAINT `fk_ums_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_model_selections` ADD CONSTRAINT `fk_ums_model_id` FOREIGN KEY (`model_id`) REFERENCES `investment_models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_model_selections` ADD CONSTRAINT `fk_ums_version_id` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_allocation_decisions_model_time` ON `allocation_decisions` (`model_version_id`,`decided_at`);--> statement-breakpoint
CREATE INDEX `idx_allocation_decisions_portfolio_time` ON `allocation_decisions` (`portfolio_id`,`decided_at`);--> statement-breakpoint
CREATE INDEX `idx_market_instruments_asset_market` ON `market_instruments` (`asset_type`,`market`);--> statement-breakpoint
CREATE INDEX `idx_mock_deposits_user_status` ON `mock_deposits` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_portfolio_positions_as_of` ON `portfolio_positions` (`as_of`);--> statement-breakpoint
CREATE INDEX `idx_portfolio_positions_instrument_id` ON `portfolio_positions` (`instrument_id`);--> statement-breakpoint
CREATE INDEX `idx_portfolios_user_status` ON `portfolios` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_portfolios_model_selection_id` ON `portfolios` (`model_selection_id`);--> statement-breakpoint
CREATE INDEX `idx_trade_intents_allocation_decision_id` ON `trade_intents` (`allocation_decision_id`);--> statement-breakpoint
CREATE INDEX `idx_trade_intents_portfolio_status` ON `trade_intents` (`portfolio_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_trade_intents_instrument_id` ON `trade_intents` (`instrument_id`);--> statement-breakpoint
CREATE INDEX `idx_user_model_selections_user_status` ON `user_model_selections` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_user_model_selections_model_version` ON `user_model_selections` (`model_id`,`model_version_id`);
