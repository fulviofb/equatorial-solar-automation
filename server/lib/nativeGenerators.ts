import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ─── Configurações ────────────────────────────────────────────────────────────
const BASE_DIR = path.resolve(process.cwd(), 'server', 'resources', 'templates');
const TEMPLATE_WORD   = path.join(BASE_DIR, 'TEMPLATE_MEMORIAL_CLEAN.docx');
const TEMPLATE_EXCEL  = path.join(BASE_DIR, 'TEMPLATE_ANEXO_I.xlsx');
const OUTPUT_DIR_WORD  = path.join(BASE_DIR, 'Projetos_Gerados_Word');
const OUTPUT_DIR_EXCEL = path.join(BASE_DIR, 'Projetos_Gerados_Excel');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEstadoExtenso(uf: string): string {
  const estados: Record<string, string> = {
    GO: 'GOIÁS', SP: 'SÃO PAULO', MG: 'MINAS GERAIS', RJ: 'RIO DE JANEIRO',
    BA: 'BAHIA', PR: 'PARANÁ', RS: 'RIO GRANDE DO SUL', SC: 'SANTA CATARINA',
    PE: 'PERNAMBUCO', CE: 'CEARÁ', AM: 'AMAZONAS', PA: 'PARÁ',
    MT: 'MATO GROSSO', MS: 'MATO GROSSO DO SUL', DF: 'DISTRITO FEDERAL',
    ES: 'ESPÍRITO SANTO', MA: 'MARANHÃO', PB: 'PARAÍBA', RN: 'RIO GRANDE DO NORTE',
    AL: 'ALAGOAS', PI: 'PIAUÍ', SE: 'SERGIPE', RO: 'RONDÔNIA', TO: 'TOCANTINS',
    AC: 'ACRE', AP: 'AMAPÁ', RR: 'RORAIMA',
  };
  return estados[uf?.toUpperCase()] || uf;
}

function formatDataExtenso(): string {
  const raw = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return raw.toUpperCase().replace(' DE ', ' \u2013 ');
}

function gerarDescricaoSistema(modules: any[], inverters: any[]): string {
  const modDesc = modules.length > 0
    ? `${modules.reduce((acc, m) => acc + (m.qtd || 0), 0)} módulos ${modules[0].fabricante} de ${modules[0].potencia}W`
    : 'Sem módulos';
  const invDesc = inverters.length > 0
    ? `${inverters.reduce((acc, i) => acc + (i.qtd || 0), 0)} inversores ${inverters[0].fabricante} de ${inverters[0].potencia_nominal_kw}kW`
    : 'Sem inversores';
  return `${modDesc} ligados a ${invDesc}`;
}

/**
 * Escreve valor na célula mestre de uma região mesclada (ou diretamente se não for mesclada).
 * O template Equatorial tem muitas células mescladas; escrever em célula não-mestre é no-op.
 */
function setCellValue(ws: ExcelJS.Worksheet, cellRef: string, value: any) {
  const cell = ws.getCell(cellRef);
  if ((cell as any).isMerged && (cell as any).master) {
    (cell as any).master.value = value;
  } else {
    cell.value = value;
  }
}

export function consolidateItems(items: any[], type: 'module' | 'inverter'): any[] {
  const map = new Map<string, any>();
  items.forEach(item => {
    const key = type === 'module'
      ? `${item.fabricante}-${item.modelo}-${item.potencia}`
      : `${item.fabricante}-${item.modelo}-${item.potencia_nominal_kw}`;
    if (map.has(key)) {
      map.get(key)!.qtd += item.qtd || 1;
    } else {
      map.set(key, { ...item, qtd: item.qtd || 1 });
    }
  });
  return Array.from(map.values());
}

// ─── Geradores ────────────────────────────────────────────────────────────────

export const NativeGenerator = {

  // ── Excel ──────────────────────────────────────────────────────────────────

  async generateExcel(data: any): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      console.log(`[NativeGenerator] Gerando Excel para: ${data.nome_cliente}`);

      if (!fs.existsSync(TEMPLATE_EXCEL)) {
        throw new Error(`Template não encontrado: ${TEMPLATE_EXCEL}`);
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(TEMPLATE_EXCEL);

      // ATENÇÃO: O template tem 5 abas: ROTEIRO(0), 0(1), 1(2), 2(3), FONTES(4)
      // Portanto, devemos acessar pelo nome, não pelo índice!
      const ws0 = workbook.getWorksheet('0');
      const ws1 = workbook.getWorksheet('1');

      if (!ws0) throw new Error('Aba "0" não encontrada no template Excel');
      if (!ws1) throw new Error('Aba "1" não encontrada no template Excel');

      // ── ABA "0": Unidades Geradoras ────────────────────────────────────────
      //
      //  Linhas 7–16 = Módulos fotovoltaicos (até 10 itens)
      //    C  = Nº item
      //    D  = Potência do módulo (W)    [merged D:G]
      //    H  = Quantidade                [merged H:J]
      //    K  = Potência de pico (kWp)    [merged K:O]
      //    P  = Área do arranjo (m²)      [merged P:S]
      //    T  = Fabricante                [merged T:Z]
      //    AA = Modelo                    [merged AA:AE]
      //
      //  Linhas 22–51 = Inversores (até 30 itens)
      //    C  = Nº item
      //    D  = Fabricante                [merged D:G]
      //    H  = Modelo                    [merged H:K]
      //    L  = Potência nominal (kW)     [merged L:O]
      //    P  = Tensão nominal (V)        [merged P:S]
      //    T  = Corrente máx (A)          [merged T:V]
      //    W  = Fator de potência         [merged W:Y]
      //    Z  = Rendimento (%)            [merged Z:AB]
      //    AC = DHT (%)                   [merged AC:AE]

      // Módulos (linhas 7–16)
      if (Array.isArray(data.modules)) {
        data.modules.forEach((mod: any, idx: number) => {
          if (idx >= 10) return;
          const row = 7 + idx;
          const potW      = Number(mod.potencia || 0);
          const qtd       = Number(mod.qtd || 0);
          const totalKwp  = (potW * qtd) / 1000;
          const area      = Number(mod.area || 0);
          const totalArea = area * qtd;

          setCellValue(ws0, `C${row}`, idx + 1);
          setCellValue(ws0, `D${row}`, potW);
          setCellValue(ws0, `H${row}`, qtd);
          setCellValue(ws0, `K${row}`, totalKwp);
          setCellValue(ws0, `P${row}`, totalArea > 0 ? totalArea : null);
          setCellValue(ws0, `T${row}`, String(mod.fabricante || '').toUpperCase());
          setCellValue(ws0, `AA${row}`, String(mod.modelo || '').toUpperCase());
        });
      }

      // Inversores (linhas 22–51)
      if (Array.isArray(data.inverters)) {
        data.inverters.forEach((inv: any, idx: number) => {
          if (idx >= 30) return;
          const row   = 22 + idx;
          const potKw = Number(inv.potencia_nominal_kw || inv.potencia || 0);
          const tensao = Number(inv.tensao_ca_nominal || inv.tensao || 220);

          setCellValue(ws0, `C${row}`, idx + 1);
          setCellValue(ws0, `D${row}`, String(inv.fabricante || '').toUpperCase());
          setCellValue(ws0, `H${row}`, String(inv.modelo || '').toUpperCase());
          setCellValue(ws0, `L${row}`, potKw);
          setCellValue(ws0, `P${row}`, tensao);
          setCellValue(ws0, `T${row}`, inv.corrente_ca_max ? Number(inv.corrente_ca_max) : null);
          setCellValue(ws0, `W${row}`, inv.fator_potencia ? String(inv.fator_potencia) : '>0,99');
          setCellValue(ws0, `Z${row}`, inv.eficiencia_max ? Number(inv.eficiencia_max) : null);
          setCellValue(ws0, `AC${row}`, inv.thd ? String(inv.thd) : '<3%');
        });
      }

      // ── ABA "1": Dados Cadastrais ──────────────────────────────────────────
      //
      //  DADOS DO CLIENTE
      //    C10  = Nome do cliente
      //    R10  = CPF/CNPJ
      //    AC9  = RG
      //    C13  = Endereço completo
      //    D15  = CEP      I15 = Cidade     Q15 = UF
      //    V15  = E-mail   T13 = Celular
      //
      //  UNIDADE CONSUMIDORA
      //    Z17  = Conta contrato
      //    F27  = Tensão de atendimento     L27 = Tipo de ligação
      //    F29  = Carga declarada           P29 = Disjuntor
      //    F31  = Tipo ramal                H33 = Nº poste
      //    L33  = Coordenada X              T33 = Coordenada Y
      //
      //  GERAÇÃO DISTRIBUÍDA (seção 3)
      //    G49  = Fonte primária
      //    G51  = Tipo de geração
      //    I53  = Modalidade de compensação (enquadramento)
      //    AC53 = Potência de geração (kWp total módulos)
      //
      //  RESPONSÁVEL TÉCNICO
      //    C38 = Nome       M38 = Título     Y38 = Registro
      //    C41 = E-mail     S41 = Celular
      //    C44 = Endereço   H44 = Bairro     P44 = Cidade
      //    AB43 = UF        AB44 = CEP

      const totalModPower = (data.modules || []).reduce(
        (acc: number, m: any) => acc + (Number(m.potencia) * Number(m.qtd) / 1000), 0
      );

      const set = (cellRef: string, key: string, transform?: (v: any) => any) => {
        const val = data[key];
        if (val !== undefined && val !== null && val !== '') {
          setCellValue(ws1, cellRef, transform ? transform(val) : typeof val === 'string' ? val.toUpperCase() : val);
        }
      };

      // Dados do cliente
      set('C10', 'nome_cliente');
      set('R10', 'cpf_cnpj');
      set('AC9', 'rg');
      set('C13', 'endereco');
      set('D15', 'cep');
      set('I15', 'cidade');
      set('Q15', 'uf');
      set('V15', 'email');
      set('T13', 'celular');

      // Unidade consumidora
      set('Z17', 'conta_contrato');
      set('F27', 'tensao_atendimento');
      set('L27', 'tipo_ligacao');
      set('F29', 'carga_declarada');
      set('P29', 'disjuntor_entrada');
      set('F31', 'tipo_ramal');
      set('H33', 'numero_poste');
      set('L33', 'coordenada_x');
      set('T33', 'coordenada_y');

      // Geração distribuída
      setCellValue(ws1, 'G49', 'SOLAR FOTOVOLTAICA');
      setCellValue(ws1, 'G51', 'EMPREGANDO CONVERSOR ELETRÔNICO/INVERSOR');
      set('I53', 'enquadramento');
      setCellValue(ws1, 'AC53', totalModPower);

      // Responsável técnico
      set('C38', 'resp_tecnico_nome');
      set('M38', 'resp_tecnico_titulo');
      set('Y38', 'resp_tecnico_registro');
      set('C41', 'resp_tecnico_email');
      set('S41', 'resp_tecnico_celular');
      set('C44', 'resp_tecnico_endereco');
      set('H44', 'resp_tecnico_bairro');
      set('P44', 'resp_tecnico_cidade');
      set('AB43', 'resp_tecnico_uf');
      set('AB44', 'resp_tecnico_cep');

      // Salvar arquivo
      const filename = `Anexo_I_${(data.nome_cliente || 'Projeto').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
      const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
      const outputDir = isVercel ? os.tmpdir() : OUTPUT_DIR_EXCEL;
      if (!isVercel && !fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputPath = path.join(outputDir, filename);
      await workbook.xlsx.writeFile(outputPath);
      console.log(`[NativeGenerator] Excel salvo em: ${outputPath}`);

      return { success: true, filePath: outputPath };

    } catch (error: any) {
      console.error('[NativeGenerator] Erro ao gerar Excel:', error);
      return { success: false, error: error.message };
    }
  },

  // ── Word ───────────────────────────────────────────────────────────────────

  async generateWord(data: any): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      console.log(`[NativeGenerator] Gerando Word com docxtemplater para: ${data.nome_cliente}`);

      if (!fs.existsSync(TEMPLATE_WORD)) {
        throw new Error(`Template não encontrado: ${TEMPLATE_WORD}`);
      }

      const content = fs.readFileSync(TEMPLATE_WORD, 'binary');
      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' },
      });

      const templateData = {
        nome_cliente:             data.nome_cliente || '',
        rg:                       data.rg || '',
        cpf_cnpj:                 data.cpf_cnpj || '',
        endereco:                 data.endereco || '',
        cidade:                   data.cidade || '',
        uf:                       data.uf || '',
        cep:                      data.cep || '',
        cidade_uf:                `${data.cidade || ''} \u2013 ${data.uf || ''}`,
        estado:                   getEstadoExtenso(data.uf || ''),
        estado_extenso:           getEstadoExtenso(data.uf || ''),
        potencia_total_kw:        data.potencia_total_kw || '',
        resp_tecnico_nome:        data.resp_tecnico_nome || '',
        resp_tecnico_titulo:      data.resp_tecnico_titulo || '',
        resp_tecnico_registro:    data.resp_tecnico_registro || '',
        data_extenso:             formatDataExtenso(),
        classe_uc:                data.classe_uc || 'Residencial',
        conta_contrato:           data.conta_contrato || '',
        coordenadas:              data.coordenadas || '',
        coordenada_x:             data.coordenada_x || '',
        coordenada_y:             data.coordenada_y || '',
        numero_poste:             data.numero_poste || '',
        enquadramento:            data.enquadramento || '',
        tensao_atendimento:       data.tensao_atendimento || '',
        tipo_ligacao:             data.tipo_ligacao || '',
        potencia_disponibilizada: data.potencia_disponibilizada || '',
        carga_declarada:          data.carga_declarada || '',

        modules:  data.modules  || [],
        inverters: data.inverters || [],

        mod_fabricante:  data.modules?.[0]?.fabricante  || '',
        mod_modelo:      data.modules?.[0]?.modelo      || '',
        mod_potencia:    data.modules?.[0]?.potencia    || '',
        mod_voc:         data.modules?.[0]?.voc         || '',
        mod_isc:         data.modules?.[0]?.isc         || '',
        mod_vmpp:        data.modules?.[0]?.vmpp        || '',
        mod_impp:        data.modules?.[0]?.impp        || '',
        mod_eficiencia:  data.modules?.[0]?.eficiencia  || '',
        mod_comprimento: data.modules?.[0]?.comprimento || '',
        mod_largura:     data.modules?.[0]?.largura     || '',
        mod_area:        data.modules?.[0]?.area_fmt    || '',
        mod_peso:        data.modules?.[0]?.peso        || '',
        mod_quantidade:  data.modules?.reduce((acc: number, m: any) => acc + (m.qtd || 0), 0) || 0,

        inv_fabricante:        data.inverters?.[0]?.fabricante        || '',
        inv_modelo:            data.inverters?.[0]?.modelo            || '',
        inv_quantidade:        data.inverters?.reduce((acc: number, i: any) => acc + (i.qtd || 0), 0) || 0,
        inv_corrente_cc_max:   data.inverters?.[0]?.corrente_cc_max   || '',
        inv_corrente_ca_max:   data.inverters?.[0]?.corrente_ca_max   || '',
        inv_eficiencia_max:    data.inverters?.[0]?.eficiencia_max    || '',
        inv_eficiencia_eu:     data.inverters?.[0]?.eficiencia_eu     || '',
        inv_tipo_conexao:      data.inverters?.[0]?.tipo_conexao      || '',
        inv_potencia_nominal_kw: data.inverters?.[0]?.potencia_nominal_kw_fmt || '',
        inv_potencia_max_cc:   data.inverters?.[0]?.potencia_max_cc   || '',
        inv_tensao_cc_max:     data.inverters?.[0]?.tensao_cc_max     || '',
        inv_tensao_mppt_max:   data.inverters?.[0]?.tensao_mppt_max   || '',
        inv_tensao_mppt_min:   data.inverters?.[0]?.tensao_mppt_min   || '',
        inv_tensao_partida:    data.inverters?.[0]?.tensao_partida    || '',
        inv_num_strings:       data.inverters?.[0]?.num_strings       || '',
        inv_num_mppt:          data.inverters?.[0]?.num_mppt          || '',
        inv_tensao_ca_nominal: data.inverters?.[0]?.tensao_ca_nominal || '',
        inv_frequencia:        data.inverters?.[0]?.frequencia        || '',
        inv_thd:               data.inverters?.[0]?.thd               || '',
        inv_fator_potencia:    data.inverters?.[0]?.fator_potencia    || '',

        descricao_sistema: gerarDescricaoSistema(data.modules || [], data.inverters || []),
      };

      doc.render(templateData);

      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      const filename = `Memorial_${(data.nome_cliente || 'Novo').replace(/ /g, '_')}.docx`;
      const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
      const outputDir = isVercel ? os.tmpdir() : OUTPUT_DIR_WORD;
      if (!isVercel && !fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputPath = path.join(outputDir, filename);
      fs.writeFileSync(outputPath, buf);
      console.log(`[NativeGenerator] Word salvo em: ${outputPath}`);

      return { success: true, filePath: outputPath };

    } catch (error: any) {
      console.error('[NativeGenerator] Erro ao gerar Word:', error);
      if (error.properties?.errors) {
        error.properties.errors.forEach((e: any, i: number) => {
          console.error(`[NativeGenerator] Docxtemplater error ${i + 1}:`, e);
        });
      }
      return { success: false, error: error.message };
    }
  },
};
