ALTER TABLE `in_store_sales` ADD `iss_isAppSale` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `in_store_sales` ADD `iss_totalCost` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `shop_products` ADD `sp_costPrice` int DEFAULT 0;