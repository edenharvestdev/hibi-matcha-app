CREATE TABLE `daily_sales_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dsal_salesRecordId` int NOT NULL,
	`dsal_branchId` int NOT NULL,
	`dsal_userId` int NOT NULL,
	`dsal_userName` varchar(255),
	`dsal_action` enum('create','update') NOT NULL,
	`dsal_beforeData` text,
	`dsal_afterData` text NOT NULL,
	`dsal_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_sales_audit_logs_id` PRIMARY KEY(`id`)
);
