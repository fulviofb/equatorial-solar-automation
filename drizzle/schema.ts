import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clientes - Titulares das unidades consumidoras
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Usuário que criou o cliente
  name: varchar("name", { length: 255 }).notNull(), // Nome completo ou Razão Social
  cpfCnpj: varchar("cpfCnpj", { length: 18 }).notNull(), // CPF ou CNPJ
  rg: varchar("rg", { length: 20 }), // RG
  rgIssueDate: timestamp("rgIssueDate"), // Data de expedição do RG
  address: text("address").notNull(), // Endereço completo
  cep: varchar("cep", { length: 9 }), // CEP
  city: varchar("city", { length: 100 }).notNull(), // Município
  state: varchar("state", { length: 2 }).notNull(), // UF
  phone: varchar("phone", { length: 20 }), // Telefone celular
  landline: varchar("landline", { length: 20 }), // Telefone fixo
  email: varchar("email", { length: 320 }), // E-mail
  activityType: varchar("activityType", { length: 100 }), // Ramo de atividade
  consumptionClass: mysqlEnum("consumptionClass", [
    "Residencial",
    "Industrial",
    "Comércio, serviços e outras atividades",
    "Rural",
    "Poder Público",
    "Iluminação Pública",
    "Serviço Público"
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Responsáveis Técnicos
 */
export const technicalResponsibles = mysqlTable("technicalResponsibles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Usuário que criou o responsável
  name: varchar("name", { length: 255 }).notNull(), // Nome completo
  title: varchar("title", { length: 100 }).notNull(), // Título profissional
  registrationNumber: varchar("registrationNumber", { length: 50 }).notNull(), // Número do registro
  registrationState: varchar("registrationState", { length: 2 }).notNull(), // UF do registro
  email: varchar("email", { length: 320 }).notNull(), // E-mail
  phone: varchar("phone", { length: 20 }), // Telefone fixo
  mobile: varchar("mobile", { length: 20 }), // Telefone celular
  fax: varchar("fax", { length: 20 }), // Fax
  address: text("address"), // Endereço de correspondência
  neighborhood: varchar("neighborhood", { length: 100 }), // Bairro
  city: varchar("city", { length: 100 }), // Município
  state: varchar("state", { length: 2 }), // UF
  cep: varchar("cep", { length: 9 }), // CEP
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TechnicalResponsible = typeof technicalResponsibles.$inferSelect;
export type InsertTechnicalResponsible = typeof technicalResponsibles.$inferInsert;

/**
 * Módulos Fotovoltaicos - Biblioteca de equipamentos
 */
export const solarModules = mysqlTable("solarModules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Usuário que cadastrou o módulo
  manufacturer: varchar("manufacturer", { length: 100 }).notNull(), // Fabricante
  model: varchar("model", { length: 100 }).notNull(), // Modelo
  nominalPower: int("nominalPower").notNull(), // Potência nominal em W
  voc: varchar("voc", { length: 20 }).notNull(), // Tensão de circuito aberto (V)
  isc: varchar("isc", { length: 20 }).notNull(), // Corrente de curto-circuito (A)
  vmpp: varchar("vmpp", { length: 20 }).notNull(), // Tensão de máxima potência (V)
  impp: varchar("impp", { length: 20 }).notNull(), // Corrente de máxima potência (A)
  efficiency: varchar("efficiency", { length: 10 }), // Eficiência (%)
  length: varchar("length", { length: 20 }), // Comprimento (m)
  width: varchar("width", { length: 20 }), // Largura (m)
  area: varchar("area", { length: 20 }), // Área (m²)
  weight: varchar("weight", { length: 20 }), // Peso (kg)
  datasheetUrl: text("datasheetUrl"), // URL do datasheet
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SolarModule = typeof solarModules.$inferSelect;
export type InsertSolarModule = typeof solarModules.$inferInsert;

/**
 * Inversores - Biblioteca de equipamentos
 */
export const inverters = mysqlTable("inverters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Usuário que cadastrou o inversor
  manufacturer: varchar("manufacturer", { length: 100 }).notNull(), // Fabricante
  model: varchar("model", { length: 100 }).notNull(), // Modelo
  nominalPowerAC: int("nominalPowerAC").notNull(), // Potência nominal CA (W)
  nominalPowerDC: int("nominalPowerDC"), // Potência nominal CC (W)
  maxPowerDC: int("maxPowerDC"), // Máxima potência CC (W)
  maxVoltageDC: varchar("maxVoltageDC", { length: 50 }), // Máxima tensão CC (V)
  maxCurrentDC: varchar("maxCurrentDC", { length: 50 }), // Máxima corrente CC (A)
  mpptVoltageMax: varchar("mpptVoltageMax", { length: 50 }), // Máxima tensão MPPT (V)
  mpptVoltageMin: varchar("mpptVoltageMin", { length: 50 }), // Mínima tensão MPPT (V)
  startupVoltageDC: varchar("startupVoltageDC", { length: 50 }), // Tensão de partida CC (V)
  numberOfMppt: int("numberOfMppt"), // Quantidade de MPPT
  numberOfStrings: int("numberOfStrings"), // Quantidade de strings
  maxCurrentPerInput: varchar("maxCurrentPerInput", { length: 50 }), // Corrente máxima por entrada (A)
  isMicroinverter: int("isMicroinverter").default(0), // 0 = inversor string, 1 = microinversor
  nominalVoltageAC: varchar("nominalVoltageAC", { length: 50 }), // Tensão nominal CA (V)
  nominalFrequency: varchar("nominalFrequency", { length: 50 }), // Frequência nominal (Hz)
  maxCurrentAC: varchar("maxCurrentAC", { length: 50 }), // Máxima corrente CA (A)
  powerFactor: varchar("powerFactor", { length: 50 }), // Fator de potência
  thdCurrent: varchar("thdCurrent", { length: 50 }), // THD de corrente (%)
  maxEfficiency: varchar("maxEfficiency", { length: 50 }), // Eficiência máxima (%)
  euEfficiency: varchar("euEfficiency", { length: 50 }), // Eficiência EU (%)
  mpptEfficiency: varchar("mpptEfficiency", { length: 50 }), // Eficiência MPPT (%)
  connectionType: varchar("connectionType", { length: 50 }), // Tipo de conexão (ex: 1+1+1)
  certificationNumber: varchar("certificationNumber", { length: 100 }), // Número do certificado de conformidade
  datasheetUrl: text("datasheetUrl"), // URL do datasheet
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inverter = typeof inverters.$inferSelect;
export type InsertInverter = typeof inverters.$inferInsert;

/**
 * Projetos de Microgeração Distribuída
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Usuário que criou o projeto
  clientId: int("clientId").notNull(), // Cliente (titular da UC)
  technicalResponsibleId: int("technicalResponsibleId").notNull(), // Responsável técnico

  // Dados da Unidade Consumidora
  accountContract: varchar("accountContract", { length: 50 }), // Conta Contrato
  connectionType: mysqlEnum("connectionType", ["MONOFÁSICO", "BIFÁSICO", "TRIFÁSICO"]).notNull(),
  serviceVoltage: int("serviceVoltage").notNull(), // Tensão de atendimento (V)
  entryBreakerCurrent: int("entryBreakerCurrent").notNull(), // Disjuntor de entrada (A)
  availablePower: int("availablePower").notNull(), // Potência disponibilizada (kW)
  declaredLoad: varchar("declaredLoad", { length: 20 }), // Carga declarada (kW)
  branchType: mysqlEnum("branchType", ["AÉREO", "SUBTERRÂNEO"]).notNull(), // Tipo de ramal
  nearestPoleNumber: varchar("nearestPoleNumber", { length: 50 }), // Número do poste mais próximo
  coordinateX: varchar("coordinateX", { length: 50 }), // Coordenada X (UTM)
  coordinateY: varchar("coordinateY", { length: 50 }), // Coordenada Y (UTM)
  hasSpecialLoads: boolean("hasSpecialLoads").default(false), // Possui cargas especiais
  specialLoadsDetail: text("specialLoadsDetail"), // Detalhamento de cargas especiais

  // Tipo de Solicitação
  requestType: mysqlEnum("requestType", [
    "LIGAÇÃO NOVA DE UNIDADE CONSUMIDORA COM GERAÇÃO DISTRIBUÍDA",
    "CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE SEM AUMENTO DE POTÊNCIA DISPONIBILIZADA",
    "CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE COM AUMENTO DE POTÊNCIA DISPONIBILIZADA",
    "AUMENTO DA POTÊNCIA DE GERAÇÃO EM UC COM GD EXISTENTE SEM AUMENTO DE POTÊNCIA DISPONIBILIZADA",
    "AUMENTO DA POTÊNCIA DE GERAÇÃO EM UC COM GD EXISTENTE COM AUMENTO DE POTÊNCIA DISPONIBILIZADA"
  ]).notNull(),

  // Características da Microgeração
  primarySourceType: mysqlEnum("primarySourceType", [
    "SOLAR FOTOVOLTAICA",
    "EÓLICA",
    "HIDRÁULICA",
    "BIOMASSA",
    "COGERAÇÃO QUALIFICADA",
    "HÍBRIDO",
    "OUTRAS"
  ]).notNull(),
  generationType: mysqlEnum("generationType", [
    "EMPREGANDO MÁQUINA SÍNCRONA SEM CONVERSOR",
    "EMPREGANDO CONVERSOR ELETRÔNICO/INVERSOR",
    "MISTA",
    "OUTRA"
  ]).notNull(),
  classification: mysqlEnum("classification", [
    "AUTOCONSUMO LOCAL",
    "AUTOCONSUMO REMOTO",
    "GERAÇÃO COMPARTILHADA",
    "EMPREENDIMENTO DE MÚLTIPLAS UNIDADES CONSUMIDORAS"
  ]).notNull(),
  operationStartDate: timestamp("operationStartDate"), // Data de início da operação
  totalInstalledPower: int("totalInstalledPower").notNull(), // Potência instalada total (W)

  // Status do projeto
  status: mysqlEnum("status", ["RASCUNHO", "COMPLETO", "ENVIADO", "APROVADO"]).default("RASCUNHO").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Arranjos de módulos fotovoltaicos de um projeto
 */
export const projectModuleArrays = mysqlTable("projectModuleArrays", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // Projeto
  solarModuleId: int("solarModuleId").notNull(), // Módulo fotovoltaico
  quantity: int("quantity").notNull(), // Quantidade de módulos
  arrayNumber: int("arrayNumber").notNull(), // Número do arranjo (1, 2, 3...)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectModuleArray = typeof projectModuleArrays.$inferSelect;
export type InsertProjectModuleArray = typeof projectModuleArrays.$inferInsert;

/**
 * Inversores de um projeto
 */
export const projectInverters = mysqlTable("projectInverters", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // Projeto
  inverterId: int("inverterId").notNull(), // Inversor
  quantity: int("quantity").notNull(), // Quantidade de inversores
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectInverter = typeof projectInverters.$inferSelect;
export type InsertProjectInverter = typeof projectInverters.$inferInsert;

/**
 * Lista de rateio para autoconsumo remoto, geração compartilhada e EMUC
 */
export const projectRatioList = mysqlTable("projectRatioList", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // Projeto
  order: int("order").notNull(), // Ordem de prioridade
  accountContract: varchar("accountContract", { length: 50 }).notNull(), // Conta Contrato da UC participante
  consumptionClass: varchar("consumptionClass", { length: 100 }).notNull(), // Classe de consumo
  address: text("address").notNull(), // Endereço da UC participante
  percentageKwh: int("percentageKwh"), // Percentual do excedente (%)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectRatioList = typeof projectRatioList.$inferSelect;
export type InsertProjectRatioList = typeof projectRatioList.$inferInsert;

/**
 * Documentos gerados para cada projeto
 */
export const projectDocuments = mysqlTable("projectDocuments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // Projeto
  documentType: mysqlEnum("documentType", [
    "FORMULARIO_EXCEL",
    "MEMORIAL_WORD",
    "DIAGRAMA_UNIFILAR_PDF",
    "DIAGRAMA_BLOCOS"
  ]).notNull(),
  fileUrl: text("fileUrl").notNull(), // URL do arquivo no S3
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // Chave do arquivo no S3
  fileName: varchar("fileName", { length: 255 }).notNull(), // Nome do arquivo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectDocument = typeof projectDocuments.$inferSelect;
export type InsertProjectDocument = typeof projectDocuments.$inferInsert;
