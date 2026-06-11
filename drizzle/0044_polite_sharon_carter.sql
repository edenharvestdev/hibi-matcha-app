CREATE TABLE `petty_cash_receipt_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pcri_transactionId` int NOT NULL,
	`pcri_branchId` int NOT NULL,
	`pcri_imageUrl` varchar(1000) NOT NULL,
	`pcri_fileType` varchar(50) NOT NULL,
	`pcri_fileName` varchar(255),
	`pcri_ocrText` text,
	`pcri_ocrData` text,
	`pcri_sortOrder` int NOT NULL DEFAULT 0,
	`pcri_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `petty_cash_receipt_images_id` PRIMARY KEY(`id`)
);
