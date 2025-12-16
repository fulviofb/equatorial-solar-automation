import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Project, Client, TechnicalResponsible, SolarModule, Inverter } from '../../drizzle/schema';

interface ProjectData {
  project: Project;
  client: Client;
  technicalResponsible: TechnicalResponsible;
  moduleArrays: Array<{ module: SolarModule; quantity: number; arrayNumber: number }>;
  inverters: Array<{ inverter: Inverter; quantity: number }>;
}

export async function generatePDFDiagram(data: ProjectData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Título
  page.drawText('DIAGRAMA UNIFILAR', {
    x: width / 2 - 100,
    y: height - 50,
    size: 20,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('SISTEMA DE MICROGERAÇÃO FOTOVOLTAICA', {
    x: width / 2 - 150,
    y: height - 75,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  // Informações do projeto
  let yPos = height - 120;
  const leftMargin = 50;
  const lineHeight = 20;
  
  page.drawText(`Cliente: ${data.client.name}`, {
    x: leftMargin,
    y: yPos,
    size: 10,
    font: font,
  });
  yPos -= lineHeight;
  
  page.drawText(`Endereço: ${data.client.address}, ${data.client.city}/${data.client.state}`, {
    x: leftMargin,
    y: yPos,
    size: 10,
    font: font,
  });
  yPos -= lineHeight;
  
  page.drawText(`Potência Instalada: ${(data.project.totalInstalledPower / 1000).toFixed(2)} kWp`, {
    x: leftMargin,
    y: yPos,
    size: 10,
    font: fontBold,
  });
  yPos -= lineHeight * 2;
  
  // Desenhar diagrama simplificado
  const diagramStartY = yPos;
  const centerX = width / 2;
  
  // Módulos Fotovoltaicos
  let moduleY = diagramStartY;
  data.moduleArrays.forEach((array, index) => {
    const boxWidth = 150;
    const boxHeight = 80;
    const boxX = centerX - 300;
    const boxY = moduleY - boxHeight;
    
    // Retângulo do arranjo
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });
    
    // Texto do arranjo
    page.drawText(`ARRANJO ${index + 1}`, {
      x: boxX + 10,
      y: boxY + boxHeight - 20,
      size: 10,
      font: fontBold,
    });
    
    page.drawText(`${array.quantity}x ${array.module.manufacturer}`, {
      x: boxX + 10,
      y: boxY + boxHeight - 35,
      size: 8,
      font: font,
    });
    
    page.drawText(`${array.module.model}`, {
      x: boxX + 10,
      y: boxY + boxHeight - 48,
      size: 8,
      font: font,
    });
    
    page.drawText(`${array.module.nominalPower}W`, {
      x: boxX + 10,
      y: boxY + boxHeight - 61,
      size: 8,
      font: fontBold,
    });
    
    // Linha de conexão para o inversor
    page.drawLine({
      start: { x: boxX + boxWidth, y: boxY + boxHeight / 2 },
      end: { x: centerX - 50, y: boxY + boxHeight / 2 },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
    
    moduleY -= (boxHeight + 20);
  });
  
  // Inversores
  let inverterY = diagramStartY - 40;
  data.inverters.forEach((inv, index) => {
    const boxWidth = 150;
    const boxHeight = 80;
    const boxX = centerX - 75;
    const boxY = inverterY - boxHeight;
    
    // Retângulo do inversor
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
      color: rgb(0.9, 0.9, 0.9),
    });
    
    // Texto do inversor
    page.drawText(`INVERSOR ${index + 1}`, {
      x: boxX + 10,
      y: boxY + boxHeight - 20,
      size: 10,
      font: fontBold,
    });
    
    page.drawText(`${inv.quantity}x ${inv.inverter.manufacturer}`, {
      x: boxX + 10,
      y: boxY + boxHeight - 35,
      size: 8,
      font: font,
    });
    
    page.drawText(`${inv.inverter.model}`, {
      x: boxX + 10,
      y: boxY + boxHeight - 48,
      size: 8,
      font: font,
    });
    
    page.drawText(`${(inv.inverter.nominalPowerAC / 1000).toFixed(1)}kW`, {
      x: boxX + 10,
      y: boxY + boxHeight - 61,
      size: 8,
      font: fontBold,
    });
    
    // Linha de conexão para o quadro de proteção
    page.drawLine({
      start: { x: boxX + boxWidth, y: boxY + boxHeight / 2 },
      end: { x: centerX + 150, y: boxY + boxHeight / 2 },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
    
    inverterY -= (boxHeight + 20);
  });
  
  // Quadro de Proteção CA
  const protectionBoxWidth = 120;
  const protectionBoxHeight = 100;
  const protectionBoxX = centerX + 150;
  const protectionBoxY = diagramStartY - 100;
  
  page.drawRectangle({
    x: protectionBoxX,
    y: protectionBoxY,
    width: protectionBoxWidth,
    height: protectionBoxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText('QUADRO DE', {
    x: protectionBoxX + 15,
    y: protectionBoxY + protectionBoxHeight - 25,
    size: 9,
    font: fontBold,
  });
  
  page.drawText('PROTEÇÃO CA', {
    x: protectionBoxX + 10,
    y: protectionBoxY + protectionBoxHeight - 40,
    size: 9,
    font: fontBold,
  });
  
  page.drawText(`Disjuntor:`, {
    x: protectionBoxX + 10,
    y: protectionBoxY + protectionBoxHeight - 60,
    size: 8,
    font: font,
  });
  
  page.drawText(`${data.project.entryBreakerCurrent}A`, {
    x: protectionBoxX + 10,
    y: protectionBoxY + protectionBoxHeight - 73,
    size: 8,
    font: fontBold,
  });
  
  // Linha para medidor
  page.drawLine({
    start: { x: protectionBoxX + protectionBoxWidth, y: protectionBoxY + protectionBoxHeight / 2 },
    end: { x: protectionBoxX + protectionBoxWidth + 50, y: protectionBoxY + protectionBoxHeight / 2 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  // Medidor Bidirecional
  const meterBoxWidth = 100;
  const meterBoxHeight = 80;
  const meterBoxX = protectionBoxX + protectionBoxWidth + 50;
  const meterBoxY = protectionBoxY + 10;
  
  page.drawRectangle({
    x: meterBoxX,
    y: meterBoxY,
    width: meterBoxWidth,
    height: meterBoxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
    color: rgb(0.95, 0.95, 0.95),
  });
  
  page.drawText('MEDIDOR', {
    x: meterBoxX + 15,
    y: meterBoxY + meterBoxHeight - 25,
    size: 9,
    font: fontBold,
  });
  
  page.drawText('BIDIRECIONAL', {
    x: meterBoxX + 5,
    y: meterBoxY + meterBoxHeight - 40,
    size: 8,
    font: fontBold,
  });
  
  page.drawText(`${data.project.serviceVoltage}V`, {
    x: meterBoxX + 25,
    y: meterBoxY + meterBoxHeight - 55,
    size: 8,
    font: font,
  });
  
  // Linha para rede
  page.drawLine({
    start: { x: meterBoxX + meterBoxWidth, y: meterBoxY + meterBoxHeight / 2 },
    end: { x: width - 50, y: meterBoxY + meterBoxHeight / 2 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  // Rede da Concessionária
  page.drawText('REDE', {
    x: width - 45,
    y: meterBoxY + meterBoxHeight / 2 + 20,
    size: 9,
    font: fontBold,
  });
  
  page.drawText('EQUATORIAL', {
    x: width - 60,
    y: meterBoxY + meterBoxHeight / 2 + 5,
    size: 8,
    font: font,
  });
  
  page.drawText(`${data.project.serviceVoltage}V`, {
    x: width - 45,
    y: meterBoxY + meterBoxHeight / 2 - 10,
    size: 8,
    font: font,
  });
  
  // Rodapé com informações do responsável técnico
  const footerY = 60;
  page.drawLine({
    start: { x: leftMargin, y: footerY + 40 },
    end: { x: width - leftMargin, y: footerY + 40 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('RESPONSÁVEL TÉCNICO:', {
    x: leftMargin,
    y: footerY + 20,
    size: 8,
    font: fontBold,
  });
  
  page.drawText(`${data.technicalResponsible.name} - ${data.technicalResponsible.title}`, {
    x: leftMargin,
    y: footerY + 5,
    size: 8,
    font: font,
  });
  
  page.drawText(`${data.technicalResponsible.registrationNumber} - ${data.technicalResponsible.registrationState}`, {
    x: leftMargin,
    y: footerY - 10,
    size: 8,
    font: font,
  });
  
  page.drawText(`DATA: ${new Date().toLocaleDateString('pt-BR')}`, {
    x: width - 150,
    y: footerY + 5,
    size: 8,
    font: font,
  });
  
  // Notas
  const notesY = footerY - 40;
  page.drawText('NOTAS:', {
    x: leftMargin,
    y: notesY,
    size: 7,
    font: fontBold,
  });
  
  page.drawText('1. Todos os equipamentos possuem certificação INMETRO.', {
    x: leftMargin,
    y: notesY - 12,
    size: 6,
    font: font,
  });
  
  page.drawText('2. O sistema atende às normas ABNT NBR 16690:2019 e Resolução Normativa ANEEL nº 1.000/2021.', {
    x: leftMargin,
    y: notesY - 22,
    size: 6,
    font: font,
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
