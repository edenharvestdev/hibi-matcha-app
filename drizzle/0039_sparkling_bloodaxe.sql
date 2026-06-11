CREATE TABLE `pos_branch_menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_bmi_branchId` int NOT NULL,
	`pos_bmi_menuItemId` int NOT NULL,
	`pos_bmi_price` decimal(10,2),
	`pos_bmi_costPrice` decimal(10,2),
	`pos_bmi_isAvailable` boolean NOT NULL DEFAULT true,
	`pos_bmi_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_bmi_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_branch_menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_branch_retail_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_brs_branchId` int NOT NULL,
	`pos_brs_retailProductId` int NOT NULL,
	`pos_brs_stock` int NOT NULL DEFAULT 0,
	`pos_brs_minStock` int NOT NULL DEFAULT 0,
	`pos_brs_price` decimal(10,2),
	`pos_brs_isAvailable` boolean NOT NULL DEFAULT true,
	`pos_brs_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_branch_retail_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`pos_cat_type` enum('beverage','food','dessert','retail') NOT NULL DEFAULT 'beverage',
	`pos_cat_sortOrder` int NOT NULL DEFAULT 0,
	`pos_cat_isActive` boolean NOT NULL DEFAULT true,
	`pos_cat_imageUrl` text,
	`pos_cat_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_cat_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_daily_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_ds_branchId` int NOT NULL,
	`pos_ds_date` varchar(10) NOT NULL,
	`pos_ds_totalOrders` int NOT NULL DEFAULT 0,
	`pos_ds_totalRevenue` decimal(12,2) NOT NULL DEFAULT '0',
	`pos_ds_totalCost` decimal(12,2) NOT NULL DEFAULT '0',
	`pos_ds_totalDiscount` decimal(12,2) NOT NULL DEFAULT '0',
	`pos_ds_cashAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`pos_ds_transferAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`pos_ds_otherAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`pos_ds_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_ds_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_daily_summaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_discounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_disc_name` varchar(200) NOT NULL,
	`pos_disc_type` enum('percentage','fixed') NOT NULL,
	`pos_disc_value` decimal(10,2) NOT NULL,
	`pos_disc_scope` enum('item','order') NOT NULL DEFAULT 'order',
	`pos_disc_code` varchar(50),
	`pos_disc_minOrder` decimal(10,2),
	`pos_disc_maxDisc` decimal(10,2),
	`pos_disc_isActive` boolean NOT NULL DEFAULT true,
	`pos_disc_startDate` timestamp,
	`pos_disc_endDate` timestamp,
	`pos_disc_requiresPerm` boolean NOT NULL DEFAULT false,
	`pos_disc_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_disc_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_discounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_kitchen_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_kt_orderId` int NOT NULL,
	`pos_kt_branchId` int NOT NULL,
	`pos_kt_ticketNumber` varchar(30) NOT NULL,
	`pos_kt_station` enum('kitchen','bar') NOT NULL,
	`pos_kt_status` enum('pending','preparing','ready','served') NOT NULL DEFAULT 'pending',
	`pos_kt_items` json NOT NULL,
	`pos_kt_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_kt_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_kitchen_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_menu_item_option_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_miog_menuItemId` int NOT NULL,
	`pos_miog_optionGroupId` int NOT NULL,
	CONSTRAINT `pos_menu_item_option_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_mi_categoryId` int NOT NULL,
	`pos_mi_name` varchar(200) NOT NULL,
	`pos_mi_code` varchar(20),
	`pos_mi_description` text,
	`pos_mi_imageUrl` text,
	`pos_mi_basePrice` decimal(10,2) NOT NULL,
	`pos_mi_costPrice` decimal(10,2) DEFAULT '0',
	`pos_mi_sendTo` enum('kitchen','bar','none') NOT NULL DEFAULT 'bar',
	`pos_mi_isActive` boolean NOT NULL DEFAULT true,
	`pos_mi_sortOrder` int NOT NULL DEFAULT 0,
	`pos_mi_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_mi_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_option_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_og_name` varchar(100) NOT NULL,
	`pos_og_type` enum('single','multiple') NOT NULL DEFAULT 'single',
	`pos_og_isRequired` boolean NOT NULL DEFAULT false,
	`pos_og_maxSelections` int DEFAULT 1,
	`pos_og_sortOrder` int NOT NULL DEFAULT 0,
	`pos_og_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_og_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_option_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_opt_groupId` int NOT NULL,
	`pos_opt_name` varchar(100) NOT NULL,
	`pos_opt_priceAdj` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_opt_costAdj` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_opt_isDefault` boolean NOT NULL DEFAULT false,
	`pos_opt_isActive` boolean NOT NULL DEFAULT true,
	`pos_opt_sortOrder` int NOT NULL DEFAULT 0,
	`pos_opt_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_opt_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_order_item_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_oio_orderItemId` int NOT NULL,
	`pos_oio_groupName` varchar(100) NOT NULL,
	`pos_oio_optionName` varchar(100) NOT NULL,
	`pos_oio_priceAdj` decimal(10,2) NOT NULL DEFAULT '0',
	CONSTRAINT `pos_order_item_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_oi_orderId` int NOT NULL,
	`pos_oi_itemType` enum('menu','retail') NOT NULL DEFAULT 'menu',
	`pos_oi_menuItemId` int,
	`pos_oi_retailProductId` int,
	`pos_oi_name` varchar(200) NOT NULL,
	`pos_oi_quantity` int NOT NULL DEFAULT 1,
	`pos_oi_unitPrice` decimal(10,2) NOT NULL,
	`pos_oi_unitCost` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_oi_optionsPrice` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_oi_discountAmt` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_oi_totalPrice` decimal(10,2) NOT NULL,
	`pos_oi_sendTo` enum('kitchen','bar','none') NOT NULL DEFAULT 'none',
	`pos_oi_note` text,
	`pos_oi_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pos_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_order_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_op_orderId` int NOT NULL,
	`pos_op_paymentMethodId` int NOT NULL,
	`pos_op_amount` decimal(10,2) NOT NULL,
	`pos_op_reference` varchar(100),
	`pos_op_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pos_order_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_ord_orderNumber` varchar(30) NOT NULL,
	`pos_ord_branchId` int NOT NULL,
	`pos_ord_staffId` int NOT NULL,
	`pos_ord_status` enum('open','completed','voided','refunded') NOT NULL DEFAULT 'open',
	`pos_ord_orderType` enum('dine_in','takeaway','delivery') NOT NULL DEFAULT 'dine_in',
	`pos_ord_subtotal` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_ord_discountAmt` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_ord_discountId` int,
	`pos_ord_taxAmt` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_ord_totalAmt` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_ord_totalCost` decimal(10,2) NOT NULL DEFAULT '0',
	`pos_ord_note` text,
	`pos_ord_custName` varchar(100),
	`pos_ord_custPhone` varchar(20),
	`pos_ord_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_ord_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`pos_ord_completedAt` timestamp,
	CONSTRAINT `pos_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_pm_name` varchar(100) NOT NULL,
	`pos_pm_code` varchar(20) NOT NULL,
	`pos_pm_type` enum('cash','transfer','qr','edc','credit','ewallet','other') NOT NULL,
	`pos_pm_isActive` boolean NOT NULL DEFAULT true,
	`pos_pm_sortOrder` int NOT NULL DEFAULT 0,
	`pos_pm_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pos_payment_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `pos_payment_methods_pos_pm_code_unique` UNIQUE(`pos_pm_code`)
);
--> statement-breakpoint
CREATE TABLE `pos_retail_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_rp_categoryId` int NOT NULL,
	`pos_rp_name` varchar(200) NOT NULL,
	`pos_rp_sku` varchar(50),
	`pos_rp_barcode` varchar(50),
	`pos_rp_description` text,
	`pos_rp_imageUrl` text,
	`pos_rp_price` decimal(10,2) NOT NULL,
	`pos_rp_costPrice` decimal(10,2) DEFAULT '0',
	`pos_rp_isActive` boolean NOT NULL DEFAULT true,
	`pos_rp_sortOrder` int NOT NULL DEFAULT 0,
	`pos_rp_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_rp_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_retail_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_staff_pins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pos_sp_branchId` int NOT NULL,
	`pos_sp_name` varchar(100) NOT NULL,
	`pos_sp_pin` varchar(10) NOT NULL,
	`pos_sp_role` enum('manager','cashier','kitchen') NOT NULL DEFAULT 'cashier',
	`pos_sp_isActive` boolean NOT NULL DEFAULT true,
	`pos_sp_lastLogin` timestamp,
	`pos_sp_createdAt` timestamp NOT NULL DEFAULT (now()),
	`pos_sp_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_staff_pins_id` PRIMARY KEY(`id`)
);
