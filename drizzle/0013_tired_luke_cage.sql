CREATE TABLE `branch_menu_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bma_branchId` int NOT NULL,
	`bma_menuItemId` int NOT NULL,
	`bma_isAvailable` int NOT NULL DEFAULT 1,
	`bma_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branch_menu_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `free_drink_codes` ADD `selectedMenuItemId` int;--> statement-breakpoint
ALTER TABLE `free_drink_codes` ADD `selectedMenuCode` varchar(20);--> statement-breakpoint
ALTER TABLE `free_drink_codes` ADD `selectedMenuName` varchar(255);--> statement-breakpoint
ALTER TABLE `free_drink_codes` ADD `sweetnessGrams` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `free_drink_codes` ADD `packagingType` varchar(20) DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `free_drink_codes` ADD `deliveryOrderId` varchar(100);--> statement-breakpoint
ALTER TABLE `free_drink_codes` ADD `orderType` varchar(20) DEFAULT 'in_store' NOT NULL;