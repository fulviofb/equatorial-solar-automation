import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { validateModuleInverterCompatibility, calculateOptimalStringSize } from "./validators/compatibility";
import { parseDatasheet } from "./parsers/datasheetParser";
import { z } from "zod";
import * as db from "./db";
import { promises as fs } from 'fs';
import path from 'path';
import { NativeGenerator } from "./lib/nativeGenerators";
import { generatePDFDiagram } from "./generators/pdfGenerator";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== CLIENTS ====================
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getClientsByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getClientById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        cpfCnpj: z.string(),
        rg: z.string().optional(),
        rgIssueDate: z.date().optional(),
        address: z.string(),
        cep: z.string().optional(),
        city: z.string(),
        state: z.string(),
        phone: z.string().optional(),
        landline: z.string().optional(),
        email: z.string().optional(),
        activityType: z.string().optional(),
        consumptionClass: z.enum([
          "Residencial",
          "Industrial",
          "Comércio, serviços e outras atividades",
          "Rural",
          "Poder Público",
          "Iluminação Pública",
          "Serviço Público"
        ]),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createClient({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          cpfCnpj: z.string().optional(),
          rg: z.string().optional(),
          rgIssueDate: z.date().optional(),
          address: z.string().optional(),
          cep: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          phone: z.string().optional(),
          landline: z.string().optional(),
          email: z.string().optional(),
          activityType: z.string().optional(),
          consumptionClass: z.enum([
            "Residencial",
            "Industrial",
            "Comércio, serviços e outras atividades",
            "Rural",
            "Poder Público",
            "Iluminação Pública",
            "Serviço Público"
          ]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateClient(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteClient(input.id);
        return { success: true };
      }),
  }),

  // ==================== TECHNICAL RESPONSIBLES ====================
  technicalResponsibles: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getTechnicalResponsiblesByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTechnicalResponsibleById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        title: z.string(),
        registrationNumber: z.string(),
        registrationState: z.string(),
        email: z.string(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        fax: z.string().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        cep: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createTechnicalResponsible({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          title: z.string().optional(),
          registrationNumber: z.string().optional(),
          registrationState: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          mobile: z.string().optional(),
          fax: z.string().optional(),
          address: z.string().optional(),
          neighborhood: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          cep: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateTechnicalResponsible(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTechnicalResponsible(input.id);
        return { success: true };
      }),
  }),

  // ==================== SOLAR MODULES ====================
  solarModules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getSolarModulesByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSolarModuleById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        manufacturer: z.string(),
        model: z.string(),
        nominalPower: z.number(),
        voc: z.string(),
        isc: z.string(),
        vmpp: z.string(),
        impp: z.string(),
        efficiency: z.string().optional(),
        length: z.string().optional(),
        width: z.string().optional(),
        area: z.string().optional(),
        weight: z.string().optional(),
        datasheetUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createSolarModule({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          manufacturer: z.string().optional(),
          model: z.string().optional(),
          nominalPower: z.number().optional(),
          voc: z.string().optional(),
          isc: z.string().optional(),
          vmpp: z.string().optional(),
          impp: z.string().optional(),
          efficiency: z.string().optional(),
          length: z.string().optional(),
          width: z.string().optional(),
          area: z.string().optional(),
          weight: z.string().optional(),
          datasheetUrl: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateSolarModule(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSolarModule(input.id);
        return { success: true };
      }),
  }),

  // ==================== INVERTERS ====================
  inverters: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getInvertersByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getInverterById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        manufacturer: z.string(),
        model: z.string(),
        nominalPowerAC: z.number(),
        nominalPowerDC: z.number().optional(),
        maxPowerDC: z.number().optional(),
        maxVoltageDC: z.string().optional(),
        maxCurrentDC: z.string().optional(),
        mpptVoltageMax: z.string().optional(),
        mpptVoltageMin: z.string().optional(),
        startupVoltageDC: z.string().optional(),
        numberOfMppt: z.number().optional(),
        numberOfStrings: z.number().optional(),
        maxCurrentPerInput: z.string().optional(),
        isMicroinverter: z.number().optional(),
        nominalVoltageAC: z.string().optional(),
        nominalFrequency: z.string().optional(),
        maxCurrentAC: z.string().optional(),
        powerFactor: z.string().optional(),
        thdCurrent: z.string().optional(),
        maxEfficiency: z.string().optional(),
        euEfficiency: z.string().optional(),
        mpptEfficiency: z.string().optional(),
        connectionType: z.string().optional(),
        certificationNumber: z.string().optional(),
        datasheetUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createInverter({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          manufacturer: z.string().optional(),
          model: z.string().optional(),
          nominalPowerAC: z.number().optional(),
          nominalPowerDC: z.number().optional(),
          maxPowerDC: z.number().optional(),
          maxVoltageDC: z.string().optional(),
          maxCurrentDC: z.string().optional(),
          mpptVoltageMax: z.string().optional(),
          mpptVoltageMin: z.string().optional(),
          startupVoltageDC: z.string().optional(),
          numberOfMppt: z.number().optional(),
          numberOfStrings: z.number().optional(),
          maxCurrentPerInput: z.string().optional(),
          isMicroinverter: z.number().optional(),
          nominalVoltageAC: z.string().optional(),
          nominalFrequency: z.string().optional(),
          maxCurrentAC: z.string().optional(),
          powerFactor: z.string().optional(),
          thdCurrent: z.string().optional(),
          maxEfficiency: z.string().optional(),
          euEfficiency: z.string().optional(),
          mpptEfficiency: z.string().optional(),
          connectionType: z.string().optional(),
          certificationNumber: z.string().optional(),
          datasheetUrl: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateInverter(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInverter(input.id);
        return { success: true };
      }),
  }),

  // ==================== PROJECTS ====================
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProjectsByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const project = await db.getProjectById(input.id);
        if (!project) return undefined;

        const moduleArrays = await db.getProjectModuleArraysByProjectId(input.id);
        const inverters = await db.getProjectInvertersByProjectId(input.id);
        const ratioList = await db.getProjectRatioListByProjectId(input.id);

        return {
          ...project,
          moduleArrays,
          inverters,
          ratioList,
        };
      }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        technicalResponsibleId: z.number(),
        accountContract: z.string().optional(),
        connectionType: z.enum(["MONOFÁSICO", "BIFÁSICO", "TRIFÁSICO"]),
        serviceVoltage: z.number(),
        entryBreakerCurrent: z.number(),
        availablePower: z.number(),
        declaredLoad: z.string().optional(),
        branchType: z.enum(["AÉREO", "SUBTERRÂNEO"]),
        nearestPoleNumber: z.string().optional(),
        coordinateX: z.string().optional(),
        coordinateY: z.string().optional(),
        hasSpecialLoads: z.boolean().optional(),
        specialLoadsDetail: z.string().optional(),
        requestType: z.enum([
          "LIGAÇÃO NOVA DE UNIDADE CONSUMIDORA COM GERAÇÃO DISTRIBUÍDA",
          "CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE SEM AUMENTO DE POTÊNCIA DISPONIBILIZADA",
          "CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE COM AUMENTO DE POTÊNCIA DISPONIBILIZADA",
          "AUMENTO DA POTÊNCIA DE GERAÇÃO EM UC COM GD EXISTENTE SEM AUMENTO DE POTÊNCIA DISPONIBILIZADA",
          "AUMENTO DA POTÊNCIA DE GERAÇÃO EM UC COM GD EXISTENTE COM AUMENTO DE POTÊNCIA DISPONIBILIZADA"
        ]),
        primarySourceType: z.enum([
          "SOLAR FOTOVOLTAICA",
          "EÓLICA",
          "HIDRÁULICA",
          "BIOMASSA",
          "COGERAÇÃO QUALIFICADA",
          "HÍBRIDO",
          "OUTRAS"
        ]),
        generationType: z.enum([
          "EMPREGANDO MÁQUINA SÍNCRONA SEM CONVERSOR",
          "EMPREGANDO CONVERSOR ELETRÔNICO/INVERSOR",
          "MISTA",
          "OUTRA"
        ]),
        classification: z.enum([
          "AUTOCONSUMO LOCAL",
          "AUTOCONSUMO REMOTO",
          "GERAÇÃO COMPARTILHADA",
          "EMPREENDIMENTO DE MÚLTIPLAS UNIDADES CONSUMIDORAS"
        ]),
        operationStartDate: z.date().optional(),
        totalInstalledPower: z.number(),
        status: z.enum(["RASCUNHO", "COMPLETO", "ENVIADO", "APROVADO"]).optional(),
        moduleArrays: z.array(z.object({ moduleId: z.number(), quantity: z.number() })).optional(),
        inverters: z.array(z.object({ inverterId: z.number(), quantity: z.number() })).optional(),
        ratioList: z.array(z.object({ targetUnit: z.string(), percentage: z.number() })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { moduleArrays, inverters, ratioList, ...projectData } = input;

        const project = await db.createProject({
          ...projectData,
          userId: ctx.user.id,
        });

        if (moduleArrays) {
          for (const ma of moduleArrays) {
            await db.createProjectModuleArray({
              projectId: project.id,
              solarModuleId: ma.moduleId,
              quantity: ma.quantity,
              arrayNumber: 1,
            });
          }
        }

        if (inverters) {
          for (const inv of inverters) {
            await db.createProjectInverter({
              projectId: project.id,
              inverterId: inv.inverterId,
              quantity: inv.quantity,
            });
          }
        }

        if (ratioList) {
          let index = 1;
          for (const ratio of ratioList) {
            await db.createProjectRatioList({
              projectId: project.id,
              accountContract: ratio.targetUnit,
              percentageKwh: ratio.percentage,
              address: "Não Informado", // Default
              consumptionClass: "Residencial", // Default
              order: index++,
            });
          }
        }

        return project;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          clientId: z.number().optional(),
          technicalResponsibleId: z.number().optional(),
          accountContract: z.string().optional(),
          connectionType: z.enum(["MONOFÁSICO", "BIFÁSICO", "TRIFÁSICO"]).optional(),
          serviceVoltage: z.number().optional(),
          entryBreakerCurrent: z.number().optional(),
          availablePower: z.number().optional(),
          declaredLoad: z.string().optional(),
          branchType: z.enum(["AÉREO", "SUBTERRÂNEO"]).optional(),
          nearestPoleNumber: z.string().optional(),
          coordinateX: z.string().optional(),
          coordinateY: z.string().optional(),
          hasSpecialLoads: z.boolean().optional(),
          specialLoadsDetail: z.string().optional(),
          requestType: z.enum([
            "LIGAÇÃO NOVA DE UNIDADE CONSUMIDORA COM GERAÇÃO DISTRIBUÍDA",
            "CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE SEM AUMENTO DE POTÊNCIA DISPONIBILIZADA",
            "CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE COM AUMENTO DE POTÊNCIA DISPONIBILIZADA",
            "AUMENTO DA POTÊNCIA DE GERAÇÃO EM UC COM GD EXISTENTE SEM AUMENTO DE POTÊNCIA DISPONIBILIZADA",
            "AUMENTO DA POTÊNCIA DE GERAÇÃO EM UC COM GD EXISTENTE COM AUMENTO DE POTÊNCIA DISPONIBILIZADA"
          ]).optional(),
          primarySourceType: z.enum([
            "SOLAR FOTOVOLTAICA",
            "EÓLICA",
            "HIDRÁULICA",
            "BIOMASSA",
            "COGERAÇÃO QUALIFICADA",
            "HÍBRIDO",
            "OUTRAS"
          ]).optional(),
          generationType: z.enum([
            "EMPREGANDO MÁQUINA SÍNCRONA SEM CONVERSOR",
            "EMPREGANDO CONVERSOR ELETRÔNICO/INVERSOR",
            "MISTA",
            "OUTRA"
          ]).optional(),
          classification: z.enum([
            "AUTOCONSUMO LOCAL",
            "AUTOCONSUMO REMOTO",
            "GERAÇÃO COMPARTILHADA",
            "EMPREENDIMENTO DE MÚLTIPLAS UNIDADES CONSUMIDORAS"
          ]).optional(),
          operationStartDate: z.date().optional(),
          totalInstalledPower: z.number().optional(),
          status: z.enum(["RASCUNHO", "COMPLETO", "ENVIADO", "APROVADO"]).optional(),
          moduleArrays: z.array(z.object({ moduleId: z.number(), quantity: z.number() })).optional(),
          inverters: z.array(z.object({ inverterId: z.number(), quantity: z.number() })).optional(),
          ratioList: z.array(z.object({ targetUnit: z.string(), percentage: z.number() })).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { moduleArrays, inverters, ratioList, ...projectData } = input.data;

        await db.updateProject(input.id, projectData);

        // Update Module Arrays (Full Replacement)
        if (moduleArrays) {
          await db.deleteProjectModuleArraysByProjectId(input.id);
          for (const ma of moduleArrays) {
            await db.createProjectModuleArray({
              projectId: input.id,
              solarModuleId: ma.moduleId,
              quantity: ma.quantity,
              arrayNumber: 1,
            });
          }
        }

        // Update Inverters (Full Replacement)
        if (inverters) {
          await db.deleteProjectInvertersByProjectId(input.id);
          for (const inv of inverters) {
            await db.createProjectInverter({
              projectId: input.id,
              inverterId: inv.inverterId,
              quantity: inv.quantity,
            });
          }
        }

        // Update Ratio List (Full Replacement)
        if (ratioList) {
          await db.deleteProjectRatioListByProjectId(input.id);
          let index = 1;
          for (const ratio of ratioList) {
            await db.createProjectRatioList({
              projectId: input.id,
              accountContract: ratio.targetUnit,
              percentageKwh: ratio.percentage,
              address: "Não Informado", // Default
              consumptionClass: "Residencial", // Default
              order: index++,
            });
          }
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ==================== DOCUMENTS ====================
  documents: router({
    generateExcel: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");

        const client = await db.getClientById(project.clientId);
        if (!client) throw new Error("Client not found");

        const technicalResponsible = await db.getTechnicalResponsibleById(project.technicalResponsibleId);
        if (!technicalResponsible) throw new Error("RT not found");

        // Buscar módulos
        const projectModules = await db.getProjectModuleArraysByProjectId(project.id);
        const modulesData = await Promise.all(projectModules.map(async (pm) => {
          const module = await db.getSolarModuleById(pm.solarModuleId);
          return {
            ...pm,
            module
          };
        }));

        // Buscar inversores
        const projectInverters = await db.getProjectInvertersByProjectId(project.id);
        const invertersData = await Promise.all(projectInverters.map(async (pi) => {
          const inverter = await db.getInverterById(pi.inverterId);
          return {
            ...pi,
            inverter
          };
        }));

        // Formatar para Generator
        const generatorData = {
          nome_cliente: client.name,
          endereco: client.address,
          cidade: client.city,
          uf: client.state,
          cep: client.cep || "",
          rg: client.rg || "",
          rg_data_emissao: "", // Precisa adicionar no DB se quiser
          cpf_cnpj: client.cpfCnpj,
          carga_declarada: "10", // Default ou do projeto
          unidade_potencia: "kW",
          potencia_total_kw: (project.totalInstalledPower / 1000).toFixed(2),
          resp_tecnico_nome: technicalResponsible.name,
          resp_tecnico_titulo: technicalResponsible.title,
          resp_tecnico_registro: technicalResponsible.registrationNumber || "",
          modules: modulesData.map(item => ({
            potencia: item.module?.nominalPower || 0,
            qtd: item.quantity,
            area: item.module?.area ? parseFloat(item.module.area) : 0,
            fabricante: item.module?.manufacturer || "",
            modelo: item.module?.model || ""
          })),
          inverters: invertersData.map(item => ({
            fabricante: item.inverter?.manufacturer || "",
            modelo: item.inverter?.model || "",
            potencia_nominal_kw: item.inverter?.nominalPowerAC ? (item.inverter.nominalPowerAC / 1000) : 0,
            qtd: item.quantity
          }))
        };

        console.log(`[Router] Gerando Excel NATIVO para projeto ${project.id}...`);
        const result = await NativeGenerator.generateExcel(generatorData);

        if (!result.success || !result.filePath) {
          throw new Error(`Erro na automação Excel: ${result.error}`);
        }

        const fileBuffer = await fs.readFile(result.filePath);
        return {
          filename: path.basename(result.filePath),
          data: fileBuffer.toString('base64')
        };
      }),

    generateWord: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");

        const client = await db.getClientById(project.clientId);
        if (!client) throw new Error("Client not found");

        const technicalResponsible = await db.getTechnicalResponsibleById(project.technicalResponsibleId);
        if (!technicalResponsible) throw new Error("RT not found");

        // Buscar módulos
        const projectModules = await db.getProjectModuleArraysByProjectId(project.id);
        const modulesData = await Promise.all(projectModules.map(async (pm) => {
          const module = await db.getSolarModuleById(pm.solarModuleId);
          return {
            ...pm,
            module
          };
        }));

        // Buscar Inversores
        const projectInverters = await db.getProjectInvertersByProjectId(project.id);
        const invertersData = await Promise.all(projectInverters.map(async (pi) => {
          const inverter = await db.getInverterById(pi.inverterId);
          return {
            ...pi,
            inverter
          };
        }));

        const generatorData = {
          nome_cliente: client.name,
          endereco: client.address,
          cidade: client.city,
          uf: client.state,
          rg: client.rg || "PENDENTE",
          cpf_cnpj: client.cpfCnpj,
          potencia_total_kw: (project.totalInstalledPower / 1000).toFixed(2).replace('.', ','),
          resp_tecnico_nome: technicalResponsible.name,
          resp_tecnico_titulo: technicalResponsible.title,
          resp_tecnico_registro: technicalResponsible.registrationNumber,
          data_extenso: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase(),
          enquadramento: project.classification || "AUTOCONSUMO LOCAL", // Mapeamento
          tensao_atendimento: project.serviceVoltage?.toString() || "220",
          tipo_ligacao: project.connectionType || "MONOFÁSICO",
          potencia_disponibilizada: project.availablePower?.toString().replace('.', ',') || "0,00",
          carga_declarada: project.declaredLoad?.toString().replace('.', ',') || "0,00",
          modules: modulesData.map(item => ({
            potencia: item.module?.nominalPower || 0,
            qtd: item.quantity,
            area: item.module?.area ? parseFloat(item.module.area).toFixed(2).replace('.', ',') : "0,00",
            fabricante: item.module?.manufacturer || "",
            modelo: item.module?.model || ""
          })),
          inverters: invertersData.map(item => ({
            fabricante: item.inverter?.manufacturer || "",
            modelo: item.inverter?.model || "",
            potencia_nominal_kw: item.inverter?.nominalPowerAC || 0,
            qtd: 1
          }))
        };

        console.log(`[Router] Gerando Word NATIVO para projeto ${project.id}...`);
        const result = await NativeGenerator.generateWord(generatorData);

        if (!result.success || !result.filePath) {
          throw new Error(`Erro na automação Word: ${result.error}`);
        }

        const fileBuffer = await fs.readFile(result.filePath);
        return {
          filename: path.basename(result.filePath),
          data: fileBuffer.toString('base64')
        };
      }),

    generatePDF: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) throw new Error("Projeto não encontrado");

        const client = await db.getClientById(project.clientId);
        if (!client) throw new Error("Dados incompletos do projeto: Cliente não encontrado");

        const technicalResponsible = await db.getTechnicalResponsibleById(project.technicalResponsibleId);
        if (!technicalResponsible) throw new Error("Dados incompletos do projeto: Responsável Técnico não encontrado");

        // Buscar dados de Inversores e Módulos para preencher o diagrama
        const projectModules = await db.getProjectModuleArraysByProjectId(project.id);
        const moduleArrays = await Promise.all(projectModules.map(async (pm, index) => {
          const module = await db.getSolarModuleById(pm.solarModuleId);
          if (!module) throw new Error(`Módulo não encontrado para o ID ${pm.solarModuleId}`);
          return {
            module,
            quantity: pm.quantity,
            arrayNumber: index + 1
          };
        }));

        const projectInverters = await db.getProjectInvertersByProjectId(project.id);
        const inverters = await Promise.all(projectInverters.map(async (pi) => {
          const inverter = await db.getInverterById(pi.inverterId);
          if (!inverter) throw new Error(`Inversor não encontrado para o ID ${pi.inverterId}`);
          return {
            inverter,
            quantity: 1 // Assumindo 1 por item na tabela de relação, ou ajustar se houver campo quantidade
          };
        }));

        console.log(`[Router] Gerando Diagrama PDF NATIVO para projeto ${project.id}...`);

        // Dados Typed para o gerador
        const projectData = {
          project,
          client,
          technicalResponsible,
          moduleArrays,
          inverters
        };

        const pdfBuffer = await generatePDFDiagram(projectData);

        return {
          data: pdfBuffer.toString('base64'),
          filename: `Diagrama_Unifilar_${project.id}.pdf`,
        };
      }),
  }),

  // Validation router
  validation: router({
    checkCompatibility: protectedProcedure
      .input(z.object({
        modules: z.array(z.object({
          voc: z.string(),
          isc: z.string(),
          vmpp: z.string(),
          impp: z.string(),
          nominalPower: z.number(),
        })),
        modulesPerString: z.number(),
        numberOfStrings: z.number(),
        inverter: z.object({
          maxVoltageDC: z.string().optional(),
          maxCurrentDC: z.string().optional(),
          mpptVoltageMax: z.string().optional(),
          mpptVoltageMin: z.string().optional(),
          startupVoltageDC: z.string().optional(),
          nominalPowerDC: z.number().optional(),
          maxPowerDC: z.number().optional(),
          nominalPowerAC: z.number(),
          numberOfMppt: z.number().optional(),
          numberOfStrings: z.number().optional(),
          isMicroinverter: z.boolean().optional(),
          maxCurrentPerInput: z.string().optional(),
        }),
        invertersQuantity: z.number().optional().default(1),
      }))
      .mutation(({ input }) => {
        console.log('[BACKEND DEBUG] Dados recebidos:', JSON.stringify(input, null, 2));
        console.log('[BACKEND DEBUG] isMicroinverter:', input.inverter.isMicroinverter);
        console.log('[BACKEND DEBUG] maxCurrentPerInput:', input.inverter.maxCurrentPerInput);

        const issues = validateModuleInverterCompatibility(
          input.modules,
          input.modulesPerString,
          input.numberOfStrings,
          input.inverter,
          input.invertersQuantity
        );
        return { issues };
      }),

    calculateStringSize: protectedProcedure
      .input(z.object({
        module: z.object({
          voc: z.string(),
          isc: z.string(),
          vmpp: z.string(),
          impp: z.string(),
          nominalPower: z.number(),
        }),
        inverter: z.object({
          maxVoltageDC: z.string().optional(),
          maxCurrentDC: z.string().optional(),
          mpptVoltageMax: z.string().optional(),
          mpptVoltageMin: z.string().optional(),
          startupVoltageDC: z.string().optional(),
          nominalPowerDC: z.number().optional(),
          maxPowerDC: z.number().optional(),
          nominalPowerAC: z.number(),
          numberOfMppt: z.number().optional(),
          numberOfStrings: z.number().optional(),
          isMicroinverter: z.boolean().optional(),
          maxCurrentPerInput: z.string().optional(),
        }),
      }))
      .query(({ input }) => {
        return calculateOptimalStringSize(input.module, input.inverter);
      }),
  }),

  // Datasheet parser router
  datasheet: router({
    parse: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, 'base64');
        const result = await parseDatasheet(buffer);
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
