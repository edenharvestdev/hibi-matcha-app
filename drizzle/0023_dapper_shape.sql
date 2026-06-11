CREATE TABLE `option_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`og_name` varchar(255) NOT NULL,
	`og_type` enum('single','multi') NOT NULL DEFAULT 'single',
	`og_isRequired` int NOT NULL DEFAULT 0,
	`og_isActive` int NOT NULL DEFAULT 1,
	`og_sortOrder` int NOT NULL DEFAULT 0,
	`og_createdAt` timestamp NOT NULL DEFAULT (now()),
	`og_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `option_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `option_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`oi_groupId` int NOT NULL,
	`oi_name` varchar(255) NOT NULL,
	`oi_isActive` int NOT NULL DEFAULT 1,
	`oi_sortOrder` int NOT NULL DEFAULT 0,
	`oi_createdAt` timestamp NOT NULL DEFAULT (now()),
	`oi_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `option_items_id` PRIMARY KEY(`id`)
);
