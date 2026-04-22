/**
 * Ponto de entrada do novo gerador de diagrama unifilar PDF.
 *
 * Este arquivo consolida a API interna do módulo `pdf/`. Durante as fases
 * de desenvolvimento, o pdfGenerator.ts existente continua sendo usado em
 * produção. Apenas na Fase 8 é que pdfGenerator.ts será modificado para
 * delegar a geração para o novo código aqui exposto.
 *
 * A função pública principal do projeto — generatePDFDiagram — permanece
 * em ../pdfGenerator.ts e mantém exatamente a mesma assinatura.
 */

export * from './utils/units';
export * from './utils/geometry';
export * from './utils/notationCabo';
export * from './layout/frame';
