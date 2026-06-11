CREATE TABLE `petty_cash_fund_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pcfr_branchId` int NOT NULL,
	`pcfr_requestedAmount` int NOT NULL,
	`pcfr_reason` varchar(500) NOT NULL,
	`pcfr_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`pcfr_requestedBy` int NOT NULL,
	`pcfr_requestedByName` varchar(255),
	`pcfr_processedBy` int,
	`pcfr_processedAt` timestamp,
	`pcfr_processedNote` varchar(500),
	`pcfr_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `petty_cash_fund_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `petty_cash_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pcs_branchId` int NOT NULL,
	`pcs_alertThreshold` int NOT NULL DEFAULT 1000,
	`pcs_bankAccountName` varchar(255),
	`pcs_bankAccountNumber` varchar(50),
	`pcs_bankName` varchar(100),
	`pcs_promptPayId` varchar(50),
	`pcs_allowedRole` enum('branch_manager','branch_staff','both') NOT NULL DEFAULT 'branch_manager',
	`pcs_isActive` int NOT NULL DEFAULT 1,
	`pcs_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pcs_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `petty_cash_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `petty_cash_settings_pcs_branchId_unique` UNIQUE(`pcs_branchId`)
);
--> statement-breakpoint
CREATE TABLE `petty_cash_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pct_branchId` int NOT NULL,
	`pct_type` enum('deposit','expense','adjustment') NOT NULL,
	`pct_amount` int NOT NULL,
	`pct_description` varchar(500) NOT NULL,
	`pct_category` varchar(100),
	`pct_receiptUrl` varchar(1000),
	`pct_transferMethod` enum('cash','transfer','promptpay'),
	`pct_transactionDate` timestamp NOT NULL,
	`pct_balanceAfter` int NOT NULL,
	`pct_createdBy` int NOT NULL,
	`pct_createdByName` varchar(255),
	`pct_note` text,
	`pct_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `petty_cash_transactions_id` PRIMARY KEY(`id`)
);
