/**
 * Script standalone para gerar snapshots visuais do novo gerador de PDF.
 *
 * Este script NÃO faz parte do vitest — ele é rodado manualmente durante
 * o desenvolvimento para validar visualmente como a prancha está ficando
 * em cada fase. Os PDFs gerados ficam em server/tests/__pdf_snapshots__/
 * e devem ser commitados no repo para que as revisões possam comparar
 * com a Figura 5 da NT.00020.EQTL.
 *
 * Como rodar:
 *   pnpm tsx server/tests/generatePdfSnapshot.ts
 *
 * Saída esperada (Fase 1):
 *   server/tests/__pdf_snapshots__/phase1_frame.pdf
 */

import { PDFDocument, StandardFonts } from 'pdf-lib';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeFrameLayout,
  drawFrame,
} from '../generators/pdf/layout/frame';
import { DEFAULT_PAGE_SIZE } from '../generators/pdf/utils/units';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SNAPSHOT_DIR = join(__dirname, '__pdf_snapshots__');

async function ensureSnapshotDir(): Promise<void> {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
}

/**
 * Snapshot da Fase 1: moldura A3 paisagem com placeholders de região.
 */
async function generatePhase1FrameSnapshot(): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([DEFAULT_PAGE_SIZE.width, DEFAULT_PAGE_SIZE.height]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const layout = computeFrameLayout();
  drawFrame(page, layout, font, { showPlaceholders: true });

  const bytes = await pdfDoc.save();
  const outputPath = join(SNAPSHOT_DIR, 'phase1_frame.pdf');
  await writeFile(outputPath, bytes);

  console.log(`✓ Snapshot gerado: ${outputPath}`);
}

async function main(): Promise<void> {
  await ensureSnapshotDir();
  await generatePhase1FrameSnapshot();
}

main().catch((error) => {
  console.error('Erro ao gerar snapshots:', error);
  process.exit(1);
});
