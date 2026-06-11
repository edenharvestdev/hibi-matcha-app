CREATE TABLE `contact_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryType` enum('franchise','wholesale','event','other') NOT NULL,
	`inquiryName` varchar(255) NOT NULL,
	`inquiryPhone` varchar(20) NOT NULL,
	`inquiryEmail` varchar(320),
	`inquiryCompany` varchar(255),
	`inquiryMessage` text NOT NULL,
	`inquiryBudget` varchar(100),
	`inquiryProvince` varchar(100),
	`inquiryStatus` enum('new','contacted','in_progress','closed') NOT NULL DEFAULT 'new',
	`inquiryNotes` text,
	`inquiryHandledBy` int,
	`inquiryCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`inquiryUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueCustomerId` int NOT NULL,
	`issueBranchId` int NOT NULL,
	`issueDeliveryApp` enum('shopee','lineman','grab','walk_in') NOT NULL,
	`issueOrderId` varchar(100),
	`issueCategory` enum('wrong_order','missing_item','quality','late_delivery','damaged','other') NOT NULL,
	`issueDescription` text NOT NULL,
	`issueImageUrl` text,
	`issueStatus` enum('open','acknowledged','in_progress','resolved','escalated','closed') NOT NULL DEFAULT 'open',
	`issuePriority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`issueAssignedTo` int,
	`issueResolution` text,
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`escalatedAt` timestamp,
	`slaResponseDeadline` timestamp NOT NULL,
	`slaResolutionDeadline` timestamp NOT NULL,
	`issueCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`issueUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `branches` ADD `branchPhone` varchar(20);