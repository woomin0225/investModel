CREATE TABLE `signal_score_inputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`score_snapshot_id` int NOT NULL,
	`source_type` varchar(40) NOT NULL,
	`raw_value` decimal(18,6),
	`normalized_score` decimal(8,4) NOT NULL,
	`weight` decimal(8,4) NOT NULL,
	`source_label` varchar(160),
	`captured_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signal_score_inputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signal_score_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signal_event_id` int NOT NULL,
	`total_score` decimal(8,4) NOT NULL,
	`rank_value` int,
	`rank_delta` int,
	`calculation_context` varchar(40) NOT NULL DEFAULT 'mock_seed',
	`captured_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signal_score_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `signal_score_inputs` ADD CONSTRAINT `fk_score_input_snapshot_id` FOREIGN KEY (`score_snapshot_id`) REFERENCES `signal_score_snapshots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `signal_score_snapshots` ADD CONSTRAINT `fk_signal_score_signal_id` FOREIGN KEY (`signal_event_id`) REFERENCES `model_signal_events`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_signal_score_inputs_snapshot_source` ON `signal_score_inputs` (`score_snapshot_id`,`source_type`);--> statement-breakpoint
CREATE INDEX `idx_signal_score_inputs_source_time` ON `signal_score_inputs` (`source_type`,`captured_at`);--> statement-breakpoint
CREATE INDEX `idx_signal_score_signal_time` ON `signal_score_snapshots` (`signal_event_id`,`captured_at`);--> statement-breakpoint
CREATE INDEX `idx_signal_score_rank_time` ON `signal_score_snapshots` (`rank_value`,`captured_at`);--> statement-breakpoint
CREATE INDEX `idx_signal_score_context` ON `signal_score_snapshots` (`calculation_context`);