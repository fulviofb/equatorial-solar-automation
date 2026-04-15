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
 * Detecta o tipo de datasheet (módulo ou inversor) com base em sistema de pontuação.
 * Cobre português e inglês, incluindo microinversores (Tsuness, Hoymiles, APsystems etc.).
 */
function detectDatasheetType(text: string): 'module' | 'inverter' | null {
  const inverterSignals = [
    /microinversor/i,
    /micro\s*inversor/i,
    /sa[ií]da\s*\[?ca\]?/i,
    /entrada\s*\[?cc\]?/i,
    /pot[eê]ncia\s*(m[aá]xima\s*)?nominal\s*de\s*sa[ií]da/i,
    /corrente\s*m[aá]xima\s*de\s*sa[ií]da/i,
    /tens[aã]o\s*nominal\s*de\s*sa[ií]da/i,
    /tens[aã]o\s*m[aá]xima\s*de\s*entrada/i,
    /faixa\s*de\s*tens[aã]o\s*mppt/i,
    /tens[aã]o\s*de\s*partida/i,
    /distors[aã]o\s*harm[oô]nica/i,
    /efici[eê]ncia\s*eu/i,
    /efici[eê]ncia\s*(m[aá]xima\s*)?do\s*inversor/i,
    /quantidade\s*de\s*mppts?/i,
    /quantidade\s*de\s*entradas\s*cc/i,
    /inverter/i,
    /inversor/i,
    /grid.?tied/i,
    /string\s*inverter/i,
    /micro.?inverter/i,
    /mppt/i,
  ];

  const moduleSignals = [
    /m[oó]dulo\s*fotovoltaico/i,
    /solar\s*module/i,
    /painel\s*solar/i,
    /pot[eê]ncia\s*de\s*pico/i,
    /tens[aã]o\s*de\s*circuito\s*aberto/i,
    /corrente\s*de\s*curto.?circuito/i,
    /tens[aã]o\s*(de|no)\s*(m[aá]xima|ponto)/i,
    /efici[eê]ncia\s*(do\s*m[oó]dulo|solar)/i,
    /c[eé]lulas?\s*fotovoltaicas?/i,
    /voc\s*[([\[]/i,
    /isc\s*[([\[]/i,
    /vmpp\s*[([\[]/i,
    /impp\s*[([\[]/i,
    /solar\s*panel/i,
    /photovoltaic\s*module/i,
    /solar\s*cell/i,
    /open.?circuit\s*voltage/i,
    /short.?circuit\s*current/i,
    /maximum\s*power\s*(output|voltage|current)/i,
    /bifacial/i,
    /half.?cell/i,
    /module\s*(efficiency|weight|dimensions)/i,
    /hjt|perc|topcon/i,
  ];

  const inverterScore = inverterSignals.filter(r => r.test(text)).length;
  const moduleScore   = moduleSignals.filter(r => r.test(text)).length;

  console.log(`[Datasheet Parser] Scores — inversor: ${inverterScore}, módulo: ${moduleScore}`);

  if (inverterScore === 0 && moduleScore === 0) return null;
  if (inverterScore > moduleScore) return 'inverter';
  if (moduleScore > inverterScore) return 'module';

  // Empate: microinversor tem precedência
  if (/microinversor|sa[ií]da\s*\[?ca\]?/i.test(text)) return 'inverter';

  return null;
}

/**
 * Pós-processa os dados extraídos do módulo:
 * - Remove tolerâncias de dimensões: "2384(±2)" → "2384"
 * - Calcula área se não informada: comprimento × largura (convertido de mm para m²)
 * - Remove unidades residuais dos campos numéricos
 */
function postProcessModuleData(data: any): any {
  const clean = (val: string | undefined): string | undefined => {
    if (!val) return val;
    // Remove tolerâncias tipo "(±2)", "(+5/-0)", "±2"
    let v = String(val).replace(/\s*\(±[\d.]+\)/g, '').replace(/±[\d.]+/g, '').trim();
    // Remove unidades residuais comuns
    v = v.replace(/\s*(mm|m²|kg|w|v|a|%)\s*$/i, '').trim();
    // Se ficou com múltiplos valores separados por "/" ou "~", pegar o primeiro
    if (v.includes('/')) v = v.split('/')[0].trim();
    return v;
  };

  const result = { ...data };

  // Limpar campos numéricos
  for (const key of ['voc', 'isc', 'vmpp', 'impp', 'efficiency', 'length', 'width', 'weight']) {
    if (result[key]) result[key] = clean(result[key]);
  }

  // Calcular área se não vier do datasheet (módulos raramente listam área diretamente)
  if (!result.area && result.length && result.width) {
    const l = parseFloat(result.length);
    const w = parseFloat(result.width);
    if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
      // Dimensões em mm → m²
      const area = (l / 1000) * (w / 1000);
      result.area = area.toFixed(3);
      console.log(`[Datasheet Parser] Área calculada: ${l}mm × ${w}mm = ${result.area} m²`);
    }
  }

  return result;
}

/**
 * Extrai dados de datasheet usando LLM com JSON schema
 */
async function extractDataWithLLM(text: string, type: 'module' | 'inverter'): Promise<any> {
  const schema = type === 'module' ? {
    type: 'object',
    properties: {
      manufacturer: {
        type: 'string',
        description: 'Company name / fabricante. Ex: "ERA Solar", "Canadian Solar", "Jinko Solar"',
      },
      model: {
        type: 'string',
        description: 'Exact model code / código do modelo. Ex: "ERA-HJT-66HD-730M", "CS3W-450P". If the datasheet lists multiple power variants (700W, 705W ... 730W), pick the highest power model.',
      },
      nominalPower: {
        type: 'integer',
        description: 'Maximum power / Potência máxima em Watts (STC). Integer only, no units. If the datasheet lists multiple models, use the highest Wp value (e.g. 730, not 700).',
      },
      voc: {
        type: 'string',
        description: 'Open circuit voltage / Tensão Voc in Volts. Number only (e.g. "49.55"). Use STC values. If multiple models listed, use the value for the highest Wp model.',
      },
      isc: {
        type: 'string',
        description: 'Short circuit current / Corrente Isc in Amperes. Number only (e.g. "18.65"). Use STC values. If multiple models listed, use the value for the highest Wp model.',
      },
      vmpp: {
        type: 'string',
        description: 'Maximum power voltage / Tensão Vmpp in Volts. Number only (e.g. "41.36"). Use STC values. If multiple models listed, use the value for the highest Wp model.',
      },
      impp: {
        type: 'string',
        description: 'Maximum power current / Corrente Impp in Amperes. Number only (e.g. "17.65"). Use STC values. If multiple models listed, use the value for the highest Wp model.',
      },
      efficiency: {
        type: 'string',
        description: 'Module efficiency / Eficiência do módulo in %. Number only without % sign (e.g. "23.52"). If multiple models, use the highest Wp value.',
      },
      length: {
        type: 'string',
        description: 'Module length / Comprimento in mm. Number only, no tolerances (e.g. "2384" not "2384(±2)"). Usually the larger dimension.',
      },
      width: {
        type: 'string',
        description: 'Module width / Largura in mm. Number only, no tolerances (e.g. "1303" not "1303(±2)"). Usually the smaller dimension.',
      },
      weight: {
        type: 'string',
        description: 'Module weight / Peso in kg. Number only (e.g. "32.5"). If multiple values listed (e.g. "32.5 / 33.5 / 34.5"), use the first/lightest value.',
      },
    },
    required: [],
    additionalProperties: false,
  } : {
    type: 'object',
    properties: {
      manufacturer: { type: 'string', description: 'Fabricante do inversor' },
      model: { type: 'string', description: 'Modelo exato do inversor (ex: TSOL-MX3000D). Se houver múltiplos modelos, usar o do título ou o mais proeminente.' },
      nominalPowerAC: { type: 'integer', description: 'Potência nominal AC em Watts — "Potência Máxima Nominal de Saída" / "Maximum Output Power" (apenas o número). Para microinversores, é a potência de SAÍDA CA, não a de entrada CC.' },
      nominalPowerDC: { type: 'integer', description: 'Potência nominal DC de entrada em Watts (apenas o número)' },
      maxPowerDC: { type: 'integer', description: 'Potência máxima DC em Watts (apenas o número)' },
      maxVoltageDC: { type: 'string', description: 'Tensão máxima de entrada DC em Volts (apenas o número)' },
      maxCurrentDC: { type: 'string', description: 'Corrente de curto-circuito / máxima de entrada em Amperes (apenas o número)' },
      mpptVoltageMax: { type: 'string', description: 'Tensão máxima da faixa MPPT em Volts (parte superior do range, ex: "60" de "16~60")' },
      mpptVoltageMin: { type: 'string', description: 'Tensão mínima da faixa MPPT em Volts (parte inferior do range, ex: "16" de "16~60")' },
      startupVoltageDC: { type: 'string', description: 'Tensão de partida em Volts (apenas o número)' },
      numberOfMppt: { type: 'integer', description: 'Quantidade de MPPTs' },
      numberOfStrings: { type: 'integer', description: 'Quantidade de entradas CC / strings' },
      nominalVoltageAC: { type: 'string', description: 'Tensão nominal de saída AC em Volts (ex: "220")' },
      nominalFrequency: { type: 'string', description: 'Frequência nominal em Hz (apenas o número)' },
      maxCurrentAC: { type: 'string', description: 'Corrente máxima de saída CA em Amperes (apenas o número)' },
      powerFactor: { type: 'string', description: 'Fator de potência (ex: ">0.99")' },
      thdCurrent: { type: 'string', description: 'THD de corrente (ex: "<3%")' },
      maxEfficiency: { type: 'string', description: 'Eficiência máxima em % (apenas o número, sem %)' },
      euEfficiency: { type: 'string', description: 'Eficiência EU em % (apenas o número, sem %)' },
      mpptEfficiency: { type: 'string', description: 'Eficiência MPPT em % (apenas o número, sem %)' },
    },
    required: [],
    additionalProperties: false,
  };

  const typeLabel = type === 'module' ? 'solar photovoltaic module' : 'solar inverter / microinverter';

  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: `You are a precise technical data extraction assistant for solar equipment datasheets (Portuguese and English).
Rules:
- Extract ONLY the requested fields. Omit fields not found.
- For numeric fields, return ONLY the number — no units, no tolerances, no symbols.
- If a datasheet has a table with multiple power variants (e.g. 700W, 705W ... 730W), always extract data for the HIGHEST power model in the range.
- Strip tolerances from dimensions: "2384(±2)" → "2384".
- For weight with multiple values (e.g. "32.5 / 33.5 / 34.5"), use the first value.
- For microinverters: nominalPowerAC = AC output power (not DC input).`,
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
  let parsed = JSON.parse(contentStr);

  // Pós-processamento específico para módulos
  if (type === 'module') {
    parsed = postProcessModuleData(parsed);
  }

  return parsed;
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
      console.error('[Datasheet Parser] Nenhuma palavra-chave reconhecida. Trecho:', text.substring(0, 500));
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
