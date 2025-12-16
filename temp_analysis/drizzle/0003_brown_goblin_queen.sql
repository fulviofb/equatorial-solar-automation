ALTER TABLE `inverters` ADD `maxCurrentPerInput` varchar(20);--> statement-breakpoint
ALTER TABLE `inverters` ADD `isMicroinverter` int DEFAULT 0;