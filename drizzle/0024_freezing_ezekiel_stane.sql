CREATE TABLE `menu_option_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mog_menuType` enum('review','reward') NOT NULL,
	`mog_menuId` int NOT NULL,
	`mog_optionGroupId` int NOT NULL,
	`mog_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_option_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_menu_option_group` UNIQUE(`mog_menuType`,`mog_menuId`,`mog_optionGroupId`)
);
