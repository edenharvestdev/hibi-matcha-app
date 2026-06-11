CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`announcementType` enum('announcement','promotion','event') NOT NULL DEFAULT 'announcement',
	`targetGroup` enum('all','green','gold','matcha') NOT NULL DEFAULT 'all',
	`imageUrl` text,
	`promoCode` varchar(100),
	`discountText` varchar(255),
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`isPinned` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`announcementCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`announcementUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
