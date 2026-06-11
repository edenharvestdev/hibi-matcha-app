CREATE TABLE `automation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`workflowName` varchar(255) NOT NULL,
	`event` varchar(64) NOT NULL,
	`eventData` json,
	`actionsExecuted` json,
	`status` enum('success','partial','failed') NOT NULL DEFAULT 'success',
	`error` text,
	`duration` int,
	`triggeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameTh` varchar(255) NOT NULL,
	`description` text,
	`event` enum('menu_created','menu_updated','branch_created','staff_created','ingredient_price_updated','training_completed','cost_threshold_exceeded') NOT NULL,
	`actions` json NOT NULL,
	`conditions` json,
	`isActive` int NOT NULL DEFAULT 1,
	`isPrebuilt` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `branch_performance_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`totalScore` int NOT NULL,
	`foodCostScore` int,
	`trainingScore` int,
	`acknowledgmentScore` int,
	`wasteScore` int,
	`accuracyScore` int,
	`rank` int,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `branch_performance_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`content` text,
	`fileUrl` text,
	`generatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `food_cost_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`date` timestamp NOT NULL,
	`foodCostPct` decimal(5,2) NOT NULL,
	`thresholdPct` decimal(5,2) NOT NULL,
	`aiAnalysis` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `food_cost_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `franchise_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`packageType` enum('starter','growth','enterprise') NOT NULL DEFAULT 'starter',
	`templateVersion` int NOT NULL DEFAULT 1,
	`signedAt` timestamp,
	`expiresAt` timestamp,
	`ipAddress` varchar(45),
	`contentHash` varchar(64),
	`signatureImageUrl` text,
	`fa_status` enum('active','expired','terminated') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `franchise_agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_catalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameTh` varchar(255) NOT NULL,
	`category` enum('hibi','external') NOT NULL DEFAULT 'external',
	`unit` varchar(32) NOT NULL,
	`description` text,
	`defaultPackSize` varchar(64),
	`defaultCostPerUnit` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredient_catalog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_order_issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`type` enum('missing','damaged','wrong_item','other') NOT NULL DEFAULT 'other',
	`description` text,
	`imageUrls` json,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredient_order_issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`qty` decimal(10,3) NOT NULL,
	`unit` varchar(50),
	`unitPrice` decimal(10,2),
	`subtotal` decimal(10,2),
	`fulfilledQty` decimal(10,3),
	CONSTRAINT `ingredient_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_order_status_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`fromStatus` varchar(32) NOT NULL,
	`toStatus` varchar(32) NOT NULL,
	`changedBy` int,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredient_order_status_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`status` enum('pending','confirmed','preparing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`totalAmount` decimal(10,2),
	`notes` text,
	`createdBy` int,
	`confirmedBy` int,
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredient_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_price_catalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ingredientId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`unit` varchar(50),
	`effectiveDate` timestamp NOT NULL DEFAULT (now()),
	`setBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredient_price_catalog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`catalogId` int NOT NULL,
	`supplierId` int,
	`packSize` varchar(64) NOT NULL,
	`packUnit` varchar(32) NOT NULL,
	`packPrice` int NOT NULL,
	`costPerUnit` int NOT NULL,
	`isDefault` int NOT NULL DEFAULT 0,
	`effectiveDate` timestamp NOT NULL DEFAULT (now()),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredient_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_cost_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuItemId` int NOT NULL,
	`branchId` int,
	`costPerCup` int NOT NULL,
	`foodCostPct` decimal(5,2),
	`grossProfit` int,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_cost_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ocr_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mode` enum('recipe','receipt','label','delivery_slip','petty_cash','sales_slip') NOT NULL,
	`imageUrl` text,
	`resultJson` json,
	`confidence` int,
	`success` int NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ocr_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`ob_packageType` enum('starter','growth','enterprise'),
	`businessInfo` json,
	`paymentConfirmed` int NOT NULL DEFAULT 0,
	`autoSetupCompleted` int NOT NULL DEFAULT 0,
	`goLiveReady` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_acknowledgments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffCodeId` int NOT NULL,
	`documentId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	CONSTRAINT `sop_acknowledgments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_changelogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuItemId` int NOT NULL,
	`fromVersion` int NOT NULL,
	`toVersion` int NOT NULL,
	`summaryAi` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sop_changelogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_review_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuItemId` int NOT NULL,
	`fromStatus` varchar(32) NOT NULL,
	`toStatus` varchar(32) NOT NULL,
	`changedBy` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sop_review_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('hibi','external') NOT NULL DEFAULT 'external',
	`contactName` varchar(255),
	`phone` varchar(64),
	`email` varchar(255),
	`address` text,
	`note` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sop_suppliers_id` PRIMARY KEY(`id`)
);
