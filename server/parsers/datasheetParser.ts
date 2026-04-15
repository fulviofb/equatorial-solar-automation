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
 * Extrai texto de PDF usando a seguinte cadeia de fallbacks:
 * 1. pdftotext (binário — disponível em dev)
 * 2. pdf-parse (biblioteca JS — usa import dinâmico para evitar o bug do require no top-level)
 *
 * Nota: o import dinâmico de pdf-parse contorna o ENOENT que ocorria quando
 * o módulo era importado no top-level e tentava ler arquivos de teste na inicialização.
 */
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const tempId = randomBytes(16).toString('hex');
  const tempPdfPath = join(tmpdir(), `pdf-${tempId}.pdf`);

  // ── 1. Tentar pdftotext ──────────────────────────────────────────────────
  try {
    await writeFile(tempPdfPath, pdfBuffer);
    try {
      const { stdout } = await execAsync(`pdftotext "${tempPdfPath}" -`);
      if (stdout && stdout.trim().length > 50) {
        console.log(`[Datasheet Parser] Texto extraído via pdftotext (${stdout.length} chars)`);
        return stdout;
      }
    } catch (_) {
      // pdftotext não disponível
    }
  } finally {
    try { await unlink(tempPdfPath); } catch (_) { /* ignorar */ }
  }

  // ── 2. Usar pdf-parse via import dinâmico ─────────────────────────────────
  // O import dinâmico evita que pdf-parse tente ler arquivos de teste na
  // inicialização do servidor (o que causava o erro ENOENT em produção).
  try {
    console.log('[Datasheet Parser] Usando pdf-parse para extração de texto');

    // Import dinâmico — só executa quando necessário, não no carregamento do módulo
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js' as any);
    const fn = pdfParse.default || pdfParse;

    const result = await fn(pdfBuffer, {
      // Desabilitar renderização de página (não precisamos do layout, só do texto)
      max: 0,
    });

    const text = result.text || '';
    console.log(`[Datasheet Parser] Texto extraído via pdf-parse (${text.length} chars)`);

    if (text.trim().length > 50) {
      return text;
    }

    throw new Error('pdf-parse retornou texto insuficiente');

  } catch (parseError) {
    console.error('[Datasheet Parser] pdf-parse falhou:', parseError);
    throw new Error(
      'Não foi possível extrair texto do PDF. ' +
      'Verifique se o arquivo é um PDF válido e contém texto pesquisável (não é imagem escaneada).'
    );
  }
}

/**
 * Detecta o tipo de datasheet (módulo ou inversor) por sistema de pontuação.
 * Cobre português e inglês, incluindo microinversores brasileiros.
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

  if (/microinversor|sa[ií]da\s*\[?ca\]?/i.test(text)) return 'inverter';
  return null;
}

/**
 * Pós-processamento dos dados de módulo:
 * - Remove tolerâncias: "2384(±2)" → "2384"
 * - Remove unidades residuais
 * - Calcula área a partir de comprimento × largura (mm → m²)
 */
function postProcessModuleData(data: any): any {
  const clean = (val: string | undefined): string | undefined => {
    if (!val) return val;
    let v = String(val).replace(/\s*\(±[\d.]+\)/g, '').replace(/±[\d.]+/g, '').trim();
    v = v.replace(/\s*(mm|m²|kg|w|v|a|%)\s*$/i, '').trim();
    if (v.includes('/')) v = v.split('/')[0].trim();
    return v;
  };

  const result = { ...data };
  for (const key of ['voc', 'isc', 'vmpp', 'impp', 'efficiency', 'length', 'width', 'weight']) {
    if (result[key]) result[key] = clean(result[key]);
  }

  if (!result.area && result.length && result.width) {
    const l = parseFloat(result.length);
    const w = parseFloat(result.width);
    if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
      result.area = ((l / 1000) * (w / 1000)).toFixed(3);
      console.log(`[Datasheet Parser] Área calculada: ${l}mm × ${w}mm = ${result.area} m²`);
    }
  }

  return result;
}

async function extractDataWithLLM(text: string, type: 'module' | 'inverter'): Promise<any> {
  const schema = type === 'module' ? {
    type: 'object',
    properties: {
      manufacturer: { type: 'string', description: 'Company name / fabricante. Ex: "ERA Solar", "Canadian Solar"' },
      model: { type: 'string', description: 'Exact model code. If multiple power variants (700W...730W), pick the highest. Ex: "ERA-HJT-66HD-730M"' },
      nominalPower: { type: 'integer', description: 'Maximum power in Watts (STC). If multiple models, use the highest Wp (e.g. 730).' },
      voc: { type: 'string', description: 'Open circuit voltage Voc in Volts, STC, number only (e.g. "49.55"). Highest Wp model.' },
      isc: { type: 'string', description: 'Short circuit current Isc in Amperes, STC, number only (e.g. "18.65"). Highest Wp model.' },
      vmpp: { type: 'string', description: 'Max power voltage Vmpp in Volts, STC, number only (e.g. "41.36"). Highest Wp model.' },
      impp: { type: 'string', description: 'Max power current Impp in Amperes, STC, number only (e.g. "17.65"). Highest Wp model.' },
      efficiency: { type: 'string', description: 'Module efficiency in %, number only without % (e.g. "23.52"). Highest Wp model.' },
      length: { type: 'string', description: 'Module length in mm, number only, no tolerances (e.g. "2384"). Larger dimension.' },
      width: { type: 'string', description: 'Module width in mm, number only, no tolerances (e.g. "1303"). Smaller dimension.' },
      weight: { type: 'string', description: 'Module weight in kg, number only (e.g. "32.5"). If multiple values, use first.' },
    },
    required: [],
    additionalProperties: false,
  } : {
    type: 'object',
    properties: {
      manufacturer: { type: 'string', description: 'Fabricante do inversor' },
      model: { type: 'string', description: 'Modelo exato. Se múltiplos modelos, usar o do título (ex: TSOL-MX3000D).' },
      nominalPowerAC: { type: 'integer', description: 'Potência nominal AC em Watts — saída CA. Para microinversores: potência de SAÍDA, não de entrada DC.' },
      nominalPowerDC: { type: 'integer', description: 'Potência nominal DC de entrada em Watts' },
      maxPowerDC: { type: 'integer', description: 'Potência máxima DC em Watts' },
      maxVoltageDC: { type: 'string', description: 'Tensão máxima de entrada DC em Volts (número apenas)' },
      maxCurrentDC: { type: 'string', description: 'Corrente de curto-circuito / máxima de entrada em Amperes (número apenas)' },
      mpptVoltageMax: { type: 'string', description: 'Tensão máxima MPPT em Volts (ex: "60" de "16~60")' },
      mpptVoltageMin: { type: 'string', description: 'Tensão mínima MPPT em Volts (ex: "16" de "16~60")' },
      startupVoltageDC: { type: 'string', description: 'Tensão de partida em Volts' },
      numberOfMppt: { type: 'integer', description: 'Quantidade de MPPTs' },
      numberOfStrings: { type: 'integer', description: 'Quantidade de entradas CC / strings' },
      nominalVoltageAC: { type: 'string', description: 'Tensão nominal de saída AC em Volts (ex: "220")' },
      nominalFrequency: { type: 'string', description: 'Frequência nominal em Hz' },
      maxCurrentAC: { type: 'string', description: 'Corrente máxima de saída CA em Amperes' },
      powerFactor: { type: 'string', description: 'Fator de potência (ex: ">0.99")' },
      thdCurrent: { type: 'string', description: 'THD de corrente (ex: "<3%")' },
      maxEfficiency: { type: 'string', description: 'Eficiência máxima em % (número sem %)' },
      euEfficiency: { type: 'string', description: 'Eficiência EU em % (número sem %)' },
      mpptEfficiency: { type: 'string', description: 'Eficiência MPPT em % (número sem %)' },
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
- If a datasheet has multiple power variants (e.g. 700W...730W), always use the HIGHEST power model.
- Strip tolerances: "2384(±2)" → "2384".
- For weight with multiple values (e.g. "32.5 / 33.5"), use the first.
- For microinverters: nominalPowerAC = AC output power (not DC input).
- Use STC values for module electrical parameters.`,
      },
      {
        role: 'user',
        content: `Extract technical specifications from this ${typeLabel} datasheet:\n\n${text.substring(0, 8000)}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: `${type}_specs`, strict: true, schema },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from LLM');

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  let parsed = JSON.parse(contentStr);

  if (type === 'module') parsed = postProcessModuleData(parsed);

  return parsed;
}

export async function parseDatasheet(pdfBuffer: Buffer): Promise<{ type: 'module' | 'inverter'; data: any }> {
  try {
    const text = await extractPdfText(pdfBuffer);

    if (!text || text.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do PDF.');
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
