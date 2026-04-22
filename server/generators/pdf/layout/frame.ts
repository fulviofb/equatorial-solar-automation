/**
 * Moldura (frame) da prancha técnica A3 paisagem.
 *
 * Define as áreas internas do diagrama seguindo o layout visual padrão
 * utilizado no modelo de referência do projetista e compatível com as
 * Figuras 5, 6 e 7 da NT.00020.EQTL.
 *
 * Divisão da prancha:
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ CABEÇALHO (título, subtítulo)                               │
 *   ├──────────────┬───────────────────────────────┬──────────────┤
 *   │              │                               │ NOTAS        │
 *   │ SITUAÇÃO UC  │    ÁREA DO DIAGRAMA           │ OBRIGATÓRIAS │
 *   │              │                               │              │
 *   │              │                               │ LEGENDA      │
 *   ├──────────────┴───────────────────────────────┴──────────────┤
 *   │ PLACA ADV. │ QUADRO REV. │ CARIMBO (cliente, RT, escala)    │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * As proporções são calibradas para A3 paisagem (420 × 297 mm). Regiões
 * são expostas via FrameLayout para que outros módulos (symbols/, diagram/,
 * layout/) saibam onde desenhar seus elementos.
 */

import type { PDFPage } from 'pdf-lib';
import { StandardFonts, type PDFFont } from 'pdf-lib';
import {
  drawBorder,
  drawHorizontalLine,
  drawVerticalLine,
  type Rect,
} from '../utils/geometry';
import {
  DEFAULT_PAGE_SIZE,
  FONT_SIZE,
  PAGE_MARGIN_MM,
  STROKE_WIDTH,
  mm,
} from '../utils/units';

/**
 * Mapa de regiões internas da prancha. Cada região é um Rect em pt onde
 * o conteúdo correspondente deve ser desenhado.
 */
export interface FrameLayout {
  /** Retângulo total da página. */
  page: Rect;
  /** Área útil interna, dentro das margens. */
  contentArea: Rect;
  /** Cabeçalho com título e subtítulo do diagrama. */
  header: Rect;
  /** Região esquerda — situação da UC (mapa/satélite) e resumo de potências. */
  situation: Rect;
  /** Região central — área principal do diagrama unifilar. */
  diagram: Rect;
  /** Região direita superior — notas obrigatórias da concessionária. */
  notes: Rect;
  /** Região direita inferior — legenda de equipamentos. */
  legend: Rect;
  /** Rodapé esquerdo — placa de advertência e detalhes. */
  warningPlate: Rect;
  /** Rodapé central — quadro de revisões. */
  revisions: Rect;
  /** Rodapé direito — carimbo com cliente, RT, datas, escala. */
  titleBlock: Rect;
}

/**
 * Calcula todas as regiões da prancha a partir do tamanho de página.
 */
export function computeFrameLayout(): FrameLayout {
  const pageWidth = DEFAULT_PAGE_SIZE.width;
  const pageHeight = DEFAULT_PAGE_SIZE.height;

  const marginTop = mm(PAGE_MARGIN_MM.top);
  const marginRight = mm(PAGE_MARGIN_MM.right);
  const marginBottom = mm(PAGE_MARGIN_MM.bottom);
  const marginLeft = mm(PAGE_MARGIN_MM.left);

  const page: Rect = { x: 0, y: 0, width: pageWidth, height: pageHeight };
  const contentArea: Rect = {
    x: marginLeft,
    y: marginBottom,
    width: pageWidth - marginLeft - marginRight,
    height: pageHeight - marginTop - marginBottom,
  };

  // Alturas verticais: cabeçalho (8%), corpo (77%), rodapé (15%).
  const headerHeight = contentArea.height * 0.08;
  const footerHeight = contentArea.height * 0.15;
  const bodyHeight = contentArea.height - headerHeight - footerHeight;

  const bodyY = contentArea.y + footerHeight;
  const headerY = bodyY + bodyHeight;

  const header: Rect = {
    x: contentArea.x,
    y: headerY,
    width: contentArea.width,
    height: headerHeight,
  };

  // Larguras horizontais do corpo: situação (18%), diagrama (60%), notas+legenda (22%).
  const situationWidth = contentArea.width * 0.18;
  const notesWidth = contentArea.width * 0.22;
  const diagramWidth = contentArea.width - situationWidth - notesWidth;

  const situation: Rect = {
    x: contentArea.x,
    y: bodyY,
    width: situationWidth,
    height: bodyHeight,
  };

  const diagram: Rect = {
    x: contentArea.x + situationWidth,
    y: bodyY,
    width: diagramWidth,
    height: bodyHeight,
  };

  // Direita: notas (60% da altura) e legenda (40%).
  const notesHeight = bodyHeight * 0.6;
  const legendHeight = bodyHeight - notesHeight;

  const notes: Rect = {
    x: contentArea.x + situationWidth + diagramWidth,
    y: bodyY + legendHeight,
    width: notesWidth,
    height: notesHeight,
  };

  const legend: Rect = {
    x: contentArea.x + situationWidth + diagramWidth,
    y: bodyY,
    width: notesWidth,
    height: legendHeight,
  };

  // Rodapé: placa (18%), revisões (30%), carimbo (52%).
  const warningPlateWidth = contentArea.width * 0.18;
  const revisionsWidth = contentArea.width * 0.3;
  const titleBlockWidth = contentArea.width - warningPlateWidth - revisionsWidth;

  const warningPlate: Rect = {
    x: contentArea.x,
    y: contentArea.y,
    width: warningPlateWidth,
    height: footerHeight,
  };

  const revisions: Rect = {
    x: contentArea.x + warningPlateWidth,
    y: contentArea.y,
    width: revisionsWidth,
    height: footerHeight,
  };

  const titleBlock: Rect = {
    x: contentArea.x + warningPlateWidth + revisionsWidth,
    y: contentArea.y,
    width: titleBlockWidth,
    height: footerHeight,
  };

  return {
    page,
    contentArea,
    header,
    situation,
    diagram,
    notes,
    legend,
    warningPlate,
    revisions,
    titleBlock,
  };
}

/**
 * Desenha a moldura externa, divisões internas e rótulos das regiões.
 *
 * Nesta Fase 1, cada região recebe apenas a borda e um rótulo
 * identificando o que será desenhado ali nas fases seguintes. Isso permite
 * validar visualmente o layout antes de preencher com conteúdo real.
 */
export function drawFrame(
  page: PDFPage,
  layout: FrameLayout,
  font: PDFFont,
  options?: { showPlaceholders?: boolean },
): void {
  const showPlaceholders = options?.showPlaceholders ?? true;

  // Moldura externa.
  drawBorder(page, layout.contentArea, { thickness: STROKE_WIDTH.frame });

  // Linha separando cabeçalho do corpo.
  drawHorizontalLine(page, {
    from: { x: layout.header.x, y: layout.header.y },
    to: { x: layout.header.x + layout.header.width, y: layout.header.y },
    thickness: STROKE_WIDTH.frame,
  });

  // Linha separando corpo do rodapé.
  const footerTopY = layout.contentArea.y + layout.warningPlate.height;
  drawHorizontalLine(page, {
    from: { x: layout.contentArea.x, y: footerTopY },
    to: { x: layout.contentArea.x + layout.contentArea.width, y: footerTopY },
    thickness: STROKE_WIDTH.frame,
  });

  // Linhas verticais do corpo: situação | diagrama | notas+legenda.
  drawVerticalLine(page, {
    from: { x: layout.diagram.x, y: layout.diagram.y },
    to: { x: layout.diagram.x, y: layout.diagram.y + layout.diagram.height },
    thickness: STROKE_WIDTH.frame,
  });
  drawVerticalLine(page, {
    from: { x: layout.notes.x, y: layout.notes.y },
    to: { x: layout.notes.x, y: layout.diagram.y + layout.diagram.height },
    thickness: STROKE_WIDTH.frame,
  });

  // Linha horizontal separando notas de legenda.
  drawHorizontalLine(page, {
    from: { x: layout.notes.x, y: layout.legend.y + layout.legend.height },
    to: {
      x: layout.notes.x + layout.notes.width,
      y: layout.legend.y + layout.legend.height,
    },
    thickness: STROKE_WIDTH.auxiliary,
  });

  // Linhas verticais do rodapé: placa | revisões | carimbo.
  drawVerticalLine(page, {
    from: { x: layout.revisions.x, y: layout.revisions.y },
    to: {
      x: layout.revisions.x,
      y: layout.revisions.y + layout.revisions.height,
    },
    thickness: STROKE_WIDTH.frame,
  });
  drawVerticalLine(page, {
    from: { x: layout.titleBlock.x, y: layout.titleBlock.y },
    to: {
      x: layout.titleBlock.x,
      y: layout.titleBlock.y + layout.titleBlock.height,
    },
    thickness: STROKE_WIDTH.frame,
  });

  if (showPlaceholders) {
    drawPlaceholderLabel(page, layout.header, 'CABEÇALHO — título e subtítulo', font);
    drawPlaceholderLabel(page, layout.situation, 'SITUAÇÃO DA UC', font);
    drawPlaceholderLabel(page, layout.diagram, 'ÁREA DO DIAGRAMA UNIFILAR', font);
    drawPlaceholderLabel(page, layout.notes, 'NOTAS OBRIGATÓRIAS', font);
    drawPlaceholderLabel(page, layout.legend, 'LEGENDA DE EQUIPAMENTOS', font);
    drawPlaceholderLabel(page, layout.warningPlate, 'PLACA DE ADVERTÊNCIA', font);
    drawPlaceholderLabel(page, layout.revisions, 'QUADRO DE REVISÕES', font);
    drawPlaceholderLabel(page, layout.titleBlock, 'CARIMBO', font);
  }
}

/**
 * Desenha um rótulo de texto centralizado em uma região, usado apenas
 * durante a Fase 1 para identificar visualmente onde cada conteúdo irá.
 */
function drawPlaceholderLabel(
  page: PDFPage,
  rect: Rect,
  label: string,
  font: PDFFont,
): void {
  const fontSize = FONT_SIZE.subtitle;
  const textWidth = font.widthOfTextAtSize(label, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  page.drawText(label, {
    x: rect.x + (rect.width - textWidth) / 2,
    y: rect.y + (rect.height - textHeight) / 2,
    size: fontSize,
    font,
  });
}

/**
 * Helper para carregar a fonte padrão da prancha.
 *
 * Usamos Helvetica (embutida no pdf-lib, sem custo de download) para
 * manter o bundle pequeno. Caso precisemos de caracteres especiais não
 * cobertos pela WinAnsi, trocaremos para uma fonte TTF em fase posterior.
 */
export async function loadFrameFont(pdfDoc: Parameters<PDFPage['doc']['embedFont']>[0] extends never ? never : any): Promise<PDFFont> {
  // Assinatura defensiva: esperamos um PDFDocument, mas TS infere de outra forma.
  // Na prática, a chamada correta é pdfDoc.embedFont(StandardFonts.Helvetica).
  return pdfDoc.embedFont(StandardFonts.Helvetica);
}
