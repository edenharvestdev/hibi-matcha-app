CREATE TABLE `stock_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sa_branchId` int NOT NULL,
	`sa_ingredientId` int,
	`sa_retailProductId` int,
	`sa_type` enum('low_stock','out_of_stock','reorder_needed','stock_restored') NOT NULL,
	`sa_message` text NOT NULL,
	`sa_isRead` boolean NOT NULL DEFAULT false,
	`sa_isResolved` boolean NOT NULL DEFAULT false,
	`sa_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_branch_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sbi_branchId` int NOT NULL,
	`sbi_ingredientId` int NOT NULL,
	`sbi_quantity` decimal(10,4) NOT NULL DEFAULT '0',
	`sbi_minStock` decimal(10,2) NOT NULL DEFAULT '0',
	`sbi_parLevel` decimal(10,2) NOT NULL DEFAULT '0',
	`sbi_lastCostPerUnit` decimal(10,4) NOT NULL DEFAULT '0',
	`sbi_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sbi_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_branch_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_daily_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sds_branchId` int NOT NULL,
	`sds_date` varchar(10) NOT NULL,
	`sds_totalCostUsed` decimal(12,2) NOT NULL DEFAULT '0',
	`sds_totalCostReceived` decimal(12,2) NOT NULL DEFAULT '0',
	`sds_totalWasteCost` decimal(12,2) NOT NULL DEFAULT '0',
	`sds_totalStockValue` decimal(12,2) NOT NULL DEFAULT '0',
	`sds_itemsBelowMin` int NOT NULL DEFAULT 0,
	`sds_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sds_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_daily_summaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_ingredient_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sic_name` varchar(200) NOT NULL,
	`sic_sortOrder` int NOT NULL DEFAULT 0,
	`sic_isActive` boolean NOT NULL DEFAULT true,
	`sic_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sic_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_ingredient_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`si_name` varchar(200) NOT NULL,
	`si_unit` varchar(50) NOT NULL,
	`si_categoryId` int,
	`si_costPerUnit` decimal(10,4) NOT NULL DEFAULT '0',
	`si_sku` varchar(100),
	`si_barcode` varchar(100),
	`si_defaultMinStock` decimal(10,2) NOT NULL DEFAULT '0',
	`si_defaultParLevel` decimal(10,2) NOT NULL DEFAULT '0',
	`si_isActive` boolean NOT NULL DEFAULT true,
	`si_createdAt` timestamp NOT NULL DEFAULT (now()),
	`si_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sm_branchId` int NOT NULL,
	`sm_ingredientId` int,
	`sm_retailProductId` int,
	`sm_type` enum('stock_in','sale','adjustment','waste','void_restore','transfer') NOT NULL,
	`sm_quantity` decimal(10,4) NOT NULL,
	`sm_costPerUnit` decimal(10,4) NOT NULL DEFAULT '0',
	`sm_totalCost` decimal(10,2) NOT NULL DEFAULT '0',
	`sm_balanceAfter` decimal(10,4) NOT NULL DEFAULT '0',
	`sm_reason` text,
	`sm_reference` varchar(200),
	`sm_supplierId` int,
	`sm_staffId` int,
	`sm_staffName` varchar(200),
	`sm_orderId` int,
	`sm_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_option_recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sor_optionId` int NOT NULL,
	`sor_ingredientId` int NOT NULL,
	`sor_quantity` decimal(10,4) NOT NULL,
	`sor_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sor_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_option_recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sr_menuItemId` int NOT NULL,
	`sr_ingredientId` int NOT NULL,
	`sr_quantity` decimal(10,4) NOT NULL,
	`sr_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sr_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ss_name` varchar(200) NOT NULL,
	`ss_contactName` varchar(200),
	`ss_phone` varchar(50),
	`ss_email` varchar(320),
	`ss_address` text,
	`ss_note` text,
	`ss_isActive` boolean NOT NULL DEFAULT true,
	`ss_createdAt` timestamp NOT NULL DEFAULT (now()),
	`ss_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_suppliers_id` PRIMARY KEY(`id`)
);
