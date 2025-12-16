import { int, mysqlTable } from "drizzle-orm/mysql-core";
import { projects } from "./schema";
import { solarModules } from "./schema";
import { inverters } from "./schema";

/**
 * Tabela de relacionamento entre projetos e módulos fotovoltaicos
 * Permite múltiplos arranjos de módulos por projeto
 */
export const projectModules = mysqlTable("project_modules", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  moduleId: int("moduleId").notNull(),
  quantity: int("quantity").notNull(),
  arrayNumber: int("arrayNumber").notNull(), // Número do arranjo (1, 2, 3...)
});

/**
 * Tabela de relacionamento entre projetos e inversores
 * Permite múltiplos inversores por projeto
 */
export const projectInverters = mysqlTable("project_inverters", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  inverterId: int("inverterId").notNull(),
  quantity: int("quantity").notNull(),
});

export type ProjectModule = typeof projectModules.$inferSelect;
export type InsertProjectModule = typeof projectModules.$inferInsert;

export type ProjectInverter = typeof projectInverters.$inferSelect;
export type InsertProjectInverter = typeof projectInverters.$inferInsert;
