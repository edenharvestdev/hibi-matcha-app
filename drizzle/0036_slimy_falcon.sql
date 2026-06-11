CREATE TABLE `commission_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cr_staffId` int NOT NULL,
	`cr_branchId` int NOT NULL,
	`cr_month` varchar(7) NOT NULL,
	`cr_totalSalesAmount` int NOT NULL DEFAULT 0,
	`cr_totalCommission` int NOT NULL DEFAULT 0,
	`cr_salesCount` int NOT NULL DEFAULT 0,
	`cr_status` enum('pending','approved','paid') NOT NULL DEFAULT 'pending',
	`cr_approvedBy` int,
	`cr_approvedAt` timestamp,
	`cr_paidAt` timestamp,
	`cr_note` text,
	`cr_createdAt` timestamp NOT NULL DEFAULT (now()),
	`cr_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commission_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `cr_staff_branch_month_idx` UNIQUE(`cr_staffId`,`cr_branchId`,`cr_month`)
);
--> statement-breakpoint
CREATE TABLE `franchise_owners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fo_name` varchar(255) NOT NULL,
	`fo_companyName` varchar(255),
	`fo_phone` varchar(20),
	`fo_email` varchar(320),
	`fo_isActive` int NOT NULL DEFAULT 1,
	`fo_createdAt` timestamp NOT NULL DEFAULT (now()),
	`fo_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `franchise_owners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `in_store_sale_staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`isss_saleId` int NOT NULL,
	`isss_staffId` int NOT NULL,
	`isss_commissionAmount` int NOT NULL DEFAULT 0,
	`isss_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `in_store_sale_staff_id` PRIMARY KEY(`id`),
	CONSTRAINT `isss_sale_staff_idx` UNIQUE(`isss_saleId`,`isss_staffId`)
);
--> statement-breakpoint
CREATE TABLE `in_store_sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`iss_branchId` int NOT NULL,
	`iss_customerId` int NOT NULL,
	`iss_productId` int NOT NULL,
	`iss_quantity` int NOT NULL DEFAULT 1,
	`iss_unitPrice` int NOT NULL,
	`iss_totalAmount` int NOT NULL,
	`iss_paymentSlipUrl` text,
	`iss_totalCommission` int NOT NULL DEFAULT 0,
	`iss_commissionType` enum('percent','fixed'),
	`iss_commissionValue` int DEFAULT 0,
	`iss_pointsAwarded` int DEFAULT 0,
	`iss_saleDate` timestamp NOT NULL,
	`iss_note` text,
	`iss_createdBy` int NOT NULL,
	`iss_createdAt` timestamp NOT NULL DEFAULT (now()),
	`iss_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `in_store_sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `announcements` ADD `scheduledPushSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `branches` ADD `franchiseOwnerId` int;--> statement-breakpoint
ALTER TABLE `shop_products` ADD `sp_commissionType` enum('percent','fixed') DEFAULT 'percent';--> statement-breakpoint
ALTER TABLE `shop_products` ADD `sp_commissionValue` int DEFAULT 0;