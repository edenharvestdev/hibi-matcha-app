ALTER TABLE `codes` ADD `claimChannel` enum('shopee','lineman','grab','gpos','walk_in');--> statement-breakpoint
ALTER TABLE `codes` ADD `claimMenuCode` varchar(20);--> statement-breakpoint
ALTER TABLE `codes` ADD `claimMenuName` varchar(255);--> statement-breakpoint
ALTER TABLE `codes` ADD `claimOrderDetail` text;--> statement-breakpoint
ALTER TABLE `codes` ADD `claimError` text;--> statement-breakpoint
ALTER TABLE `codes` ADD `compensationMenuCode` varchar(20);--> statement-breakpoint
ALTER TABLE `codes` ADD `compensationMenuName` varchar(255);--> statement-breakpoint
ALTER TABLE `codes` ADD `codeCustomerPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `codes` ADD `expiryDays` int DEFAULT 30;