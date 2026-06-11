CREATE TABLE `loyalty_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`usedPoints` int NOT NULL DEFAULT 0,
	`tier` enum('green','gold','matcha') NOT NULL DEFAULT 'green',
	`lifetimePoints` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyalty_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyalty_points_customerId_unique` UNIQUE(`customerId`)
);
--> statement-breakpoint
CREATE TABLE `point_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`branchId` int NOT NULL,
	`claimDeliveryApp` enum('shopee','lineman','grab') NOT NULL,
	`claimPointOrderId` varchar(100) NOT NULL,
	`orderAmount` int NOT NULL,
	`screenshotUrl` text,
	`claimStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`pointsAwarded` int,
	`reviewedBy` int,
	`claimRejectionReason` text,
	`claimCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`claimUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `point_claims_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_claim_delivery_order` UNIQUE(`claimDeliveryApp`,`claimPointOrderId`)
);
--> statement-breakpoint
CREATE TABLE `point_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`txType` enum('earn_store','earn_delivery','spend','adjust','expire') NOT NULL,
	`points` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`orderAmount` int,
	`description` text,
	`referenceType` varchar(50),
	`referenceId` int,
	`branchId` int,
	`staffId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `point_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`rewardId` int NOT NULL,
	`pointsSpent` int NOT NULL,
	`redemptionStatus` enum('pending','used','expired','cancelled') NOT NULL DEFAULT 'pending',
	`redemptionCode` varchar(20) NOT NULL,
	`redemptionBranchId` int,
	`usedAt` timestamp,
	`redemptionExpiresAt` timestamp NOT NULL,
	`redemptionCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_redemptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `reward_redemptions_redemptionCode_unique` UNIQUE(`redemptionCode`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`pointsCost` int NOT NULL,
	`rewardCategory` enum('drink','food','topping','discount','special') NOT NULL DEFAULT 'drink',
	`rewardImageUrl` text,
	`isActive` int NOT NULL DEFAULT 1,
	`stock` int,
	`rewardCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`rewardUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `beforeData` json;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `afterData` json;--> statement-breakpoint
ALTER TABLE `branches` ADD `address` text;--> statement-breakpoint
ALTER TABLE `codes` ADD `claimReason` text;--> statement-breakpoint
ALTER TABLE `codes` ADD `claimOrderId` varchar(100);--> statement-breakpoint
ALTER TABLE `review_requests` ADD `orderImageUrl` text;