/**
 * Conversões de unidades e constantes de página para o gerador de PDF.
 *
 * O pdf-lib trabalha nativamente em pontos (pt). Este módulo centraliza as
 * conversões entre mm (unidade natural de projetos elétricos) e pt, além
 * de constantes dimensionais de páginas A4 e A3.
 *
 * Regra fundamental: 1 polegada = 72 pt = 25.4 mm.
 * Portanto: 1 mm = 72/25.4 pt ≈ 2.8346 pt.
 */

/** Fator de conversão de milímetros para pontos do PDF. */
export const MM_TO_PT = 72 / 25.4;

/** Converte milímetros para pontos. */
export function mm(value: number): number {
  return value * MM_TO_PT;
}

/** Converte pontos para milímetros (útil para logging e debug). */
export function ptToMm(value: number): number {
  return value / MM_TO_PT;
}

/**
 * Dimensões padrão de página em pontos.
 *
 * A4 paisagem: 297 × 210 mm = 841.89 × 595.28 pt
 * A3 paisagem: 420 × 297 mm = 1190.55 × 841.89 pt
 *
 * A NT.00020.EQTL seção 5.12.1(a) aceita A0 a A4 em PDF. A3 paisagem é o
 * padrão de mercado para diagramas unifilares de microgeração e oferece
 * espaço adequado para todos os elementos exigidos pela seção 5.12.2(c)
 * sem comprometer a legibilidade.
 */
export const PAGE_SIZE = {
  A4_LANDSCAPE: { width: mm(297), height: mm(210) },
  A4_PORTRAIT: { width: mm(210), height: mm(297) },
  A3_LANDSCAPE: { width: mm(420), height: mm(297) },
  A3_PORTRAIT: { width: mm(297), height: mm(420) },
} as const;

/** Tamanho de página padrão para diagramas unifilares. */
export const DEFAULT_PAGE_SIZE = PAGE_SIZE.A3_LANDSCAPE;

/** Margens técnicas padrão em mm, em torno do conteúdo da prancha. */
export const PAGE_MARGIN_MM = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
} as const;

/** Grid técnico base em milímetros. Usado para alinhamento geral. */
export const GRID_MM = 5;

/** Grid técnico em pontos. */
export const GRID_PT = mm(GRID_MM);

/**
 * Tamanhos de fonte padronizados para todos os elementos da prancha.
 * Valores em pontos. Helvetica embedado no pdf-lib.
 */
export const FONT_SIZE = {
  /** Título principal da prancha. */
  title: 12,
  /** Subtítulos e rótulos de regiões. */
  subtitle: 10,
  /** Texto corrente — notas, legendas, carimbo. */
  body: 8,
  /** Anotações técnicas — bitolas de cabo, dimensões. */
  annotation: 7,
  /** Textos pequenos — rodapé, identificações de equipamento. */
  small: 6,
} as const;

/** Espessuras de linha padronizadas em pontos. */
export const STROKE_WIDTH = {
  /** Moldura externa e divisões principais. */
  frame: 1.5,
  /** Condutores principais do diagrama. */
  conductor: 1.0,
  /** Linhas auxiliares, leaders, dimensões. */
  auxiliary: 0.5,
  /** Linhas tracejadas de agrupamentos (stringbox, QGDC). */
  dashed: 0.75,
} as const;
