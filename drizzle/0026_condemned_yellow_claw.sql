CREATE TABLE `password_reset_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prr_customerId` int NOT NULL,
	`prr_identifier` varchar(320) NOT NULL,
	`prr_identifierType` enum('phone','email') NOT NULL,
	`prr_status` enum('pending','processed','expired') NOT NULL DEFAULT 'pending',
	`prr_processedBy` int,
	`prr_processedAt` timestamp,
	`prr_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prt_customerId` int NOT NULL,
	`prt_token` varchar(64) NOT NULL,
	`prt_requestId` int,
	`prt_createdBy` int NOT NULL,
	`prt_expiresAt` timestamp NOT NULL,
	`prt_usedAt` timestamp,
	`prt_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_prt_token_unique` UNIQUE(`prt_token`)
);
