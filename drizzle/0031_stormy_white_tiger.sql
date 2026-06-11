CREATE TABLE `service_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sz_name` varchar(255) NOT NULL,
	`sz_description` text,
	`sz_isActive` int NOT NULL DEFAULT 1,
	`sz_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sz_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `branches` ADD `zoneId` int;