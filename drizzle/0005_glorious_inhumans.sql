CREATE TABLE `branch_loyalty_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blpCustomerId` int NOT NULL,
	`blpBranchId` int NOT NULL,
	`blpTotalPoints` int NOT NULL DEFAULT 0,
	`blpUsedPoints` int NOT NULL DEFAULT 0,
	`blpLifetimePoints` int NOT NULL DEFAULT 0,
	`blpCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`blpUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branch_loyalty_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_customer_branch_loyalty` UNIQUE(`blpCustomerId`,`blpBranchId`)
);
--> statement-breakpoint
CREATE TABLE `customer_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consentCustomerId` int NOT NULL,
	`consentType` enum('pdpa','terms','marketing') NOT NULL,
	`consentVersion` varchar(20) NOT NULL,
	`accepted` int NOT NULL DEFAULT 1,
	`ipAddress` varchar(45),
	`consentUserAgent` text,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `free_drink_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignName` varchar(255) NOT NULL,
	`campaignDescription` text,
	`menuOptions` json NOT NULL,
	`maxCodesPerCustomer` int NOT NULL DEFAULT 1,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`campaignIsActive` int NOT NULL DEFAULT 1,
	`branchScope` json,
	`campaignCreatedBy` int,
	`campaignCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`campaignUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `free_drink_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `free_drink_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fdCode` varchar(30) NOT NULL,
	`fdCampaignId` int NOT NULL,
	`fdCustomerId` int NOT NULL,
	`fdBranchId` int NOT NULL,
	`menuCode` varchar(10) NOT NULL,
	`menuName` varchar(255) NOT NULL,
	`sizeCode` varchar(10) NOT NULL,
	`sizeName` varchar(50) NOT NULL,
	`milkCode` varchar(10),
	`milkName` varchar(50),
	`fdStatus` enum('issued','redeemed','expired','cancelled') NOT NULL DEFAULT 'issued',
	`fdIssuedAt` timestamp NOT NULL DEFAULT (now()),
	`fdExpiresAt` timestamp NOT NULL,
	`fdRedeemedAt` timestamp,
	`fdRedeemedBranchId` int,
	`fdRedeemedByStaffId` int,
	`fdSourceType` enum('review','claim','campaign','manual') NOT NULL DEFAULT 'campaign',
	`fdSourceId` int,
	`fdCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `free_drink_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `free_drink_codes_fdCode_unique` UNIQUE(`fdCode`)
);
