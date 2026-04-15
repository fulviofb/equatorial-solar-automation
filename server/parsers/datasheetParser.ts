import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { invokeLLM } from '../_core/llm';

const execAsync = promisify(exec);

export interface ModuleDatasheetData {
  manufacturer?: string;
  model?: string;
  nominalPower?: number;
  voc?: string;
  isc?: string;
  vmpp?: string;
  impp?: string;
  efficiency?: string;
  length?: string;
  width?: string;
  area?: string;
  weight?: string;
}

export interface InverterDatasheetData {
  manufacturer?: string;
  model?: string;
  nominalPowerAC?: number;
  nominalPowerDC?: number;
  maxPowerDC?: number;
  maxVoltageDC?: string;
  maxCurrentDC?: string;
  mpptVoltageMax?: string;
  mpptVoltageMin?: string;
  startupVoltageDC?: string;
  numberOfMppt?: number;
  numberOfStrings?: number;
  nominalVoltageAC?: string;
  nominalFrequency?: string;
  maxCurrentAC?: string;
  powerFactor?: string;
  thdCurrent?: string;
  maxEfficiency?: string;
  euEfficiency?: string;
  mpptEfficiency?: string;
}

/**
 * Extrai texto de PDF usando pdftotext (dev) ou LLM com file_url (produção)
 */
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const tempId = randomBytes(16).toString('hex');
  const tempPdfPath = join(tmpdir(), `pdf-${tempId}.pdf`);

  try {
    await writeFile(tempPdfPath, pdfBuffer);

    try {
      const { stdout } = await execAsync(`pdftotext "${tempPdfPath}" -`);
      if (stdout && stdout.trim().length > 0) {
        return stdout;
      }
      throw new Error('pdftotext retornou texto vazio');
    } catch (_pdfError) {
      console.log('[Datasheet Parser] pdftotext não disponível, usando LLM com file_url');

      const base64Pdf = pdfBuffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

      const response = await invokeLLM({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'file_url',
                file_url: {
                  url: dataUrl,
                  mime_type: 'application/pdf',
                },
              },
              {
                type: 'text',
                text: 'Extraia todo o conteúdo textual deste datasheet PDF de equipamento solar fotovoltaico. Retorne apenas o texto bruto, sem formatação adicional ou análise.',
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (typeof content === 'string') return content;

      if (Array.isArray(content)) {
        return content
          .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
          .map(part => part.text)
          .join('\n');
      }

      return '';
    }
  } finally {
    try { await unlink(tempPdfPath); } catch (_) { /* ignorar */ }
  }
}

/**
 * Detecta o tipo de datasheet (módulo ou inversor) com base no texto extraído.
 *
 * Cobre textos em português e inglês, incluindo microinversores brasileiros
 * (ex: Tsuness, Hoymiles, APsystems) cujos datasheets usam "Microinversor",
 * "Saída [CA]", "Entrada [CC]", "Ficha Técnica" etc.
 */
function detectDatasheetType(text: string): 'module' | 'inverter' | null {
  // --- Sinais de INVERSOR (ordem de especificidade: mais específico primeiro) ---
  const inverterSignals = [
    // Português — microinversores e string
    /microinversor/i,
    /micro\s*inversor/i,
    /sa[ií]da\s*\[?ca\]?/i,          // "Saída [CA]" ou "Saída CA"
    /entrada\s*\[?cc\]?/i,            // "Entrada [CC]"
    /pot[eê]ncia\s*(m[aá]xima\s*)?nominal\s*de\s*sa[ií]da/i,
    /corrente\s*m[aá]xima\s*de\s*sa[ií]da/i,
    /tens[aã]o\s*nominal\s*de\s*sa[ií]da/i,
    /tens[aã]o\s*m[aá]xima\s*de\s*entrada/i,
    /faixa\s*de\s*tens[aã]o\s*mppt/i,
    /tens[aã]o\s*de\s*partida/i,
    /distors[aã]o\s*harm[oô]nica/i,   // "Distorção Harmônica de Corrente"
    /efici[eê]ncia\s*eu/i,
    /efici[eê]ncia\s*(m[aá]xima\s*)?do\s*inversor/i,
    /quantidade\s*de\s*mppts?/i,
    /quantidade\s*de\s*entradas\s*cc/i,
    // Inglês
    /inverter/i,
    /inversor/i,
    /grid.?tied/i,
    /string\s*inverter/i,
    /micro.?inverter/i,
    /mppt/i,
  ];

  // --- Sinais de MÓDULO FOTOVOLTAICO ---
  const moduleSignals = [
    // Português
    /m[oó]dulo\s*fotovoltaico/i,
    /painel\s*solar/i,
    /pot[eê]ncia\s*de\s*pico/i,
    /tens[aã]o\s*de\s*circuito\s*aberto/i,  // Voc
    /corrente\s*de\s*curto.?circuito/i,      // Isc
    /tens[aã]o\s*(de|no)\s*(m[aá]xima|ponto)/i, // Vmpp
    /efici[eê]ncia\s*(do\s*m[oó]dulo|solar)/i,
    /c[eé]lulas?\s*fotovoltaicas?/i,
    /voc\s*[(\[]/i,                          // "Voc [V]"
    /isc\s*[(\[]/i,                          // "Isc [A]"
    /vmpp\s*[(\[]/i,
    /impp\s*[(\[]/i,
    // Inglês
    /solar\s*panel/i,
    /photovoltaic\s*module/i,
    /solar\s*cell/i,
    /open.?circuit\s*voltage/i,
    /short.?circuit\s*current/i,
  ];

  const inverterScore = inverterSignals.filter(r => r.test(text)).length;
  const moduleScore   = moduleSignals.filter(r => r.test(text)).length;

  console.log(`[Datasheet Parser] Scores — inversor: ${inverterScore}, módulo: ${moduleScore}`);

  // Empate ou ambos zero: não identificado
  if (inverterScore === 0 && moduleScore === 0) return null;
  if (inverterScore > moduleScore) return 'inverter';
  if (moduleScore > inverterScore) return 'module';

  // Empate: presença de "Microinversor" ou "Saída [CA]" desempata para inversor
  if (/microinversor|sa[ií]da\s*\[?ca\]?/i.test(text)) return 'inverter';

  return null;
}

/**
 * Extrai dados de datasheet usando LLM com JSON schema
 */
async function extractDataWithLLM(text: string, type: 'module' | 'inverter'): Promise<any> {
  const schema = type === 'module' ? {
    type: 'object',
    properties: {
      manufacturer: { type: 'string', description: 'Fabricante do módulo' },
      model: { type: 'string', description: 'Modelo do módulo (código exato)' },
      nominalPower: { type: 'integer', description: 'Potência nominal em Watts (apenas o número)' },
      voc: { type: 'string', description: 'Tensão de circuito aberto Voc em Volts (apenas o número)' },
      isc: { type: 'string', description: 'Corrente de curto-circuito Isc em Amperes (apenas o número)' },
      vmpp: { type: 'string', description: 'Tensão no ponto de máxima potência Vmpp em Volts (apenas o número)' },
      impp: { type: 'string', description: 'Corrente no ponto de máxima potência Impp em Amperes (apenas o número)' },
      efficiency: { type: 'string', description: 'Eficiência em porcentagem (apenas o número, sem %)' },
      length: { type: 'string', description: 'Comprimento em mm (apenas o número)' },
      width: { type: 'string', description: 'Largura em mm (apenas o número)' },
      weight: { type: 'string', description: 'Peso em kg (apenas o número)' },
    },
    required: [],
    additionalProperties: false,
  } : {
    type: 'object',
    properties: {
      manufacturer: { type: 'string', description: 'Fabricante do inversor' },
      model: { type: 'string', description: 'Modelo exato do inversor (ex: TSOL-MX3000D)' },
      nominalPowerAC: { type: 'integer', description: 'Potência nominal AC em Watts — campo "Potência Máxima Nominal de Saída" ou equivalente (apenas o número)' },
      nominalPowerDC: { type: 'integer', description: 'Potência nominal DC em Watts — potência de entrada (apenas o número)' },
      maxPowerDC: { type: 'integer', description: 'Potência máxima DC em Watts (apenas o número)' },
      maxVoltageDC: { type: 'string', description: 'Tensão máxima de entrada DC em Volts — campo "Tensão Máxima de Entrada" (apenas o número)' },
      maxCurrentDC: { type: 'string', description: 'Corrente de curto-circuito em Amperes — campo "Corrente de Curto-circuito" (apenas o número)' },
      mpptVoltageMax: { type: 'string', description: 'Tensão máxima da faixa MPPT em Volts — campo "Faixa de Tensão MPPT" (parte superior, apenas o número)' },
      mpptVoltageMin: { type: 'string', description: 'Tensão mínima da faixa MPPT em Volts — campo "Faixa de Tensão MPPT" (parte inferior, apenas o número)' },
      startupVoltageDC: { type: 'string', description: 'Tensão de partida em Volts — campo "Tensão de Partida por Entrada" (apenas o número)' },
      numberOfMppt: { type: 'integer', description: 'Quantidade de MPPTs — campo "Quantidade de MPPTs"' },
      numberOfStrings: { type: 'integer', description: 'Quantidade de entradas CC — campo "Quantidade de Entradas CC"' },
      nominalVoltageAC: { type: 'string', description: 'Tensão nominal de saída AC em Volts — campo "Tensão Nominal de Saída" (ex: 220)' },
      nominalFrequency: { type: 'string', description: 'Frequência nominal em Hz (apenas o número)' },
      maxCurrentAC: { type: 'string', description: 'Corrente máxima de saída CA em Amperes — campo "Corrente Máxima de Saída" (apenas o número)' },
      powerFactor: { type: 'string', description: 'Fator de potência (ex: >0.99)' },
      thdCurrent: { type: 'string', description: 'THD de corrente (ex: <3%)' },
      maxEfficiency: { type: 'string', description: 'Eficiência máxima do inversor em % (apenas o número, sem %)' },
      euEfficiency: { type: 'string', description: 'Eficiência EU em % (apenas o número, sem %)' },
      mpptEfficiency: { type: 'string', description: 'Eficiência MPPT em % (apenas o número, sem %)' },
    },
    required: [],
    additionalProperties: false,
  };

  const typeLabel = type === 'module' ? 'solar module' : 'solar inverter / microinverter';
  const extraContext = type === 'inverter'
    ? '\nIMPORTANT: If the datasheet shows a table with multiple models, extract data for the model mentioned in the title or the most prominent model. For microinverters, "nominalPowerAC" is the AC output power (Saída CA), NOT the DC input power.'
    : '';

  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: `You are a technical data extraction assistant specializing in solar equipment datasheets (Portuguese and English).
Extract specifications accurately. Return ONLY the requested fields.
If a field is not found, omit it. For numeric fields, return ONLY the number without units.${extraContext}`,
      },
      {
        role: 'user',
        content: `Extract technical specifications from this ${typeLabel} datasheet:\n\n${text.substring(0, 8000)}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: `${type}_specs`,
        strict: true,
        schema,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from LLM');

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  return JSON.parse(contentStr);
}

/**
 * Detecta automaticamente o tipo de datasheet e extrai os dados
 */
export async function parseDatasheet(pdfBuffer: Buffer): Promise<{ type: 'module' | 'inverter'; data: any }> {
  try {
    const text = await extractPdfText(pdfBuffer);

    if (!text || text.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do PDF');
    }

    const type = detectDatasheetType(text);

    if (!type) {
      console.error('[Datasheet Parser] Nenhuma palavra-chave reconhecida. Trecho do texto:', text.substring(0, 500));
      throw new Error(
        'Não foi possível identificar se este é um datasheet de módulo ou inversor. ' +
        'Verifique se o PDF contém a ficha técnica do equipamento.'
      );
    }

    console.log(`[Datasheet Parser] Tipo identificado: ${type}`);
    const data = await extractDataWithLLM(text, type);

    return { type, data };
  } catch (error) {
    console.error('Erro ao processar datasheet:', error);
    throw new Error(`Erro ao processar datasheet: ${error instanceof Error ? error.message : String(error)}`);
  }
}
