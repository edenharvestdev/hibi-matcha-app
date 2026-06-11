CREATE TABLE `staff_push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sps_staffId` int NOT NULL,
	`sps_endpoint` text NOT NULL,
	`sps_p256dh` text NOT NULL,
	`sps_auth` text NOT NULL,
	`sps_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sps_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_push_subscriptions_id` PRIMARY KEY(`id`)
);
