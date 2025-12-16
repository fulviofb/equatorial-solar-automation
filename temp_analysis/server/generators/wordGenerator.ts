import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { Project, Client, TechnicalResponsible, SolarModule, Inverter } from '../../drizzle/schema';

interface ProjectData {
  project: Project;
  client: Client;
  technicalResponsible: TechnicalResponsible;
  moduleArrays: Array<{ module: SolarModule; quantity: number; arrayNumber: number }>;
  inverters: Array<{ inverter: Inverter; quantity: number }>;
}

export async function generateWordDocument(data: ProjectData): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Título
        new Paragraph({
          text: 'MEMORIAL TÉCNICO DESCRITIVO',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          text: 'SISTEMA DE MICROGERAÇÃO DISTRIBUÍDA',
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),
        
        // 1. IDENTIFICAÇÃO
        new Paragraph({
          text: '1. IDENTIFICAÇÃO',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Cliente: ', bold: true }),
            new TextRun(data.client.name),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'CPF/CNPJ: ', bold: true }),
            new TextRun(data.client.cpfCnpj),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Endereço: ', bold: true }),
            new TextRun(data.client.address),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Município/UF: ', bold: true }),
            new TextRun(`${data.client.city}/${data.client.state}`),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Classe de Consumo: ', bold: true }),
            new TextRun(data.client.consumptionClass),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Conta Contrato: ', bold: true }),
            new TextRun(data.project.accountContract || 'N/A'),
          ],
          spacing: { after: 300 },
        }),
        
        // 2. RESPONSÁVEL TÉCNICO
        new Paragraph({
          text: '2. RESPONSÁVEL TÉCNICO',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Nome: ', bold: true }),
            new TextRun(data.technicalResponsible.name),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Título: ', bold: true }),
            new TextRun(data.technicalResponsible.title),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Registro Profissional: ', bold: true }),
            new TextRun(`${data.technicalResponsible.registrationNumber} - ${data.technicalResponsible.registrationState}`),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'E-mail: ', bold: true }),
            new TextRun(data.technicalResponsible.email),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Telefone: ', bold: true }),
            new TextRun(data.technicalResponsible.mobile || data.technicalResponsible.phone || 'N/A'),
          ],
          spacing: { after: 300 },
        }),
        
        // 3. CARACTERÍSTICAS DO SISTEMA
        new Paragraph({
          text: '3. CARACTERÍSTICAS DO SISTEMA DE MICROGERAÇÃO',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo de Fonte Primária: ', bold: true }),
            new TextRun(data.project.primarySourceType),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo de Geração: ', bold: true }),
            new TextRun(data.project.generationType),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Enquadramento: ', bold: true }),
            new TextRun(data.project.classification),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Potência Instalada Total: ', bold: true }),
            new TextRun(`${(data.project.totalInstalledPower / 1000).toFixed(2)} kWp`),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Tensão de Atendimento: ', bold: true }),
            new TextRun(`${data.project.serviceVoltage} V`),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo de Ligação: ', bold: true }),
            new TextRun(data.project.connectionType),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Potência Disponibilizada: ', bold: true }),
            new TextRun(`${data.project.availablePower} kW`),
          ],
          spacing: { after: 300 },
        }),
        
        // 4. MÓDULOS FOTOVOLTAICOS
        new Paragraph({
          text: '4. MÓDULOS FOTOVOLTAICOS',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        ...data.moduleArrays.map((array, index) => {
          const peakPower = (array.module.nominalPower * array.quantity) / 1000;
          return new Paragraph({
            children: [
              new TextRun({ text: `Arranjo ${index + 1}: `, bold: true }),
              new TextRun(`${array.quantity} módulos ${array.module.manufacturer} ${array.module.model} de ${array.module.nominalPower}W, totalizando ${peakPower.toFixed(2)} kWp`),
            ],
            spacing: { after: 100 },
          });
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: '\nEspecificações Técnicas dos Módulos:', bold: true }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        
        ...data.moduleArrays.map(array => 
          new Paragraph({
            children: [
              new TextRun({ text: `${array.module.manufacturer} ${array.module.model}: `, bold: true }),
              new TextRun(`Voc = ${array.module.voc}V, Isc = ${array.module.isc}A, Vmpp = ${array.module.vmpp}V, Impp = ${array.module.impp}A`),
              array.module.efficiency ? new TextRun(`, Eficiência = ${array.module.efficiency}%`) : new TextRun(''),
            ],
            spacing: { after: 100 },
          })
        ),
        
        // 5. INVERSORES
        new Paragraph({
          text: '5. INVERSORES',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        ...data.inverters.map((inv, index) => {
          const powerKW = inv.inverter.nominalPowerAC / 1000;
          return new Paragraph({
            children: [
              new TextRun({ text: `Inversor ${index + 1}: `, bold: true }),
              new TextRun(`${inv.quantity}x ${inv.inverter.manufacturer} ${inv.inverter.model} de ${powerKW.toFixed(1)}kW`),
            ],
            spacing: { after: 100 },
          });
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: '\nEspecificações Técnicas dos Inversores:', bold: true }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        
        ...data.inverters.map(inv => 
          new Paragraph({
            children: [
              new TextRun({ text: `${inv.inverter.manufacturer} ${inv.inverter.model}: `, bold: true }),
              new TextRun(`Potência Nominal = ${(inv.inverter.nominalPowerAC / 1000).toFixed(1)}kW`),
              inv.inverter.nominalVoltageAC ? new TextRun(`, Tensão CA = ${inv.inverter.nominalVoltageAC}V`) : new TextRun(''),
              inv.inverter.maxEfficiency ? new TextRun(`, Eficiência = ${inv.inverter.maxEfficiency}%`) : new TextRun(''),
              inv.inverter.certificationNumber ? new TextRun(`, Certificação INMETRO = ${inv.inverter.certificationNumber}`) : new TextRun(''),
            ],
            spacing: { after: 100 },
          })
        ),
        
        // 6. DESCRIÇÃO DO SISTEMA
        new Paragraph({
          text: '6. DESCRIÇÃO DO SISTEMA',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: `O sistema de microgeração fotovoltaica será composto por ${data.moduleArrays.reduce((sum, a) => sum + a.quantity, 0)} módulos fotovoltaicos distribuídos em ${data.moduleArrays.length} arranjo(s), com potência de pico total de ${(data.project.totalInstalledPower / 1000).toFixed(2)} kWp. A conversão da energia solar em energia elétrica será realizada por ${data.inverters.reduce((sum, i) => sum + i.quantity, 0)} inversor(es) grid-tie, com potência total de ${data.inverters.reduce((sum, i) => sum + (i.inverter.nominalPowerAC * i.quantity), 0) / 1000}kW.`,
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),
        
        new Paragraph({
          text: 'O sistema será conectado à rede elétrica da concessionária através de um ponto de conexão adequado, respeitando todas as normas técnicas vigentes, incluindo a Resolução Normativa ANEEL nº 1.000/2021 e suas atualizações, bem como as normas técnicas da distribuidora local.',
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),
        
        new Paragraph({
          text: 'Todos os equipamentos utilizados possuem certificação INMETRO e atendem aos requisitos de segurança e qualidade estabelecidos pela legislação brasileira.',
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),
        
        // 7. LOCAL E DATA
        new Paragraph({
          text: `${data.client.city}/${data.client.state}, ${new Date().toLocaleDateString('pt-BR')}`,
          alignment: AlignmentType.RIGHT,
          spacing: { before: 600, after: 400 },
        }),
        
        // Assinatura
        new Paragraph({
          text: '_'.repeat(50),
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: data.technicalResponsible.name, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
        
        new Paragraph({
          text: data.technicalResponsible.title,
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
        
        new Paragraph({
          text: `${data.technicalResponsible.registrationNumber} - ${data.technicalResponsible.registrationState}`,
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });
  
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
