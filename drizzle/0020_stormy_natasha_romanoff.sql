CREATE TABLE `site_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sc_key` varchar(100) NOT NULL,
	`sc_value` text,
	`sc_type` varchar(50) NOT NULL DEFAULT 'image',
	`sc_label` varchar(255),
	`sc_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`sc_updatedBy` int,
	CONSTRAINT `site_content_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_content_sc_key_unique` UNIQUE(`sc_key`)
);
