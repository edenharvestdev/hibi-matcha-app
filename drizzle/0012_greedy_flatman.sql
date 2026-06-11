CREATE TABLE `review_menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rmiCode` varchar(20) NOT NULL,
	`rmiName` varchar(255) NOT NULL,
	`rmiDescription` text,
	`rmiIsActive` int NOT NULL DEFAULT 1,
	`rmiSortOrder` int NOT NULL DEFAULT 0,
	`rmiCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`rmiUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_menu_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_menu_items_rmiCode_unique` UNIQUE(`rmiCode`)
);
