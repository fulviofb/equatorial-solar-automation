import ExcelJS from 'exceljs';
import { Project, Client, TechnicalResponsible, SolarModule, Inverter } from '../../drizzle/schema';

interface ProjectData {
  project: Project;
  client: Client;
  technicalResponsible: TechnicalResponsible;
  moduleArrays: Array<{ module: SolarModule; quantity: number; arrayNumber: number }>;
  inverters: Array<{ inverter: Inverter; quantity: number }>;
  ratioList?: Array<{
    order: number;
    accountContract: string;
    consumptionClass: string;
    address: string;
    percentageKwh?: number;
  }>;
}

export async function generateExcelDocument(data: ProjectData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  // GUIA 0 - Informações das Unidades Geradoras
  const sheet0 = workbook.addWorksheet('0');
  
  // Cabeçalho
  sheet0.mergeCells('A1:Z1');
  sheet0.getCell('A1').value = 'Informações das Unidades Geradoras (UG): (PREENCHER CONFORME O TIPO DE FONTE DE GERAÇÃO)';
  sheet0.getCell('A1').font = { bold: true, size: 12 };
  sheet0.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  
  // 1. Solar Fotovoltaica
  sheet0.getCell('A4').value = '1. Solar Fotovoltaica';
  sheet0.getCell('A4').font = { bold: true };
  
  // Cabeçalhos da tabela de módulos
  const moduleHeaders = ['Item', 'Potência do Módulo (W)', 'Quantidade', 'Potência de Pico (kWp)', 'Área do arranjo (m²)', 'Fabricante(s) dos Módulos', 'Modelo'];
  sheet0.getRow(5).values = moduleHeaders;
  sheet0.getRow(5).font = { bold: true };
  sheet0.getRow(5).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };
  
  // Preencher dados dos módulos
  let row = 6;
  let totalPeakPower = 0;
  let totalArea = 0;
  
  data.moduleArrays.forEach((array, index) => {
    const peakPower = (array.module.nominalPower * array.quantity) / 1000; // kWp
    const arrayArea = array.module.area ? parseFloat(array.module.area) * array.quantity : 0;
    
    totalPeakPower += peakPower;
    totalArea += arrayArea;
    
    sheet0.getRow(row).values = [
      index + 1,
      array.module.nominalPower,
      array.quantity,
      peakPower.toFixed(2),
      arrayArea.toFixed(2),
      array.module.manufacturer,
      array.module.model
    ];
    row++;
  });
  
  // Linha TOTAL
  sheet0.getRow(row).values = [
    'TOTAL',
    '',
    data.moduleArrays.reduce((sum, a) => sum + a.quantity, 0),
    totalPeakPower.toFixed(2),
    totalArea.toFixed(2),
    '',
    ''
  ];
  sheet0.getRow(row).font = { bold: true };
  
  // 2. Dados dos Inversores
  row += 3;
  sheet0.getCell(`A${row}`).value = '2. Dados dos Inversores';
  sheet0.getCell(`A${row}`).font = { bold: true };
  
  row++;
  const inverterHeaders = ['Item', 'Fabricante*', 'Modelo*', 'Potência Nominal (kW)', 'Faixa de tensão de operação (V)', 'Corrente Nominal (A)', 'Fator de Potência', 'Rendimento (%)', 'DHT de Corrente (%)'];
  sheet0.getRow(row).values = inverterHeaders;
  sheet0.getRow(row).font = { bold: true };
  sheet0.getRow(row).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };
  
  row++;
  let totalInverterPower = 0;
  
  data.inverters.forEach((inv, index) => {
    const powerKW = inv.inverter.nominalPowerAC / 1000;
    totalInverterPower += powerKW * inv.quantity;
    
    for (let i = 0; i < inv.quantity; i++) {
      sheet0.getRow(row).values = [
        row - (row - data.inverters.length - 5),
        inv.inverter.manufacturer,
        inv.inverter.model,
        powerKW.toFixed(1),
        inv.inverter.nominalVoltageAC || '',
        inv.inverter.maxCurrentAC || '',
        inv.inverter.powerFactor || '',
        inv.inverter.maxEfficiency || '',
        inv.inverter.thdCurrent || ''
      ];
      row++;
    }
  });
  
  // GUIA 1 - Dados Cadastrais e Características
  const sheet1 = workbook.addWorksheet('1');
  
  // Título
  sheet1.mergeCells('A1:Z1');
  sheet1.getCell('A1').value = 'NT.00020.EQTL.Normas e Qualidade\nANEXO I - Formulário de Solicitação de Orçamento de Microgeração Distribuída Grupo B';
  sheet1.getCell('A1').font = { bold: true, size: 14 };
  sheet1.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  
  // 1. Identificação e Dados Cadastrais da Unidade Consumidora
  let currentRow = 5;
  sheet1.getCell(`A${currentRow}`).value = '1. Identificação e Dados Cadastrais da Unidade Consumidora - PREENCHER, OBRIGATORIAMENTE, TODOS OS CAMPOS NA COR VERMELHA';
  sheet1.getCell(`A${currentRow}`).font = { bold: true };
  
  currentRow += 2;
  sheet1.getCell(`A${currentRow}`).value = 'Nome do Cliente / Razão Social (Titular da Unidade Consumidora)';
  sheet1.getCell(`C${currentRow}`).value = data.client.name;
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'CPF/CNPJ';
  sheet1.getCell(`C${currentRow}`).value = data.client.cpfCnpj;
  sheet1.getCell(`E${currentRow}`).value = 'RG';
  sheet1.getCell(`F${currentRow}`).value = data.client.rg || '';
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Endereço';
  sheet1.getCell(`C${currentRow}`).value = data.client.address;
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'CEP:';
  sheet1.getCell(`B${currentRow}`).value = data.client.cep || '';
  sheet1.getCell(`C${currentRow}`).value = 'Munícipio';
  sheet1.getCell(`D${currentRow}`).value = data.client.city;
  sheet1.getCell(`E${currentRow}`).value = 'UF (selecionar)';
  sheet1.getCell(`F${currentRow}`).value = data.client.state;
  
  currentRow += 2;
  sheet1.getCell(`A${currentRow}`).value = 'Tipo de orçamento desejado';
  sheet1.getCell(`C${currentRow}`).value = 'Orçamento de Conexão';
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Tipo de Solicitação (selecionar)';
  sheet1.getCell(`C${currentRow}`).value = data.project.requestType;
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Conta Contrato (Se UC existente)';
  sheet1.getCell(`C${currentRow}`).value = data.project.accountContract || '';
  
  currentRow += 2;
  sheet1.getCell(`A${currentRow}`).value = 'Classe (selecionar)';
  sheet1.getCell(`C${currentRow}`).value = data.client.consumptionClass;
  sheet1.getCell(`E${currentRow}`).value = 'Tipo de Ligação (selecionar)';
  sheet1.getCell(`F${currentRow}`).value = data.project.connectionType;
  sheet1.getCell(`G${currentRow}`).value = 'Tensão de Atendimento da UC';
  sheet1.getCell(`H${currentRow}`).value = `${data.project.serviceVoltage} V`;
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Carga Declarada da UC';
  sheet1.getCell(`C${currentRow}`).value = `${data.project.declaredLoad || (data.project.totalInstalledPower / 1000).toFixed(2)} kW`;
  sheet1.getCell(`E${currentRow}`).value = 'Disjuntor de Entrada da UC (selecionar)';
  sheet1.getCell(`F${currentRow}`).value = `${data.project.entryBreakerCurrent} A`;
  sheet1.getCell(`G${currentRow}`).value = 'Potência Disponibilizada (PD) para a UC';
  sheet1.getCell(`H${currentRow}`).value = `${data.project.availablePower} kW`;
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Tipo de Ramal (selecionar)';
  sheet1.getCell(`C${currentRow}`).value = data.project.branchType;
  sheet1.getCell(`E${currentRow}`).value = 'Nº de identificação do poste ou transformador mais próximo';
  sheet1.getCell(`F${currentRow}`).value = data.project.nearestPoleNumber || '';
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Coordenadas do ponto de entrega';
  sheet1.getCell(`C${currentRow}`).value = `X = ${data.project.coordinateX || ''}`;
  sheet1.getCell(`E${currentRow}`).value = `Y = ${data.project.coordinateY || ''}`;
  
  // 2. Dados Cadastrais do Responsável Técnico
  currentRow += 3;
  sheet1.getCell(`A${currentRow}`).value = '2. Dados Cadastrais do Responsável Técnico';
  sheet1.getCell(`A${currentRow}`).font = { bold: true };
  
  currentRow += 2;
  sheet1.getCell(`A${currentRow}`).value = 'Nome Completo';
  sheet1.getCell(`C${currentRow}`).value = data.technicalResponsible.name;
  sheet1.getCell(`E${currentRow}`).value = 'Titulo Profissional';
  sheet1.getCell(`F${currentRow}`).value = data.technicalResponsible.title;
  sheet1.getCell(`H${currentRow}`).value = 'Registro Profissional';
  sheet1.getCell(`I${currentRow}`).value = `Nº ${data.technicalResponsible.registrationNumber}`;
  sheet1.getCell(`J${currentRow}`).value = `UF ${data.technicalResponsible.registrationState}`;
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'E-mail';
  sheet1.getCell(`C${currentRow}`).value = data.technicalResponsible.email;
  sheet1.getCell(`E${currentRow}`).value = 'Telefone Fixo';
  sheet1.getCell(`F${currentRow}`).value = data.technicalResponsible.phone || '';
  sheet1.getCell(`G${currentRow}`).value = 'Telefone Celular';
  sheet1.getCell(`H${currentRow}`).value = data.technicalResponsible.mobile || '';
  
  // 3. Características da Microgeração Distribuída
  currentRow += 3;
  sheet1.getCell(`A${currentRow}`).value = '3. Características da Microgeração Distribuída';
  sheet1.getCell(`A${currentRow}`).font = { bold: true };
  
  currentRow += 2;
  sheet1.getCell(`A${currentRow}`).value = 'Tipo de Fonte Primária (selecionar)';
  sheet1.getCell(`C${currentRow}`).value = data.project.primarySourceType;
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Tipo de Geração (selecionar)';
  sheet1.getCell(`C${currentRow}`).value = data.project.generationType;
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Enquadramento (selecionar)';
  sheet1.getCell(`C${currentRow}`).value = data.project.classification;
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Data de Início da Operação';
  sheet1.getCell(`C${currentRow}`).value = data.project.operationStartDate ? new Date(data.project.operationStartDate).toLocaleDateString('pt-BR') : '';
  
  currentRow++;
  sheet1.getCell(`A${currentRow}`).value = 'Potência Instalada Total';
  sheet1.getCell(`C${currentRow}`).value = `${(data.project.totalInstalledPower / 1000).toFixed(2)} kWp`;
  
  // GUIA 2 - Lista de Rateio (se aplicável)
  if (data.ratioList && data.ratioList.length > 0) {
    const sheet2 = workbook.addWorksheet('2');
    
    sheet2.mergeCells('A1:H1');
    sheet2.getCell('A1').value = 'LISTA DE RATEIO PARA AS UNIDADES CONSUMIDORAS PARTICIPANTES DO SISTEMA DE COMPENSAÇÃO\n(Autoconsumo Remoto, Geração Compartilhada e EMUC)';
    sheet2.getCell('A1').font = { bold: true, size: 12 };
    sheet2.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    
    let ratioRow = 3;
    sheet2.getCell(`A${ratioRow}`).value = 'Conta Contrato da UC geradora';
    sheet2.getCell(`B${ratioRow}`).value = data.project.accountContract;
    sheet2.getCell(`D${ratioRow}`).value = 'Enquadramento';
    sheet2.getCell(`E${ratioRow}`).value = data.project.classification;
    
    ratioRow++;
    sheet2.getCell(`A${ratioRow}`).value = 'Local da solicitação';
    sheet2.getCell(`B${ratioRow}`).value = data.client.address;
    
    ratioRow++;
    sheet2.getCell(`A${ratioRow}`).value = 'Forma de alocação dos créditos';
    sheet2.getCell(`B${ratioRow}`).value = 'Percentual do Excedente';
    
    ratioRow += 2;
    const ratioHeaders = ['Ordem', '% kWh', 'Conta Contrato', 'Classe de Consumo', 'ENDEREÇO'];
    sheet2.getRow(ratioRow).values = ratioHeaders;
    sheet2.getRow(ratioRow).font = { bold: true };
    sheet2.getRow(ratioRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };
    
    ratioRow++;
    data.ratioList.forEach((item) => {
      sheet2.getRow(ratioRow).values = [
        item.order,
        item.percentageKwh || '',
        item.accountContract,
        item.consumptionClass,
        item.address
      ];
      ratioRow++;
    });
  }
  
  // Ajustar largura das colunas
  [sheet0, sheet1].forEach(sheet => {
    sheet.columns.forEach(column => {
      column.width = 15;
    });
  });
  
  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
