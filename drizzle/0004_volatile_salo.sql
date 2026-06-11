CREATE TABLE `order_issue_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderIssueId` int NOT NULL,
	`oiiImageUrl` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`oiiCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_issue_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`branchId` int NOT NULL,
	`sbCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_branches_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_staff_branch` UNIQUE(`staffId`,`branchId`)
);
--> statement-breakpoint
CREATE TABLE `staff_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`permStaffId` int NOT NULL,
	`permission` varchar(50) NOT NULL,
	`permCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_staff_permission` UNIQUE(`permStaffId`,`permission`)
);
--> statement-breakpoint
ALTER TABLE `order_issues` MODIFY COLUMN `issueDeliveryApp` enum('shopee','lineman','grab','gpos','walk_in') NOT NULL;--> statement-breakpoint
ALTER TABLE `point_claims` MODIFY COLUMN `claimDeliveryApp` enum('shopee','lineman','grab','gpos') NOT NULL;--> statement-breakpoint
ALTER TABLE `review_requests` MODIFY COLUMN `deliveryApp` enum('shopee','lineman','grab','gpos') NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` MODIFY COLUMN `staffRole` enum('branch_admin','area_manager','support_staff','super_admin') NOT NULL;