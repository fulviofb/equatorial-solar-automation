CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`cpfCnpj` varchar(18) NOT NULL,
	`rg` varchar(20),
	`rgIssueDate` timestamp,
	`address` text NOT NULL,
	`cep` varchar(9),
	`city` varchar(100) NOT NULL,
	`state` varchar(2) NOT NULL,
	`phone` varchar(20),
	`landline` varchar(20),
	`email` varchar(320),
	`activityType` varchar(100),
	`consumptionClass` enum('Residencial','Industrial','Comérci','serviços e outras atividades','Rural','Poder Público','Iluminação Pública','Serviço Público') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inverters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`manufacturer` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`nominalPowerAC` int NOT NULL,
	`nominalPowerDC` int,
	`maxPowerDC` int,
	`maxVoltageDC` varchar(20),
	`maxCurrentDC` varchar(20),
	`mpptVoltageMax` varchar(20),
	`mpptVoltageMin` varchar(20),
	`startupVoltageDC` varchar(20),
	`numberOfMppt` int,
	`numberOfStrings` int,
	`nominalVoltageAC` varchar(20),
	`nominalFrequency` varchar(10),
	`maxCurrentAC` varchar(20),
	`powerFactor` varchar(10),
	`thdCurrent` varchar(10),
	`maxEfficiency` varchar(10),
	`mpptEfficiency` varchar(10),
	`connectionType` varchar(50),
	`certificationNumber` varchar(100),
	`datasheetUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inverters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`documentType` enum('FORMULARIO_EXCEL','MEMORIAL_WORD','DIAGRAMA_UNIFILAR_PDF','DIAGRAMA_BLOCOS') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectInverters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`inverterId` int NOT NULL,
	`quantity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectInverters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectModuleArrays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`solarModuleId` int NOT NULL,
	`quantity` int NOT NULL,
	`arrayNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectModuleArrays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectRatioList` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`order` int NOT NULL,
	`accountContract` varchar(50) NOT NULL,
	`consumptionClass` varchar(100) NOT NULL,
	`address` text NOT NULL,
	`percentageKwh` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectRatioList_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int NOT NULL,
	`technicalResponsibleId` int NOT NULL,
	`accountContract` varchar(50),
	`connectionType` enum('MONOFÁSICO','BIFÁSICO','TRIFÁSICO') NOT NULL,
	`serviceVoltage` int NOT NULL,
	`entryBreakerCurrent` int NOT NULL,
	`availablePower` int NOT NULL,
	`declaredLoad` varchar(20),
	`branchType` enum('AÉREO','SUBTERRÂNEO') NOT NULL,
	`nearestPoleNumber` varchar(50),
	`coordinateX` varchar(50),
	`coordinateY` varchar(50),
	`hasSpecialLoads` boolean DEFAULT false,
	`specialLoadsDetail` text,
	`requestType` enum('LIGAÇÃO NOVA DE UNIDADE CONSUMIDORA COM GERAÇÃO DISTRIBUÍDA','CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE SEM AUMENTO DE POTÊNCIA DISPONIBILIZADA','CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE COM AUMENTO DE POTÊNCIA DISPONIBILIZADA','AUMENTO DA POTÊNCIA DE GERAÇÃO EM UC COM GD EXISTENTE SEM AUMENTO DE POTÊNCIA DISPONIBILIZADA','AUMENTO DA POTÊNCIA DE GERAÇÃO EM UC COM GD EXISTENTE COM AUMENTO DE POTÊNCIA DISPONIBILIZADA') NOT NULL,
	`primarySourceType` enum('SOLAR FOTOVOLTAICA','EÓLICA','HIDRÁULICA','BIOMASSA','COGERAÇÃO QUALIFICADA','HÍBRIDO','OUTRAS') NOT NULL,
	`generationType` enum('EMPREGANDO MÁQUINA SÍNCRONA SEM CONVERSOR','EMPREGANDO CONVERSOR ELETRÔNICO/INVERSOR','MISTA','OUTRA') NOT NULL,
	`classification` enum('AUTOCONSUMO LOCAL','AUTOCONSUMO REMOTO','GERAÇÃO COMPARTILHADA','EMPREENDIMENTO DE MÚLTIPLAS UNIDADES CONSUMIDORAS') NOT NULL,
	`operationStartDate` timestamp,
	`totalInstalledPower` int NOT NULL,
	`status` enum('RASCUNHO','COMPLETO','ENVIADO','APROVADO') NOT NULL DEFAULT 'RASCUNHO',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solarModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`manufacturer` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`nominalPower` int NOT NULL,
	`voc` varchar(20) NOT NULL,
	`isc` varchar(20) NOT NULL,
	`vmpp` varchar(20) NOT NULL,
	`impp` varchar(20) NOT NULL,
	`efficiency` varchar(10),
	`length` varchar(20),
	`width` varchar(20),
	`area` varchar(20),
	`weight` varchar(20),
	`datasheetUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `solarModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technicalResponsibles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(100) NOT NULL,
	`registrationNumber` varchar(50) NOT NULL,
	`registrationState` varchar(2) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`mobile` varchar(20),
	`fax` varchar(20),
	`address` text,
	`neighborhood` varchar(100),
	`city` varchar(100),
	`state` varchar(2),
	`cep` varchar(9),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technicalResponsibles_id` PRIMARY KEY(`id`)
);
