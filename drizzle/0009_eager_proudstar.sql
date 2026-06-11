ALTER TABLE `staff` ADD `employeeCode` varchar(50);--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_employeeCode_unique` UNIQUE(`employeeCode`);