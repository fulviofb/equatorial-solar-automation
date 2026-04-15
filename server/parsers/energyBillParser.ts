import { invokeLLM } from '../_core/llm';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const execAsync = promisify(exec);

export interface EnergyBillData {
  // Dados do cliente
  name?: string;
  cpfCnpj?: string;
  address?: string;
  neighborhood?: string;
  cep?: string;
  city?: string;
  state?: string;
  // Dados da UC
  accountContract?: string;
  connectionType?: string;   // MONOFÁSICO | BIFÁSICO | TRIFÁSICO
  serviceVoltage?: string;   // ex: "380"
  consumptionClass?: string; // ex: "Residencial"
}

/**
 * Extrai texto da conta de energia usando a mesma cadeia de pdftotext → pdf-parse
 */
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const tempId = randomBytes(16).toString('hex');
  const tempPdfPath = join(tmpdir(), `bill-${tempId}.pdf`);

  try {
    await writeFile(tempPdfPath, pdfBuffer);
    try {
      const { stdout } = await execAsync(`pdftotext "${tempPdfPath}" -`);
      if (stdout && stdout.trim().length > 50) {
        console.log(`[Bill Parser] Texto extraído via pdftotext (${stdout.length} chars)`);
        return stdout;
      }
    } catch (_) { /* pdftotext indisponível */ }
  } finally {
    try { await unlink(tempPdfPath); } catch (_) { /* ignorar */ }
  }

  // Fallback: pdf-parse com import dinâmico
  console.log('[Bill Parser] Usando pdf-parse para extração de texto');
  const pdfParse = await import('pdf-parse/lib/pdf-parse.js' as any);
  const fn = pdfParse.default || pdfParse;
  const result = await fn(pdfBuffer, { max: 0 });
  const text = result.text || '';
  console.log(`[Bill Parser] Texto extraído via pdf-parse (${text.length} chars)`);
  if (text.trim().length < 50) throw new Error('Não foi possível extrair texto da conta de energia.');
  return text;
}

/**
 * Analisa a conta de energia e retorna os dados extraídos do cliente e da UC.
 */
export async function parseEnergyBill(pdfBuffer: Buffer): Promise<EnergyBillData> {
  const text = await extractPdfText(pdfBuffer);

  const schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nome completo ou razão social do titular da conta. Ex: "WAGNER NOGUEIRA DA SILVA"',
      },
      cpfCnpj: {
        type: 'string',
        description: 'CPF ou CNPJ do titular. Retornar com pontuação original. Ex: "324.155.161-04"',
      },
      address: {
        type: 'string',
        description: 'Endereço completo sem bairro, sem CEP, sem cidade. Ex: "AVENIDA DAS AMENDOEIRAS, Q. 16, L. 2, S/N"',
      },
      neighborhood: {
        type: 'string',
        description: 'Bairro / loteamento / setor. Ex: "LOTEAMENTO ECOLOGICO VALE DAS PALMEIRAS"',
      },
      cep: {
        type: 'string',
        description: 'CEP sem traço. Ex: "75240000"',
      },
      city: {
        type: 'string',
        description: 'Município. Ex: "BELA VISTA DE GOIAS"',
      },
      state: {
        type: 'string',
        description: 'UF com 2 letras. Ex: "GO"',
      },
      accountContract: {
        type: 'string',
        description: 'Número da Unidade Consumidora / conta contrato. Ex: "10032116096"',
      },
      connectionType: {
        type: 'string',
        description: 'Tipo de fornecimento: "MONOFÁSICO", "BIFÁSICO" ou "TRIFÁSICO". Extrair do campo "Tipo de fornecimento" da conta.',
      },
      serviceVoltage: {
        type: 'string',
        description: 'Tensão nominal em Volts, somente o número. Ex: "380" de "Tensão Nominal Disp: 380 V"',
      },
      consumptionClass: {
        type: 'string',
        description: 'Classe de consumo. Mapear para: "Residencial", "Industrial", "Comércio, serviços e outras atividades", "Rural", "Poder Público", "Iluminação Pública" ou "Serviço Público". Extrair de "Classificação" na conta.',
      },
    },
    required: [],
    additionalProperties: false,
  };

  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: `Você é um assistente de extração de dados de contas de energia elétrica brasileiras (Equatorial, CEMIG, CPFL, Enel, Neoenergia, etc.).
Extraia apenas os campos solicitados. Se um campo não for encontrado, omita-o.
Para CEP: retorne apenas os 8 dígitos sem traço.
Para UF: retorne apenas as 2 letras maiúsculas.
Para tensão: retorne apenas o número sem unidade.
Para tipo de fornecimento: retorne "MONOFÁSICO", "BIFÁSICO" ou "TRIFÁSICO".
Para classe de consumo: mapeie para uma das opções válidas fornecidas.`,
      },
      {
        role: 'user',
        content: `Extraia os dados do titular e da unidade consumidora desta conta de energia:\n\n${text.substring(0, 6000)}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'energy_bill_data',
        strict: true,
        schema,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Sem resposta do LLM ao processar conta de energia.');

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const parsed: EnergyBillData = JSON.parse(contentStr);

  console.log('[Bill Parser] Dados extraídos:', JSON.stringify(parsed, null, 2));
  return parsed;
}
