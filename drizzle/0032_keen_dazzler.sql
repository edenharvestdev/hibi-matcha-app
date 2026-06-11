CREATE TABLE `customer_announcement_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`car_customerId` int NOT NULL,
	`car_announcementId` int NOT NULL,
	`car_readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_announcement_reads_id` PRIMARY KEY(`id`),
	CONSTRAINT `car_customer_announcement_idx` UNIQUE(`car_customerId`,`car_announcementId`)
);
