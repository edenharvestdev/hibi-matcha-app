CREATE TABLE `daily_sales_extra_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dsec_salesRecordId` int NOT NULL,
	`dsec_channelName` varchar(255) NOT NULL,
	`dsec_amount` int NOT NULL DEFAULT 0,
	CONSTRAINT `daily_sales_extra_channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_sales_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dsr_branchId` int NOT NULL,
	`dsr_salesDate` timestamp NOT NULL,
	`dsr_cashAmount` int NOT NULL DEFAULT 0,
	`dsr_transferAmount` int NOT NULL DEFAULT 0,
	`dsr_edcAmount` int NOT NULL DEFAULT 0,
	`dsr_deliveryAmount` int NOT NULL DEFAULT 0,
	`dsr_extraTotal` int NOT NULL DEFAULT 0,
	`dsr_totalAmount` int NOT NULL DEFAULT 0,
	`dsr_note` text,
	`dsr_createdBy` int NOT NULL,
	`dsr_createdByName` varchar(255),
	`dsr_updatedBy` int,
	`dsr_createdAt` timestamp NOT NULL DEFAULT (now()),
	`dsr_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_sales_records_id` PRIMARY KEY(`id`)
);
