import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { invokeLLM } from '../_core/llm';

const execAsync = promisify(exec);

/**
 * Interface para dados extraídos de datasheet de módulo fotovoltaico
 */
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

/**
 * Interface para dados extraídos de datasheet de inversor
 */
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
 * Extrai texto de PDF usando pdftotext (desenvolvimento) ou fallback para LLM (produção)
 */
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const tempId = randomBytes(16).toString('hex');
  const tempPdfPath = join(tmpdir(), `pdf-${tempId}.pdf`);
  
  try {
    // Salvar buffer em arquivo temporário
    await writeFile(tempPdfPath, pdfBuffer);
    
    // Tentar usar pdftotext (disponível em desenvolvimento)
    try {
      const { stdout } = await execAsync(`pdftotext "${tempPdfPath}" -`);
      return stdout;
    } catch (pdfError) {
      // pdftotext não disponível, usar LLM como fallback
      console.log('[Datasheet Parser] pdftotext not available, using LLM fallback');
      
      // Converter PDF para base64 para enviar ao LLM
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
                  mime_type: 'application/pdf'
                }
              },
              {
                type: 'text',
                text: 'Extract all text content from this PDF datasheet. Return only the raw text, no formatting or analysis.'
              }
            ] as any
          }
        ]
      });
      
      const content = response.choices[0]?.message?.content;
      return typeof content === 'string' ? content : '';
    }
  } finally {
    // Limpar arquivo temporário
    try {
      await unlink(tempPdfPath);
    } catch (e) {
      // Ignorar erro de limpeza
    }
  }
}

/**
 * Extrai dados de datasheet usando LLM com JSON schema
 */
async function extractDataWithLLM(text: string, type: 'module' | 'inverter'): Promise<any> {
  const schema = type === 'module' ? {
    type: 'object',
    properties: {
      manufacturer: { type: 'string', description: 'Fabricante do módulo' },
      model: { type: 'string', description: 'Modelo do módulo' },
      nominalPower: { type: 'integer', description: 'Potência nominal em Watts' },
      voc: { type: 'string', description: 'Tensão de circuito aberto (Voc) em Volts' },
      isc: { type: 'string', description: 'Corrente de curto-circuito (Isc) em Amperes' },
      vmpp: { type: 'string', description: 'Tensão no ponto de máxima potência (Vmpp) em Volts' },
      impp: { type: 'string', description: 'Corrente no ponto de máxima potência (Impp) em Amperes' },
      efficiency: { type: 'string', description: 'Eficiência do módulo em porcentagem' },
      length: { type: 'string', description: 'Comprimento em mm' },
      width: { type: 'string', description: 'Largura em mm' },
      weight: { type: 'string', description: 'Peso em kg' },
    },
    required: [],
    additionalProperties: false
  } : {
    type: 'object',
    properties: {
      manufacturer: { type: 'string', description: 'Fabricante do inversor' },
      model: { type: 'string', description: 'Modelo do inversor' },
      nominalPowerAC: { type: 'integer', description: 'Potência nominal AC em Watts' },
      nominalPowerDC: { type: 'integer', description: 'Potência nominal DC em Watts' },
      maxPowerDC: { type: 'integer', description: 'Potência máxima DC em Watts' },
      maxVoltageDC: { type: 'string', description: 'Tensão máxima de entrada DC em Volts' },
      maxCurrentDC: { type: 'string', description: 'Corrente de curto-circuito em Amperes' },
      mpptVoltageMax: { type: 'string', description: 'Tensão máxima da faixa MPPT em Volts' },
      mpptVoltageMin: { type: 'string', description: 'Tensão mínima da faixa MPPT em Volts' },
      startupVoltageDC: { type: 'string', description: 'Tensão de partida em Volts' },
      numberOfMppt: { type: 'integer', description: 'Quantidade de MPPTs' },
      numberOfStrings: { type: 'integer', description: 'Quantidade de entradas/strings CC' },
      nominalVoltageAC: { type: 'string', description: 'Tensão nominal AC em Volts' },
      nominalFrequency: { type: 'string', description: 'Frequência nominal em Hz' },
      maxCurrentAC: { type: 'string', description: 'Corrente máxima AC em Amperes' },
      powerFactor: { type: 'string', description: 'Fator de potência' },
      thdCurrent: { type: 'string', description: 'THD de corrente em porcentagem' },
      maxEfficiency: { type: 'string', description: 'Eficiência máxima em porcentagem' },
      euEfficiency: { type: 'string', description: 'Eficiência EU em porcentagem' },
      mpptEfficiency: { type: 'string', description: 'Eficiência MPPT em porcentagem' },
    },
    required: [],
    additionalProperties: false
  };

  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: `You are a technical data extraction assistant. Extract specifications from solar equipment datasheets.
Return ONLY the requested fields. If a field is not found, omit it from the response.
For numeric fields with units, extract only the number without the unit symbol.`
      },
      {
        role: 'user',
        content: `Extract technical specifications from this ${type === 'module' ? 'solar module' : 'inverter'} datasheet text:\n\n${text.substring(0, 8000)}`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: `${type}_specs`,
        strict: true,
        schema
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from LLM');
  }

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  return JSON.parse(contentStr);
}

/**
 * Detecta automaticamente o tipo de datasheet e extrai os dados
 */
export async function parseDatasheet(pdfBuffer: Buffer): Promise<{ type: 'module' | 'inverter'; data: any }> {
  try {
    // Extrair texto do PDF
    const text = await extractPdfText(pdfBuffer);
    
    if (!text || text.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do PDF');
    }

    // Detectar tipo baseado em palavras-chave
    const textLower = text.toLowerCase();
    const isModule = /(?:solar panel|photovoltaic module|módulo fotovoltaico|painel solar|solar cell)/i.test(text);
    const isInverter = /(?:inverter|inversor|mppt|grid.?tied|string inverter|micro.?inverter)/i.test(text);

    let type: 'module' | 'inverter';
    if (isModule && !isInverter) {
      type = 'module';
    } else if (isInverter) {
      type = 'inverter';
    } else {
      throw new Error('Não foi possível identificar o tipo de datasheet (módulo ou inversor)');
    }

    // Extrair dados usando LLM
    const data = await extractDataWithLLM(text, type);

    return { type, data };
  } catch (error) {
    console.error('Erro ao processar datasheet:', error);
    throw new Error(`Erro ao processar datasheet: ${error instanceof Error ? error.message : String(error)}`);
  }
}
