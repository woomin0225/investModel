CREATE TABLE `model_disclosures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_version_id` int NOT NULL,
	`disclosure_type` varchar(40) NOT NULL,
	`title` varchar(160) NOT NULL,
	`body` text NOT NULL,
	`requires_legal_review` boolean NOT NULL DEFAULT false,
	`reviewed_by_user_id` int,
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_disclosures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `model_disclosures` ADD CONSTRAINT `model_disclosures_reviewed_by_user_id_users_id_fk` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_model_disclosures_version_type` ON `model_disclosures` (`model_version_id`,`disclosure_type`);--> statement-breakpoint
CREATE INDEX `idx_model_disclosures_legal_review` ON `model_disclosures` (`requires_legal_review`);--> statement-breakpoint
CREATE INDEX `idx_model_disclosures_reviewed_by` ON `model_disclosures` (`reviewed_by_user_id`);