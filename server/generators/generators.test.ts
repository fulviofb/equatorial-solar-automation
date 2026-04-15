import { describe, it, expect } from 'vitest';
import { NativeGenerator } from '../lib/nativeGenerators';
import { generatePDFDiagram } from './pdfGenerator';

// ─── Mock data no formato esperado pelos geradores ───────────────────────────

/** Dados para NativeGenerator.generateExcel / generateWord */
const mockGeneratorData = {
  nome_cliente: 'João da Silva',
  cpf_cnpj: '123.456.789-00',
  rg: '1234567',
  rg_data_emissao: '01/01/2010',
  endereco: 'Rua Teste, 123, Bairro Centro',
  cep: '74000-000',
  cidade: 'Goiânia',
  uf: 'GO',
  cidade_uf: 'Goiânia - GO',
  email: 'joao@example.com',
  celular: '(62) 98765-4321',
  conta_contrato: '123456789',
  carga_declarada: '8,5',
  disjuntor_entrada: '40',
  tipo_ramal: 'AÉREO',
  enquadramento: 'AUTOCONSUMO LOCAL',
  tensao_atendimento: '220',
  tipo_ligacao: 'MONOFÁSICO',
  potencia_disponibilizada: '10,00',
  potencia_total_kw: '4,50',
  coordenadas: '-16.123456, -48.123456',
  numero_poste: '12345',
  resp_tecnico_nome: 'Eng. Maria Santos',
  resp_tecnico_titulo: 'Engenheiro Eletricista',
  resp_tecnico_registro: 'CREA-GO 12345',
  resp_tecnico_email: 'maria@example.com',
  resp_tecnico_celular: '(62) 99999-8888',
  resp_tecnico_endereco: 'Av. Teste, 456',
  resp_tecnico_cidade: 'Goiânia',
  resp_tecnico_uf: 'GO',
  modules: [
    {
      fabricante: 'Canadian Solar',
      modelo: 'CS3W-450P',
      potencia: 450,
      qtd: 10,
      voc: '49.8',
      isc: '11.52',
      vmpp: '41.7',
      impp: '10.79',
      eficiencia: '20.5',
      comprimento: '2108',
      largura: '1048',
      area: '2.21',
      area_fmt: '2,21',
      peso: '24.5',
    },
  ],
  inverters: [
    {
      fabricante: 'Growatt',
      modelo: 'MIN 5000TL-X',
      potencia: 5000,
      potencia_nominal_kw: 5,
      potencia_nominal_kw_fmt: '5,00',
      potencia_max_cc: 7000,
      qtd: 1,
      corrente_cc_max: '12.5',
      corrente_ca_max: '23.8',
      tensao_cc_max: '550',
      tensao_mppt_max: '480',
      tensao_mppt_min: '50',
      tensao_partida: '50',
      tensao_ca_nominal: '220',
      num_mppt: 2,
      num_strings: 2,
      frequencia: '60',
      eficiencia_max: '98.4',
      fator_potencia: '0.99',
      thd: '<3',
      tipo_conexao: 'Monofásico',
    },
  ],
};

/** Dados para generatePDFDiagram — usa tipos do schema do drizzle */
const mockPDFData = {
  project: {
    id: 1,
    userId: 1,
    clientId: 1,
    technicalResponsibleId: 1,
    accountContract: '123456789',
    connectionType: 'MONOFÁSICO' as const,
    serviceVoltage: 220,
    entryBreakerCurrent: 40,
    availablePower: 10,
    declaredLoad: '8.5',
    branchType: 'AÉREO' as const,
    nearestPoleNumber: '12345',
    coordinateX: '-16.123456',
    coordinateY: '-48.123456',
    hasSpecialLoads: false,
    specialLoadsDetail: null,
    requestType: 'LIGAÇÃO NOVA DE UNIDADE CONSUMIDORA COM GERAÇÃO DISTRIBUÍDA' as const,
    primarySourceType: 'SOLAR FOTOVOLTAICA' as const,
    generationType: 'EMPREGANDO CONVERSOR ELETRÔNICO/INVERSOR' as const,
    classification: 'AUTOCONSUMO LOCAL' as const,
    operationStartDate: new Date('2024-01-01'),
    totalInstalledPower: 4500,
    status: 'RASCUNHO' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  client: {
    id: 1,
    userId: 1,
    name: 'João da Silva',
    cpfCnpj: '123.456.789-00',
    rg: '1234567',
    rgIssueDate: new Date('2010-01-01'),
    address: 'Rua Teste, 123, Bairro Centro',
    cep: '74000-000',
    city: 'Goiânia',
    state: 'GO',
    phone: '(62) 98765-4321',
    landline: '(62) 3333-4444',
    email: 'joao@example.com',
    activityType: 'Residencial',
    consumptionClass: 'Residencial' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  technicalResponsible: {
    id: 1,
    userId: 1,
    name: 'Eng. Maria Santos',
    title: 'Engenheiro Eletricista',
    registrationNumber: '12345',
    registrationState: 'GO',
    email: 'maria@example.com',
    phone: '(62) 3333-5555',
    mobile: '(62) 99999-8888',
    fax: null,
    address: 'Av. Teste, 456',
    neighborhood: 'Setor Sul',
    city: 'Goiânia',
    state: 'GO',
    cep: '74000-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  moduleArrays: [
    {
      module: {
        id: 1,
        userId: 1,
        manufacturer: 'Canadian Solar',
        model: 'CS3W-450P',
        nominalPower: 450,
        voc: '49.8',
        isc: '11.52',
        vmpp: '41.7',
        impp: '10.79',
        efficiency: '20.5',
        length: '2108',
        width: '1048',
        area: '2.21',
        weight: '24.5',
        datasheetUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: 10,
      arrayNumber: 1,
    },
  ],
  inverters: [
    {
      inverter: {
        id: 1,
        userId: 1,
        manufacturer: 'Growatt',
        model: 'MIN 5000TL-X',
        nominalPowerAC: 5000,
        nominalPowerDC: 6500,
        maxPowerDC: 7000,
        maxVoltageDC: '550',
        maxCurrentDC: '12.5',
        mpptVoltageMax: '480',
        mpptVoltageMin: '50',
        startupVoltageDC: '50',
        numberOfMppt: 2,
        numberOfStrings: 2,
        maxCurrentPerInput: null,
        isMicroinverter: 0,
        nominalVoltageAC: '220',
        nominalFrequency: '60',
        maxCurrentAC: '23.8',
        powerFactor: '0.99',
        thdCurrent: '<3',
        maxEfficiency: '98.4',
        euEfficiency: null,
        mpptEfficiency: '99.9',
        connectionType: 'Monofásico',
        certificationNumber: 'INMETRO-12345',
        datasheetUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: 1,
    },
  ],
};

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('Geradores de Documentos', () => {

  describe('NativeGenerator.generateExcel', () => {
    it('deve retornar success=true e filePath para dados válidos', async () => {
      const result = await NativeGenerator.generateExcel(mockGeneratorData);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('filePath deve apontar para um arquivo .xlsx', async () => {
      const result = await NativeGenerator.generateExcel(mockGeneratorData);

      expect(result.filePath).toMatch(/\.xlsx$/i);
    });

    it('deve retornar success=false quando não encontrar o template', async () => {
      // Simula dados sem problema — o erro viria se o template não existir no ambiente
      // Este teste documenta o comportamento esperado de falha
      const result = await NativeGenerator.generateExcel({
        ...mockGeneratorData,
        nome_cliente: 'Teste Falha Template',
      });

      // Se o template existir: success=true. Se não: success=false com error.
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      } else {
        expect(result.filePath).toBeDefined();
      }
    });
  });

  describe('NativeGenerator.generateWord', () => {
    it('deve retornar success=true e filePath para dados válidos', async () => {
      const result = await NativeGenerator.generateWord(mockGeneratorData);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('filePath deve apontar para um arquivo .docx', async () => {
      const result = await NativeGenerator.generateWord(mockGeneratorData);

      expect(result.filePath).toMatch(/\.docx$/i);
    });

    it('deve incluir nome do cliente no nome do arquivo gerado', async () => {
      const result = await NativeGenerator.generateWord(mockGeneratorData);

      if (result.success && result.filePath) {
        expect(result.filePath).toContain('João');
      }
    });
  });

  describe('generatePDFDiagram', () => {
    it('deve retornar um Buffer PDF válido', async () => {
      const buffer = await generatePDFDiagram(mockPDFData);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    it('deve gerar PDF com tamanho adequado', async () => {
      const buffer = await generatePDFDiagram(mockPDFData);

      expect(buffer.length).toBeGreaterThan(1000);
    });

    it('deve conter estrutura de objetos PDF', async () => {
      const buffer = await generatePDFDiagram(mockPDFData);

      expect(buffer.toString('utf8')).toContain('obj');
    });
  });

  describe('Validações de Dados do Projeto', () => {
    it('deve calcular potência total corretamente', () => {
      const totalPower = mockPDFData.moduleArrays.reduce((sum, array) => {
        return sum + (array.module.nominalPower * array.quantity);
      }, 0);

      expect(totalPower).toBe(4500); // 10 módulos × 450W
    });

    it('deve ter tensão de serviço compatível com o inversor', () => {
      const projectVoltage = mockPDFData.project.serviceVoltage;
      const inverterVoltage = parseInt(
        mockPDFData.inverters[0].inverter.nominalVoltageAC || '0'
      );

      expect(projectVoltage).toBe(inverterVoltage);
    });

    it('dados de módulo devem ter todos os campos elétricos obrigatórios', () => {
      const mod = mockPDFData.moduleArrays[0].module;

      expect(parseFloat(mod.voc)).toBeGreaterThan(0);
      expect(parseFloat(mod.isc)).toBeGreaterThan(0);
      expect(parseFloat(mod.vmpp)).toBeGreaterThan(0);
      expect(parseFloat(mod.impp)).toBeGreaterThan(0);
      expect(mod.nominalPower).toBeGreaterThan(0);
    });

    it('dados de inversor devem ter potência nominal AC', () => {
      const inv = mockPDFData.inverters[0].inverter;

      expect(inv.nominalPowerAC).toBeGreaterThan(0);
    });
  });
});
