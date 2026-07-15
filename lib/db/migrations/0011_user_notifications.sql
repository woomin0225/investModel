CREATE TABLE `user_notifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `public_id` varchar(120) NOT NULL,
  `user_id` int NOT NULL,
  `source_type` varchar(40) NOT NULL,
  `source_public_id` varchar(120) NOT NULL,
  `title` varchar(220) NOT NULL,
  `body` varchar(700),
  `status` varchar(30) NOT NULL DEFAULT 'unread',
  `delivery_channel` varchar(30) NOT NULL DEFAULT 'in_app_mock',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `read_at` timestamp,
  CONSTRAINT `user_notifications_id` PRIMARY KEY(`id`),
  CONSTRAINT `uq_user_notifications_public_id` UNIQUE(`public_id`)
);
--> statement-breakpoint
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_user_notifications_user_status_time` ON `user_notifications` (`user_id`,`status`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_user_notifications_source` ON `user_notifications` (`source_type`,`source_public_id`);
