import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { validateModuleInverterCompatibility, calculateOptimalStringSize } from "./validators/compatibility";
import { parseDatasheet } from "./parsers/datasheetParser";
import { parseEnergyBill } from "./parsers/energyBillParser";
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

    // ── Importar dados do cliente a partir da conta de energia ──
    parseEnergyBill: protectedProcedure
      .input(z.object({ fileBase64: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, 'base64');
        const data = await parseEnergyBill(buffer);
        return data;
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
              address: "Não Informado",
              consumptionClass: "Residencial",
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

        if (ratioList) {
          await db.deleteProjectRatioListByProjectId(input.id);
          let index = 1;
          for (const ratio of ratioList) {
            await db.createProjectRatioList({
              projectId: input.id,
              accountContract: ratio.targetUnit,
              percentageKwh: ratio.percentage,
              address: "Não Informado",
              consumptionClass: "Residencial",
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

        const projectModules = await db.getProjectModuleArraysByProjectId(project.id);
        const modulesData = await Promise.all(projectModules.map(async (pm) => {
          const module = await db.getSolarModuleById(pm.solarModuleId);
          return { ...pm, module };
        }));

        const projectInverters = await db.getProjectInvertersByProjectId(project.id);
        const invertersData = await Promise.all(projectInverters.map(async (pi) => {
          const inverter = await db.getInverterById(pi.inverterId);
          return { ...pi, inverter };
        }));

        const generatorData = {
          nome_cliente:   client.name,
          cpf_cnpj:       client.cpfCnpj,
          rg:             client.rg || '',
          endereco:       client.address,
          cep:            client.cep || '',
          cidade:         client.city,
          uf:             client.state,
          email:          client.email || '',
          celular:        client.phone || client.landline || '',
          conta_contrato:      project.accountContract || '',
          carga_declarada:     project.declaredLoad || '',
          disjuntor_entrada:   project.entryBreakerCurrent?.toString() || '',
          tipo_ramal:          project.branchType || '',
          numero_poste:        project.nearestPoleNumber || '',
          coordenada_x:        project.coordinateX || '',
          coordenada_y:        project.coordinateY || '',
          tensao_atendimento:  project.serviceVoltage?.toString() || '',
          tipo_ligacao:        project.connectionType || '',
          enquadramento:       project.classification || '',
          potencia_total_kw: (project.totalInstalledPower / 1000).toFixed(2),
          resp_tecnico_nome:     technicalResponsible.name,
          resp_tecnico_titulo:   technicalResponsible.title,
          resp_tecnico_registro: technicalResponsible.registrationNumber || '',
          resp_tecnico_email:    technicalResponsible.email || '',
          resp_tecnico_celular:  technicalResponsible.mobile || technicalResponsible.phone || '',
          resp_tecnico_endereco: technicalResponsible.address || '',
          resp_tecnico_bairro:   technicalResponsible.neighborhood || '',
          resp_tecnico_cidade:   technicalResponsible.city || '',
          resp_tecnico_uf:       technicalResponsible.state || '',
          resp_tecnico_cep:      technicalResponsible.cep || '',
          modules: modulesData.map(item => ({
            potencia:   item.module?.nominalPower || 0,
            qtd:        item.quantity,
            area:       item.module?.area ? parseFloat(item.module.area) : 0,
            fabricante: item.module?.manufacturer || '',
            modelo:     item.module?.model || '',
          })),
          inverters: invertersData.map(item => ({
            fabricante:            item.inverter?.manufacturer || '',
            modelo:                item.inverter?.model || '',
            potencia_nominal_kw:   item.inverter?.nominalPowerAC ? item.inverter.nominalPowerAC / 1000 : 0,
            tensao_ca_nominal:     item.inverter?.nominalVoltageAC || '',
            corrente_ca_max:       item.inverter?.maxCurrentAC || '',
            fator_potencia:        item.inverter?.powerFactor || '',
            eficiencia_max:        item.inverter?.maxEfficiency || '',
            thd:                   item.inverter?.thdCurrent || '',
            qtd:                   item.quantity,
          })),
        };

        console.log(`[Router] Gerando Excel para projeto ${project.id}...`);
        const result = await NativeGenerator.generateExcel(generatorData);

        if (!result.success || !result.filePath) {
          throw new Error(`Erro na geração do Excel: ${result.error}`);
        }

        const fileBuffer = await fs.readFile(result.filePath);
        return {
          filename: path.basename(result.filePath),
          data: fileBuffer.toString('base64'),
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

        const projectModules = await db.getProjectModuleArraysByProjectId(project.id);
        const modulesData = await Promise.all(projectModules.map(async (pm) => {
          const module = await db.getSolarModuleById(pm.solarModuleId);
          return { ...pm, module };
        }));

        const projectInverters = await db.getProjectInvertersByProjectId(project.id);
        const invertersData = await Promise.all(projectInverters.map(async (pi) => {
          const inverter = await db.getInverterById(pi.inverterId);
          return { ...pi, inverter };
        }));

        const generatorData = {
          nome_cliente:   client.name,
          cpf_cnpj:       client.cpfCnpj,
          rg:             client.rg || 'PENDENTE',
          endereco:       client.address,
          cep:            client.cep || '',
          cidade:         client.city,
          uf:             client.state,
          email:          client.email || '',
          celular:        client.phone || client.landline || '',
          conta_contrato:         project.accountContract || '',
          carga_declarada:        project.declaredLoad?.toString().replace('.', ',') || '0,00',
          disjuntor_entrada:      project.entryBreakerCurrent?.toString() || '',
          tipo_ramal:             project.branchType || '',
          numero_poste:           project.nearestPoleNumber || '',
          coordenada_x:           project.coordinateX || '',
          coordenada_y:           project.coordinateY || '',
          coordenadas:            project.coordinateX && project.coordinateY
            ? `${project.coordinateX}, ${project.coordinateY}`
            : '',
          tensao_atendimento:     project.serviceVoltage?.toString() || '220',
          tipo_ligacao:           project.connectionType || 'MONOFÁSICO',
          potencia_disponibilizada: project.availablePower?.toString().replace('.', ',') || '0,00',
          enquadramento:          project.classification || 'AUTOCONSUMO LOCAL',
          classe_uc:              client.consumptionClass || 'Residencial',
          potencia_total_kw: (project.totalInstalledPower / 1000).toFixed(2).replace('.', ','),
          resp_tecnico_nome:     technicalResponsible.name,
          resp_tecnico_titulo:   technicalResponsible.title,
          resp_tecnico_registro: technicalResponsible.registrationNumber,
          resp_tecnico_email:    technicalResponsible.email || '',
          resp_tecnico_celular:  technicalResponsible.mobile || technicalResponsible.phone || '',
          resp_tecnico_endereco: technicalResponsible.address || '',
          resp_tecnico_bairro:   technicalResponsible.neighborhood || '',
          resp_tecnico_cidade:   technicalResponsible.city || '',
          resp_tecnico_uf:       technicalResponsible.state || '',
          resp_tecnico_cep:      technicalResponsible.cep || '',
          data_extenso: new Date().toLocaleDateString('pt-BR', {
            month: 'long', year: 'numeric',
          }).toUpperCase(),
          modules: modulesData.map(item => ({
            potencia:    item.module?.nominalPower || 0,
            qtd:         item.quantity,
            area:        item.module?.area ? parseFloat(item.module.area).toFixed(2).replace('.', ',') : '0,00',
            area_fmt:    item.module?.area ? parseFloat(item.module.area).toFixed(2).replace('.', ',') : '0,00',
            fabricante:  item.module?.manufacturer || '',
            modelo:      item.module?.model || '',
            voc:         item.module?.voc || '',
            isc:         item.module?.isc || '',
            vmpp:        item.module?.vmpp || '',
            impp:        item.module?.impp || '',
            eficiencia:  item.module?.efficiency || '',
            comprimento: item.module?.length || '',
            largura:     item.module?.width || '',
            peso:        item.module?.weight || '',
          })),
          inverters: invertersData.map(item => ({
            fabricante:            item.inverter?.manufacturer || '',
            modelo:                item.inverter?.model || '',
            potencia_nominal_kw:   item.inverter?.nominalPowerAC || 0,
            potencia_nominal_kw_fmt: item.inverter?.nominalPowerAC
              ? (item.inverter.nominalPowerAC / 1000).toFixed(2).replace('.', ',')
              : '0,00',
            potencia_max_cc:       item.inverter?.maxPowerDC?.toString() || '',
            tensao_cc_max:         item.inverter?.maxVoltageDC || '',
            tensao_mppt_max:       item.inverter?.mpptVoltageMax || '',
            tensao_mppt_min:       item.inverter?.mpptVoltageMin || '',
            tensao_partida:        item.inverter?.startupVoltageDC || '',
            tensao_ca_nominal:     item.inverter?.nominalVoltageAC || '',
            corrente_cc_max:       item.inverter?.maxCurrentDC || '',
            corrente_ca_max:       item.inverter?.maxCurrentAC || '',
            num_mppt:              item.inverter?.numberOfMppt?.toString() || '',
            num_strings:           item.inverter?.numberOfStrings?.toString() || '',
            frequencia:            item.inverter?.nominalFrequency || '',
            eficiencia_max:        item.inverter?.maxEfficiency || '',
            eficiencia_eu:         item.inverter?.euEfficiency || '',
            fator_potencia:        item.inverter?.powerFactor || '',
            thd:                   item.inverter?.thdCurrent || '',
            tipo_conexao:          item.inverter?.connectionType || '',
            qtd:                   item.quantity,
          })),
        };

        console.log(`[Router] Gerando Word para projeto ${project.id}...`);
        const result = await NativeGenerator.generateWord(generatorData);

        if (!result.success || !result.filePath) {
          throw new Error(`Erro na geração do Word: ${result.error}`);
        }

        const fileBuffer = await fs.readFile(result.filePath);
        return {
          filename: path.basename(result.filePath),
          data: fileBuffer.toString('base64'),
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

        const projectModules = await db.getProjectModuleArraysByProjectId(project.id);
        const moduleArrays = await Promise.all(projectModules.map(async (pm, index) => {
          const module = await db.getSolarModuleById(pm.solarModuleId);
          if (!module) throw new Error(`Módulo não encontrado para o ID ${pm.solarModuleId}`);
          return { module, quantity: pm.quantity, arrayNumber: index + 1 };
        }));

        const projectInverters = await db.getProjectInvertersByProjectId(project.id);
        const inverters = await Promise.all(projectInverters.map(async (pi) => {
          const inverter = await db.getInverterById(pi.inverterId);
          if (!inverter) throw new Error(`Inversor não encontrado para o ID ${pi.inverterId}`);
          return { inverter, quantity: 1 };
        }));

        console.log(`[Router] Gerando Diagrama PDF para projeto ${project.id}...`);
        const pdfBuffer = await generatePDFDiagram({ project, client, technicalResponsible, moduleArrays, inverters });

        return {
          data: pdfBuffer.toString('base64'),
          filename: `Diagrama_Unifilar_${project.id}.pdf`,
        };
      }),
  }),

  // ==================== VALIDATION ====================
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

  // ==================== DATASHEET ====================
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
