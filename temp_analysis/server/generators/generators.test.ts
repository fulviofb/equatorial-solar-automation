import { describe, it, expect } from 'vitest';
import { generateExcelDocument } from './excelGenerator';
import { generateWordDocument } from './wordGenerator';
import { generatePDFDiagram } from './pdfGenerator';

const mockProjectData = {
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
    totalInstalledPower: 5000,
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
        nominalVoltageAC: '220',
        nominalFrequency: '60',
        maxCurrentAC: '23.8',
        powerFactor: '0.99',
        thdCurrent: '<3',
        maxEfficiency: '98.4',
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

describe('Geradores de Documentos', () => {
  describe('generateExcelDocument', () => {
    it('deve gerar um buffer Excel válido', async () => {
      const buffer = await generateExcelDocument(mockProjectData);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Verificar assinatura do arquivo Excel (ZIP)
      expect(buffer.toString('hex', 0, 4)).toBe('504b0304');
    });

    it('deve gerar arquivo Excel com tamanho adequado', async () => {
      const buffer = await generateExcelDocument(mockProjectData);
      
      // Verificar que o arquivo tem conteúdo substancial
      expect(buffer.length).toBeGreaterThan(5000);
    });


  });

  describe('generateWordDocument', () => {
    it('deve gerar um buffer Word válido', async () => {
      const buffer = await generateWordDocument(mockProjectData);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Verificar assinatura do arquivo Word (ZIP)
      expect(buffer.toString('hex', 0, 4)).toBe('504b0304');
    });

    it('deve gerar arquivo Word com tamanho adequado', async () => {
      const buffer = await generateWordDocument(mockProjectData);
      
      // Verificar que o arquivo tem conteúdo substancial
      expect(buffer.length).toBeGreaterThan(5000);
    });


  });

  describe('generatePDFDiagram', () => {
    it('deve gerar um buffer PDF válido', async () => {
      const buffer = await generatePDFDiagram(mockProjectData);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Verificar assinatura do arquivo PDF
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    it('deve gerar PDF com estrutura válida', async () => {
      const buffer = await generatePDFDiagram(mockProjectData);
      
      // Verificar tamanho adequado
      expect(buffer.length).toBeGreaterThan(1000);
      // Verificar que contém objetos PDF
      expect(buffer.toString('utf8')).toContain('obj');
    });


  });

  describe('Validações de Dados', () => {
    it('deve calcular potência total corretamente', async () => {
      const totalPower = mockProjectData.moduleArrays.reduce((sum, array) => {
        return sum + (array.module.nominalPower * array.quantity);
      }, 0);
      
      expect(totalPower).toBe(4500); // 10 módulos x 450W
      expect(totalPower / 1000).toBeLessThanOrEqual(mockProjectData.project.availablePower);
    });

    it('deve validar compatibilidade de tensão', () => {
      const projectVoltage = mockProjectData.project.serviceVoltage;
      const inverterVoltage = parseInt(mockProjectData.inverters[0].inverter.nominalVoltageAC || '0');
      
      expect(projectVoltage).toBe(inverterVoltage);
    });
  });
});
