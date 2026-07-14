CREATE TABLE `model_signal_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`public_id` varchar(120) NOT NULL,
	`model_version_id` int NOT NULL,
	`signal_type` varchar(40) NOT NULL,
	`title` varchar(220) NOT NULL,
	`summary` text,
	`score` decimal(8,4),
	`source_article_id` int,
	`source_instrument_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_signal_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_model_signal_events_public_id` UNIQUE(`public_id`)
);
--> statement-breakpoint
ALTER TABLE `model_signal_events` ADD CONSTRAINT `fk_signal_model_version` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_signal_events` ADD CONSTRAINT `fk_signal_source_instrument` FOREIGN KEY (`source_instrument_id`) REFERENCES `market_instruments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_model_signal_version_time` ON `model_signal_events` (`model_version_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_model_signal_type_score` ON `model_signal_events` (`signal_type`,`score`);--> statement-breakpoint
CREATE INDEX `idx_model_signal_source_article_id` ON `model_signal_events` (`source_article_id`);--> statement-breakpoint
CREATE INDEX `idx_model_signal_source_instrument_id` ON `model_signal_events` (`source_instrument_id`);
