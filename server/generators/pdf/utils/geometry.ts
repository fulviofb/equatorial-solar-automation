/**
 * Helpers de geometria para desenho técnico no pdf-lib.
 *
 * Todas as coordenadas nas funções públicas seguem a convenção de pdf-lib:
 * origem no canto inferior esquerdo, Y crescente para cima. Isso difere
 * do Canvas/SVG mas é o padrão nativo da biblioteca.
 *
 * Diagramas elétricos unifilares exigem linhas estritamente ortogonais
 * (horizontais e verticais). Funções diagonais existem apenas para casos
 * especiais como símbolos internos de disjuntor.
 */

import type { PDFPage } from 'pdf-lib';
import { rgb } from 'pdf-lib';
import { STROKE_WIDTH } from './units';

/** Ponto em coordenadas PDF (pt). */
export interface Point {
  x: number;
  y: number;
}

/** Retângulo em coordenadas PDF (pt). */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Preto padrão para linhas de desenho técnico. */
export const BLACK = rgb(0, 0, 0);

/** Cinza médio para linhas auxiliares e dimensões. */
export const GRAY = rgb(0.4, 0.4, 0.4);

/**
 * Desenha uma linha horizontal.
 *
 * Usa explicitamente coordenadas idênticas de Y para garantir ortogonalidade
 * mesmo que o chamador passe valores com ruído de ponto flutuante.
 */
export function drawHorizontalLine(
  page: PDFPage,
  params: {
    from: Point;
    to: Point;
    thickness?: number;
    dashArray?: number[];
  },
): void {
  page.drawLine({
    start: { x: params.from.x, y: params.from.y },
    end: { x: params.to.x, y: params.from.y },
    thickness: params.thickness ?? STROKE_WIDTH.conductor,
    color: BLACK,
    dashArray: params.dashArray,
  });
}

/**
 * Desenha uma linha vertical.
 *
 * Análoga a drawHorizontalLine, mas garantindo X constante.
 */
export function drawVerticalLine(
  page: PDFPage,
  params: {
    from: Point;
    to: Point;
    thickness?: number;
    dashArray?: number[];
  },
): void {
  page.drawLine({
    start: { x: params.from.x, y: params.from.y },
    end: { x: params.from.x, y: params.to.y },
    thickness: params.thickness ?? STROKE_WIDTH.conductor,
    color: BLACK,
    dashArray: params.dashArray,
  });
}

/**
 * Desenha um caminho ortogonal em L ou em Z entre dois pontos.
 *
 * Conecta `from` a `to` usando apenas segmentos horizontais e verticais.
 * Se `horizontalFirst` é true (padrão), o caminho sai horizontal primeiro,
 * depois vertical. Caso contrário, vertical primeiro.
 *
 * Se `midpoint` for informado, usa ele como ponto de inflexão — útil para
 * rotear cabos em layouts com colunas definidas.
 */
export function drawOrthogonalPath(
  page: PDFPage,
  params: {
    from: Point;
    to: Point;
    horizontalFirst?: boolean;
    midpoint?: Point;
    thickness?: number;
    dashArray?: number[];
  },
): void {
  const thickness = params.thickness ?? STROKE_WIDTH.conductor;
  const dashArray = params.dashArray;

  if (params.midpoint) {
    page.drawLine({
      start: params.from,
      end: { x: params.midpoint.x, y: params.from.y },
      thickness,
      color: BLACK,
      dashArray,
    });
    page.drawLine({
      start: { x: params.midpoint.x, y: params.from.y },
      end: { x: params.midpoint.x, y: params.to.y },
      thickness,
      color: BLACK,
      dashArray,
    });
    page.drawLine({
      start: { x: params.midpoint.x, y: params.to.y },
      end: params.to,
      thickness,
      color: BLACK,
      dashArray,
    });
    return;
  }

  const horizontalFirst = params.horizontalFirst ?? true;
  const corner: Point = horizontalFirst
    ? { x: params.to.x, y: params.from.y }
    : { x: params.from.x, y: params.to.y };

  page.drawLine({
    start: params.from,
    end: corner,
    thickness,
    color: BLACK,
    dashArray,
  });
  page.drawLine({
    start: corner,
    end: params.to,
    thickness,
    color: BLACK,
    dashArray,
  });
}

/**
 * Desenha um retângulo sem preenchimento — usado como moldura ou container.
 */
export function drawBorder(
  page: PDFPage,
  rect: Rect,
  options?: {
    thickness?: number;
    dashArray?: number[];
  },
): void {
  page.drawRectangle({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    borderColor: BLACK,
    borderWidth: options?.thickness ?? STROKE_WIDTH.frame,
    borderDashArray: options?.dashArray,
  });
}

/**
 * Centro geométrico de um retângulo.
 */
export function rectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Ponto médio de uma aresta específica de um retângulo.
 * Útil para conectar cabos nas bordas de símbolos.
 */
export function edgeMidpoint(
  rect: Rect,
  edge: 'top' | 'right' | 'bottom' | 'left',
): Point {
  switch (edge) {
    case 'top':
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
    case 'bottom':
      return { x: rect.x + rect.width / 2, y: rect.y };
    case 'left':
      return { x: rect.x, y: rect.y + rect.height / 2 };
  }
}

/**
 * Divide um retângulo horizontalmente em N faixas de altura proporcional.
 * Retorna os retângulos resultantes, de baixo para cima (ordem do PDF).
 */
export function splitHorizontally(
  rect: Rect,
  proportions: number[],
): Rect[] {
  const total = proportions.reduce((sum, p) => sum + p, 0);
  const result: Rect[] = [];
  let cursorY = rect.y;

  for (const proportion of proportions) {
    const height = (rect.height * proportion) / total;
    result.push({
      x: rect.x,
      y: cursorY,
      width: rect.width,
      height,
    });
    cursorY += height;
  }

  return result;
}

/**
 * Divide um retângulo verticalmente em N colunas de largura proporcional.
 * Retorna os retângulos resultantes, da esquerda para a direita.
 */
export function splitVertically(
  rect: Rect,
  proportions: number[],
): Rect[] {
  const total = proportions.reduce((sum, p) => sum + p, 0);
  const result: Rect[] = [];
  let cursorX = rect.x;

  for (const proportion of proportions) {
    const width = (rect.width * proportion) / total;
    result.push({
      x: cursorX,
      y: rect.y,
      width,
      height: rect.height,
    });
    cursorX += width;
  }

  return result;
}

/**
 * Reduz um retângulo em um valor de inset uniforme (encolhe por dentro).
 * Útil para criar áreas de conteúdo dentro de containers.
 */
export function insetRect(rect: Rect, inset: number): Rect {
  return {
    x: rect.x + inset,
    y: rect.y + inset,
    width: rect.width - 2 * inset,
    height: rect.height - 2 * inset,
  };
}
