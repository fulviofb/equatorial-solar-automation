import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser,
  users,
  clients,
  InsertClient,
  Client,
  technicalResponsibles,
  InsertTechnicalResponsible,
  TechnicalResponsible,
  solarModules,
  InsertSolarModule,
  SolarModule,
  inverters,
  InsertInverter,
  Inverter,
  projects,
  InsertProject,
  Project,
  projectModuleArrays,
  InsertProjectModuleArray,
  ProjectModuleArray,
  projectInverters,
  InsertProjectInverter,
  ProjectInverter,
  projectRatioList,
  InsertProjectRatioList,
  ProjectRatioList,
  projectDocuments,
  InsertProjectDocument,
  ProjectDocument
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true,
        },
      });
      _db = drizzle(_pool) as unknown as ReturnType<typeof drizzle>;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== CLIENTS ====================

export async function createClient(client: InsertClient): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(client);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(clients).where(eq(clients.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getClientsByUserId(userId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function updateClient(id: number, data: Partial<InsertClient>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(clients).where(eq(clients.id, id));
}

// ==================== TECHNICAL RESPONSIBLES ====================

export async function createTechnicalResponsible(data: InsertTechnicalResponsible): Promise<TechnicalResponsible> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(technicalResponsibles).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(technicalResponsibles).where(eq(technicalResponsibles.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getTechnicalResponsiblesByUserId(userId: number): Promise<TechnicalResponsible[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(technicalResponsibles).where(eq(technicalResponsibles.userId, userId)).orderBy(desc(technicalResponsibles.createdAt));
}

export async function getTechnicalResponsibleById(id: number): Promise<TechnicalResponsible | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(technicalResponsibles).where(eq(technicalResponsibles.id, id)).limit(1);
  return result[0];
}

export async function updateTechnicalResponsible(id: number, data: Partial<InsertTechnicalResponsible>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(technicalResponsibles).set(data).where(eq(technicalResponsibles.id, id));
}

export async function deleteTechnicalResponsible(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(technicalResponsibles).where(eq(technicalResponsibles.id, id));
}

// ==================== SOLAR MODULES ====================

export async function createSolarModule(data: InsertSolarModule): Promise<SolarModule> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(solarModules).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(solarModules).where(eq(solarModules.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getSolarModulesByUserId(userId: number): Promise<SolarModule[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(solarModules).where(eq(solarModules.userId, userId)).orderBy(desc(solarModules.createdAt));
}

export async function getSolarModuleById(id: number): Promise<SolarModule | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(solarModules).where(eq(solarModules.id, id)).limit(1);
  return result[0];
}

export async function updateSolarModule(id: number, data: Partial<InsertSolarModule>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(solarModules).set(data).where(eq(solarModules.id, id));
}

export async function deleteSolarModule(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(solarModules).where(eq(solarModules.id, id));
}

// ==================== INVERTERS ====================

export async function createInverter(data: InsertInverter): Promise<Inverter> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(inverters).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(inverters).where(eq(inverters.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getInvertersByUserId(userId: number): Promise<Inverter[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(inverters).where(eq(inverters.userId, userId)).orderBy(desc(inverters.createdAt));
}

export async function getInverterById(id: number): Promise<Inverter | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(inverters).where(eq(inverters.id, id)).limit(1);
  return result[0];
}

export async function updateInverter(id: number, data: Partial<InsertInverter>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(inverters).set(data).where(eq(inverters.id, id));
}

export async function deleteInverter(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(inverters).where(eq(inverters.id, id));
}

// ==================== PROJECTS ====================

export async function createProject(data: InsertProject): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(projects).where(eq(projects.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getProjectsByUserId(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function updateProject(id: number, data: Partial<InsertProject>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projects).where(eq(projects.id, id));
}

// ==================== PROJECT MODULE ARRAYS ====================

export async function createProjectModuleArray(data: InsertProjectModuleArray): Promise<ProjectModuleArray> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectModuleArrays).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(projectModuleArrays).where(eq(projectModuleArrays.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getProjectModuleArraysByProjectId(projectId: number): Promise<ProjectModuleArray[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projectModuleArrays).where(eq(projectModuleArrays.projectId, projectId));
}

export async function deleteProjectModuleArray(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projectModuleArrays).where(eq(projectModuleArrays.id, id));
}

export async function deleteProjectModuleArraysByProjectId(projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projectModuleArrays).where(eq(projectModuleArrays.projectId, projectId));
}

// ==================== PROJECT INVERTERS ====================

export async function createProjectInverter(data: InsertProjectInverter): Promise<ProjectInverter> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectInverters).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(projectInverters).where(eq(projectInverters.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getProjectInvertersByProjectId(projectId: number): Promise<ProjectInverter[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projectInverters).where(eq(projectInverters.projectId, projectId));
}

export async function deleteProjectInverter(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projectInverters).where(eq(projectInverters.id, id));
}

export async function deleteProjectInvertersByProjectId(projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projectInverters).where(eq(projectInverters.projectId, projectId));
}

// ==================== PROJECT RATIO LIST ====================

export async function createProjectRatioList(data: InsertProjectRatioList): Promise<ProjectRatioList> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectRatioList).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(projectRatioList).where(eq(projectRatioList.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getProjectRatioListByProjectId(projectId: number): Promise<ProjectRatioList[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projectRatioList).where(eq(projectRatioList.projectId, projectId));
}

export async function deleteProjectRatioList(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projectRatioList).where(eq(projectRatioList.id, id));
}

export async function deleteProjectRatioListByProjectId(projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projectRatioList).where(eq(projectRatioList.projectId, projectId));
}

// ==================== PROJECT DOCUMENTS ====================

export async function createProjectDocument(data: InsertProjectDocument): Promise<ProjectDocument> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectDocuments).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(projectDocuments).where(eq(projectDocuments.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getProjectDocumentsByProjectId(projectId: number): Promise<ProjectDocument[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projectDocuments).where(eq(projectDocuments.projectId, projectId)).orderBy(desc(projectDocuments.createdAt));
}

export async function deleteProjectDocument(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projectDocuments).where(eq(projectDocuments.id, id));
}
