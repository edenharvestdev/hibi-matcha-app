CREATE TABLE `announcement_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`at_name` varchar(255) NOT NULL,
	`at_description` text,
	`at_type` enum('announcement','promotion','event') NOT NULL DEFAULT 'announcement',
	`at_titleTemplate` varchar(255) NOT NULL,
	`at_contentTemplate` text NOT NULL,
	`at_imageUrl` text,
	`at_promoCode` varchar(100),
	`at_discountText` varchar(255),
	`at_isActive` int NOT NULL DEFAULT 1,
	`at_createdAt` timestamp NOT NULL DEFAULT (now()),
	`at_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcement_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `announcements` ADD `scheduledAt` timestamp;