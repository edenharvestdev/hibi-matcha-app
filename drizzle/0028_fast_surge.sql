CREATE TABLE `reward_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rc_name` varchar(255) NOT NULL,
	`rc_icon` varchar(50) NOT NULL DEFAULT 'gift',
	`rc_color` varchar(100) NOT NULL DEFAULT 'bg-gray-50 text-gray-600',
	`rc_isActive` int NOT NULL DEFAULT 1,
	`rc_sortOrder` int NOT NULL DEFAULT 0,
	`rc_createdAt` timestamp NOT NULL DEFAULT (now()),
	`rc_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reward_categories_id` PRIMARY KEY(`id`)
);
