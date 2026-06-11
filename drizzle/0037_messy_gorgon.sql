ALTER TABLE `branches` ADD `commissionMode` enum('product','staff') DEFAULT 'product';--> statement-breakpoint
ALTER TABLE `staff` ADD `staffCommissionType` enum('percent','fixed') DEFAULT 'percent';--> statement-breakpoint
ALTER TABLE `staff` ADD `staffCommissionValue` int DEFAULT 0;