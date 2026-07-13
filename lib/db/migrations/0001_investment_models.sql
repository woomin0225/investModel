CREATE TABLE `investment_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creator_id` int NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(160) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'draft',
	`visibility` varchar(30) NOT NULL DEFAULT 'private',
	`current_version_id` int,
	`short_description` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`retired_at` timestamp,
	CONSTRAINT `investment_models_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_investment_models_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `model_creators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`display_name` varchar(100) NOT NULL,
	`bio` text,
	`verification_status` varchar(30) NOT NULL DEFAULT 'unverified',
	`verified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_creators_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_model_creators_user_id` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `investment_models` ADD CONSTRAINT `investment_models_creator_id_model_creators_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `model_creators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_creators` ADD CONSTRAINT `model_creators_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_investment_models_creator_id` ON `investment_models` (`creator_id`);--> statement-breakpoint
CREATE INDEX `idx_investment_models_status_visibility` ON `investment_models` (`status`,`visibility`);--> statement-breakpoint
CREATE INDEX `idx_investment_models_current_version_id` ON `investment_models` (`current_version_id`);--> statement-breakpoint
CREATE INDEX `idx_model_creators_verification_status` ON `model_creators` (`verification_status`);