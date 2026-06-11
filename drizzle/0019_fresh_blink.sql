CREATE TABLE `staff_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sn_staffId` int NOT NULL,
	`sn_type` varchar(50) NOT NULL,
	`sn_title` varchar(500) NOT NULL,
	`sn_message` text,
	`sn_relatedEntity` varchar(50),
	`sn_relatedEntityId` int,
	`sn_isRead` int NOT NULL DEFAULT 0,
	`sn_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_notifications_id` PRIMARY KEY(`id`)
);
