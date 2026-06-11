CREATE TABLE `branch_commission_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bcs_branchId` int NOT NULL,
	`bcs_commissionRate` decimal(5,2) NOT NULL DEFAULT '5.00',
	`bcs_minMonthlySales` int NOT NULL DEFAULT 0,
	`bcs_isActive` int NOT NULL DEFAULT 1,
	`bcs_note` text,
	`bcs_createdAt` timestamp NOT NULL DEFAULT (now()),
	`bcs_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branch_commission_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `branch_commission_settings_bcs_branchId_unique` UNIQUE(`bcs_branchId`)
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ci_customerId` int NOT NULL,
	`ci_productId` int NOT NULL,
	`ci_quantity` int NOT NULL DEFAULT 1,
	`ci_createdAt` timestamp NOT NULL DEFAULT (now()),
	`ci_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_cart_customer_product` UNIQUE(`ci_customerId`,`ci_productId`)
);
--> statement-breakpoint
CREATE TABLE `shop_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sc_name` varchar(255) NOT NULL,
	`sc_description` text,
	`sc_imageUrl` text,
	`sc_sortOrder` int NOT NULL DEFAULT 0,
	`sc_isActive` int NOT NULL DEFAULT 1,
	`sc_createdAt2` timestamp NOT NULL DEFAULT (now()),
	`sc_updatedAt2` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`soi_orderId` int NOT NULL,
	`soi_productId` int NOT NULL,
	`soi_productName` varchar(255) NOT NULL,
	`soi_productSku` varchar(50),
	`soi_price` int NOT NULL,
	`soi_quantity` int NOT NULL,
	`soi_subtotal` int NOT NULL,
	`soi_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`so_orderNumber` varchar(30) NOT NULL,
	`so_customerId` int NOT NULL,
	`so_status` enum('pending_payment','payment_uploaded','payment_confirmed','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending_payment',
	`so_totalAmount` int NOT NULL,
	`so_shippingMethod` enum('pickup','delivery','delivery_with_code') NOT NULL,
	`so_shippingFee` int NOT NULL DEFAULT 0,
	`so_pickupBranchId` int,
	`so_shippingAddress` text,
	`so_shippingName` varchar(255),
	`so_shippingPhone` varchar(20),
	`so_deliveryCode` varchar(50),
	`so_trackingNumber` varchar(100),
	`so_paymentMethod` enum('bank_transfer','promptpay') NOT NULL DEFAULT 'bank_transfer',
	`so_paymentSlipUrl` text,
	`so_paymentConfirmedBy` int,
	`so_paymentConfirmedAt` timestamp,
	`so_note` text,
	`so_adminNote` text,
	`so_commissionBranchId` int,
	`so_commissionRate` decimal(5,2),
	`so_commissionAmount` int,
	`so_commissionStatus` enum('pending','confirmed','paid') DEFAULT 'pending',
	`so_createdAt` timestamp NOT NULL DEFAULT (now()),
	`so_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_orders_so_orderNumber_unique` UNIQUE(`so_orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `shop_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sp_categoryId` int,
	`sp_sku` varchar(50),
	`sp_name` varchar(255) NOT NULL,
	`sp_description` text,
	`sp_imageUrl` text,
	`sp_images` json,
	`sp_retailPrice` int NOT NULL,
	`sp_wholesalePrice` int,
	`sp_wholesaleMinQty` int DEFAULT 10,
	`sp_unit` varchar(50) NOT NULL DEFAULT 'ชิ้น',
	`sp_weight` int,
	`sp_stock` int NOT NULL DEFAULT 0,
	`sp_isActive` int NOT NULL DEFAULT 1,
	`sp_isFeatured` int NOT NULL DEFAULT 0,
	`sp_sortOrder` int NOT NULL DEFAULT 0,
	`sp_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sp_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_products_sp_sku_unique` UNIQUE(`sp_sku`)
);
