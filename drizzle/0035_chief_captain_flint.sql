CREATE TABLE `daily_sales_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dsi_salesRecordId` int NOT NULL,
	`dsi_categoryId` int NOT NULL,
	`dsi_amount` int NOT NULL DEFAULT 0,
	`dsi_note` text,
	CONSTRAINT `daily_sales_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sc_name` varchar(255) NOT NULL,
	`sc_description` text,
	`sc_branchId` int,
	`sc_commissionRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`sc_sortOrder` int NOT NULL DEFAULT 0,
	`sc_isActive` int NOT NULL DEFAULT 1,
	`sc_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sc_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `announcements` ADD `branchId` int;