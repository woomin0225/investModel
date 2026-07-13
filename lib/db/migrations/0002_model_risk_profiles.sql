CREATE TABLE `model_risk_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_version_id` int NOT NULL,
	`risk_level` varchar(30) NOT NULL,
	`leverage_allowed` boolean NOT NULL DEFAULT false,
	`derivative_allowed` boolean NOT NULL DEFAULT false,
	`short_selling_allowed` boolean NOT NULL DEFAULT false,
	`concentration_limit_pct` decimal(5,2),
	`expected_volatility_note` varchar(500),
	`max_drawdown_note` varchar(500),
	`risk_summary` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_risk_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_model_risk_profiles_version_id` UNIQUE(`model_version_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_model_risk_profiles_level_leverage` ON `model_risk_profiles` (`risk_level`,`leverage_allowed`);