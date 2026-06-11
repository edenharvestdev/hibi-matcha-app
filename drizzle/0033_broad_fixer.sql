CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ps_customerId` int NOT NULL,
	`ps_endpoint` text NOT NULL,
	`ps_p256dh` text NOT NULL,
	`ps_auth` text NOT NULL,
	`ps_createdAt` timestamp NOT NULL DEFAULT (now()),
	`ps_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
