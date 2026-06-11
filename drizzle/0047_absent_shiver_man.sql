CREATE TABLE `sop_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sop_ing_menuItemId` int NOT NULL,
	`sop_ing_name` varchar(255) NOT NULL,
	`sop_ing_nameTh` varchar(255) NOT NULL,
	`sop_ing_amount` varchar(64) NOT NULL,
	`sop_ing_unit` varchar(32) NOT NULL,
	`sop_ing_sortOrder` int NOT NULL DEFAULT 0,
	`layerLabel` varchar(128),
	`layerColor` varchar(32),
	`sop_ing_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sop_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_menu_branch_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sop_mbv_menuItemId` int NOT NULL,
	`sop_mbv_branchId` int NOT NULL,
	`teaVariant` varchar(255),
	`teaVariantTh` varchar(255),
	`sop_mbv_priceShop` int,
	`sop_mbv_priceDelivery` int,
	`sop_mbv_overrides` json,
	`sop_mbv_note` text,
	`sop_mbv_createdBy` int,
	`sop_mbv_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sop_mbv_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sop_menu_branch_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`nameTh` varchar(255) NOT NULL,
	`description` text,
	`descriptionTh` text,
	`matchaType` varchar(255),
	`priceShop` int NOT NULL,
	`priceDelivery` int NOT NULL,
	`cupSize` varchar(32) DEFAULT '16oz',
	`sop_strawSize` enum('small','large') NOT NULL DEFAULT 'large',
	`syrupNote` text,
	`sop_imageUrl` text,
	`aiImageUrl` text,
	`sop_status` enum('draft','pending_review','approved','published','archived') NOT NULL DEFAULT 'draft',
	`reviewedBy` int,
	`sop_reviewedAt` timestamp,
	`reviewComment` text,
	`currentVersion` int DEFAULT 1,
	`approvedBy` varchar(255),
	`approvedAt` bigint,
	`publishedAt` bigint,
	`sop_createdBy` int,
	`sop_mi_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sop_mi_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sop_menu_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `sop_menu_items_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `sop_prep_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sop_ps_menuItemId` int NOT NULL,
	`sop_ps_stepNumber` int NOT NULL,
	`sop_ps_instruction` text NOT NULL,
	`sop_ps_instructionTh` text NOT NULL,
	`sop_ps_aiEnhanced` text,
	`sop_ps_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sop_prep_steps_id` PRIMARY KEY(`id`)
);
