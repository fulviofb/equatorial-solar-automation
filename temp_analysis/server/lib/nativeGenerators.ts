import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

// Configurações
const BASE_DIR = path.resolve(process.cwd(), 'server', 'python_modules');
const TEMPLATE_WORD = path.join(BASE_DIR, "TEMPLATE_MEMORIAL_CLEAN.docx");
const TEMPLATE_EXCEL = path.join(BASE_DIR, "TEMPLATE_ANEXO_I.xlsx");
const OUTPUT_DIR_WORD = path.join(BASE_DIR, "Projetos_Gerados_Word");
const OUTPUT_DIR_EXCEL = path.join(BASE_DIR, "Projetos_Gerados_Excel");

// Garantir diretórios
if (!fs.existsSync(OUTPUT_DIR_WORD)) fs.mkdirSync(OUTPUT_DIR_WORD, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR_EXCEL)) fs.mkdirSync(OUTPUT_DIR_EXCEL, { recursive: true });

function getEstadoExtenso(uf: string): string {
    const estados: { [key: string]: string } = {
        'GO': 'GOIÁS', 'SP': 'SÃO PAULO', 'MG': 'MINAS GERAIS', 'RJ': 'RIO DE JANEIRO',
        'BA': 'BAHIA', 'PR': 'PARANÁ', 'RS': 'RIO GRANDE DO SUL', 'SC': 'SANTA CATARINA',
        'PE': 'PERNAMBUCO', 'CE': 'CEARÁ', 'AM': 'AMAZONAS', 'PA': 'PARÁ',
        'MT': 'MATO GROSSO', 'MS': 'MATO GROSSO DO SUL', 'DF': 'DISTRITO FEDERAL',
        'ES': 'ESPÍRITO SANTO', 'MA': 'MARANHÃO', 'PB': 'PARAÍBA', 'RN': 'RIO GRANDE DO NORTE',
        'AL': 'ALAGOAS', 'PI': 'PIAUÍ', 'SE': 'SERGIPE', 'RO': 'RONDÔNIA', 'TO': 'TOCANTINS',
        'AC': 'ACRE', 'AP': 'AMAPÁ', 'RR': 'RORAIMA'
    };
    return estados[uf.toUpperCase()] || uf;
}

function gerarDescricaoSistema(modules: any[], inverters: any[]): string {
    // Ex: "10 módulos Honor 700W e 3 inversores FoxESS 3kW..."
    const modDesc = modules.length > 0 ? `${modules.reduce((acc, m) => acc + (m.qtd || 0), 0)} módulos ${modules[0].fabricante} de ${modules[0].potencia}W` : "Sem módulos";
    const invDesc = inverters.length > 0 ? `${inverters.reduce((acc, i) => acc + (i.qtd || 0), 0)} inversores ${inverters[0].fabricante} de ${inverters[0].potencia_nominal_kw}kW` : "Sem inversores";
    return `${modDesc} ligados a ${invDesc}`;
}


export const NativeGenerator = {

    async generateWord(data: any): Promise<{ success: boolean; filePath?: string; error?: string }> {
        try {
            console.log(`[NativeGenerator] Gerando Word com docxtemplater (template limpo)`);

            if (!fs.existsSync(TEMPLATE_WORD)) {
                throw new Error(`Template não encontrado: ${TEMPLATE_WORD}`);
            }

            // Ler template limpo
            const content = fs.readFileSync(TEMPLATE_WORD, 'binary');
            const zip = new PizZip(content);

            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                delimiters: {
                    start: '{{',
                    end: '}}'
                }
            });

            // Preparar dados para o template
            const templateData = {
                nome_cliente: data.nome_cliente || '',
                rg: data.rg || '',
                cpf_cnpj: data.cpf_cnpj || '',
                endereco: data.endereco || '',
                cidade: data.cidade || '',
                uf: data.uf || '',
                cep: data.cep || '',
                cidade_uf: `${data.cidade || ''} - ${data.uf || ''}`,
                potencia_total_kw: data.potencia_total_kw || '',
                resp_tecnico_nome: data.resp_tecnico_nome || '',
                resp_tecnico_titulo: data.resp_tecnico_titulo || '',
                resp_tecnico_registro: data.resp_tecnico_registro || '',
                data_extenso: new Date().toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),

                // Address & Client
                classe_uc: data.classe_uc || 'Residencial',
                conta_contrato: data.conta_contrato || '',
                coordenadas: data.coordenadas || '',
                numero_poste: data.numero_poste || '',
                estado: getEstadoExtenso(data.uf || ''),

                // Technical
                enquadramento: data.enquadramento || '',
                tensao_atendimento: data.tensao_atendimento || '',
                tipo_ligacao: data.tipo_ligacao || '',
                potencia_disponibilizada: data.potencia_disponibilizada || '',
                carga_declarada: data.carga_declarada || '',

                // Lists
                modules: data.modules || [],
                inverters: data.inverters || [],

                // Flattened First Items (for single item templates)
                // Modules
                mod_fabricante: data.modules?.[0]?.fabricante || '',
                mod_modelo: data.modules?.[0]?.modelo || '',
                mod_potencia: data.modules?.[0]?.potencia || '',
                mod_voc: data.modules?.[0]?.voc || '',
                mod_isc: data.modules?.[0]?.isc || '',
                mod_vmpp: data.modules?.[0]?.vmpp || '',
                mod_impp: data.modules?.[0]?.impp || '',
                mod_eficiencia: data.modules?.[0]?.eficiencia || '',
                mod_comprimento: data.modules?.[0]?.comprimento || '',
                mod_largura: data.modules?.[0]?.largura || '',
                mod_area: data.modules?.[0]?.area_fmt || '',
                mod_peso: data.modules?.[0]?.peso || '',
                mod_quantidade: data.modules?.reduce((acc: number, m: any) => acc + (m.qtd || 0), 0) || 0,

                // Inverters
                inv_fabricante: data.inverters?.[0]?.fabricante || '',
                inv_modelo: data.inverters?.[0]?.modelo || '',
                inv_quantidade: data.inverters?.reduce((acc: number, i: any) => acc + (i.qtd || 0), 0) || 0,
                inv_corrente_cc_max: data.inverters?.[0]?.corrente_cc_max || '',
                inv_corrente_ca_max: data.inverters?.[0]?.corrente_ca_max || '',
                inv_eficiencia_max: data.inverters?.[0]?.eficiencia_max || '',
                inv_tipo_conexao: data.inverters?.[0]?.tipo_conexao || '',
                // Extra Inverter Fields
                inv_potencia_nominal_kw: data.inverters?.[0]?.potencia_nominal_kw_fmt || '',
                inv_potencia_max_cc: data.inverters?.[0]?.potencia_max_cc || '',
                inv_tensao_cc_max: data.inverters?.[0]?.tensao_cc_max || '',
                inv_tensao_mppt_max: data.inverters?.[0]?.tensao_mppt_max || '',
                inv_tensao_mppt_min: data.inverters?.[0]?.tensao_mppt_min || '',
                inv_tensao_partida: data.inverters?.[0]?.tensao_partida || '',
                inv_num_strings: data.inverters?.[0]?.num_strings || '',
                inv_num_mppt: data.inverters?.[0]?.num_mppt || '',
                inv_potencia_ca: data.inverters?.[0]?.potencia_nominal_kw_fmt || '', // same as nominal?
                inv_tensao_ca_nominal: data.inverters?.[0]?.tensao_ca_nominal || '',
                inv_frequencia: data.inverters?.[0]?.frequencia || '',
                inv_thd: data.inverters?.[0]?.thd || '',
                inv_fator_potencia: data.inverters?.[0]?.fator_potencia || '',

                // Description
                descricao_sistema: gerarDescricaoSistema(data.modules || [], data.inverters || [])
            };

            doc.render(templateData);

            const buf = doc.getZip().generate({
                type: "nodebuffer",
                compression: "DEFLATE",
            });

            const filename = `Memorial_${(data.nome_cliente || 'Novo').replace(/ /g, '_')}.docx`;
            const outputPath = path.join(OUTPUT_DIR_WORD, filename);

            fs.writeFileSync(outputPath, buf);
            console.log(`[NativeGenerator] Word salvo em: ${outputPath}`);

            return { success: true, filePath: outputPath };

        } catch (error: any) {
            console.error('[NativeGenerator] Error generating Word:', error);
            if (error.properties && error.properties.errors) {
                error.properties.errors.forEach((e: any, i: number) => {
                    console.error(`[NativeGenerator] Error ${i + 1}:`, e);
                });
            }
            return { success: false, error: error.message };
        }
    },

    async generateExcel(data: any): Promise<{ success: boolean; filePath?: string; error?: string }> {
        try {
            console.log(`[NativeGenerator] Gerando Excel com template: ${TEMPLATE_EXCEL}`);

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(TEMPLATE_EXCEL);

            // --- ABA 0: MÓDULOS ---
            const ws0 = workbook.getWorksheet('0');
            if (!ws0) throw new Error("Worksheet '0' not found");

            // Limpar células antigas (Intervalo C7:AE50)
            const colsToClear = [3, 4, 8, 11, 16, 20, 27];
            for (let r = 7; r <= 16; r++) { // Modules Range
                for (const c of colsToClear) {
                    ws0.getCell(r, c).value = null;
                }
            }
            // Clear Inverters Range (22-31)
            const invColsToClear = [3, 4, 8, 12, 16, 20, 23, 26, 29]; // C, D, H, L, P, T, W, Z, AC
            for (let r = 22; r <= 31; r++) {
                for (const c of invColsToClear) {
                    ws0.getCell(r, c).value = null;
                }
            }

            // Preencher Módulos (Consolidated)
            // C=Item, D=Pot, H=Qtd, K=Total, P=Area, T=Fab, AA=Modelo
            let currentRow = 7;
            if (data.modules) {
                const consolidatedModules = consolidateItems(data.modules, 'module');
                consolidatedModules.forEach((mod: any, idx: number) => {
                    if (currentRow > 16) return; // Limit to fixed rows

                    const pot = parseFloat(mod.potencia || 0);
                    const qtd = parseInt(mod.qtd || 0);
                    const areaUn = parseFloat(mod.area || 0);
                    const totalKwp = (pot * qtd) / 1000;
                    const totalArea = areaUn * qtd;

                    ws0.getCell(currentRow, 3).value = idx + 1; // C
                    ws0.getCell(currentRow, 4).value = pot;     // D
                    ws0.getCell(currentRow, 8).value = qtd;     // H
                    ws0.getCell(currentRow, 11).value = totalKwp; // K
                    ws0.getCell(currentRow, 16).value = totalArea; // P
                    ws0.getCell(currentRow, 20).value = (mod.fabricante || '').toUpperCase(); // T
                    ws0.getCell(currentRow, 27).value = (mod.modelo || '').toUpperCase(); // AA

                    currentRow++;
                });
            }

            // Preencher Inversores (Consolidated)
            // Range Starts 22
            // D=Fab, H=Mod, L=Pot(kW), P=Faixa Tensao, T=Corr Nom, W=FP, Z=Rend, AC=DHT
            let invRow = 22;
            if (data.inverters) {
                const consolidatedInverters = consolidateItems(data.inverters, 'inverter');
                consolidatedInverters.forEach((inv: any, idx: number) => {
                    if (invRow > 31) return;

                    ws0.getCell(invRow, 3).value = idx + 1; // C (Item)
                    ws0.getCell(invRow, 4).value = (inv.fabricante || '').toUpperCase(); // D
                    ws0.getCell(invRow, 8).value = (inv.modelo || '').toUpperCase(); // H
                    ws0.getCell(invRow, 12).value = parseFloat(inv.potencia_nominal_kw || 0); // L

                    // Faixa Tensao (MPPT Min - Max) if available
                    const mpptRange = (inv.tensao_mppt_min && inv.tensao_mppt_max) ? `${inv.tensao_mppt_min}-${inv.tensao_mppt_max}` : (inv.faixa_tensao || '');
                    ws0.getCell(invRow, 16).value = mpptRange; // P

                    ws0.getCell(invRow, 20).value = inv.corrente_ca_max || ''; // T (Corrente Nominal -> usually Max AC Current)
                    ws0.getCell(invRow, 23).value = inv.fator_potencia || '>0.99'; // W
                    ws0.getCell(invRow, 26).value = inv.eficiencia_max || ''; // Z
                    ws0.getCell(invRow, 29).value = inv.thd || '<3'; // AC

                    invRow++;
                });
            }

            // --- ABA 1: DADOS CADASTRAIS ---
            const ws1 = workbook.getWorksheet('1');
            if (!ws1) throw new Error("Worksheet '1' not found");

            // Calculate Total Inverter Power
            let totalInverterPower = 0;
            if (data.inverters) {
                data.inverters.forEach((inv: any) => {
                    const qtd = parseInt(inv.qtd || 0);
                    const pot = parseFloat(inv.potencia_nominal_kw || 0);
                    totalInverterPower += (pot * qtd);
                });
            }
            const totalInverterPowerStr = totalInverterPower.toFixed(2).replace('.', ',');

            const mapping: { [key: string]: string } = {
                'C10': 'nome_cliente',
                'R10': 'cpf_cnpj',
                'AC9': 'rg',
                'AC10': 'rg_data_emissao',
                'C13': 'endereco',
                'D15': 'cep',
                'I15': 'cidade',
                'Q15': 'uf',
                'Z17': 'conta_contrato',
                'F27': 'classe_uc',
                'T27': 'tipo_ligacao',
                'AC27': 'tensao_atendimento',
                'F29': 'carga_declarada',
                'H29': 'unidade_potencia',
                'P31': 'numero_poste',
                'C38': 'resp_tecnico_nome',
                'M38': 'resp_tecnico_titulo',
                'Y38': 'resp_tecnico_registro',
                // Power Fields
                'AC53': 'potencia_total_kw', // Potência Geração do Orçamento (Modules kWp)
                'AC55': 'potencia_total_kw', // Potência Geração Total (Assuming New = Total)
                'AC57': 'potencia_inversores_kw' // Potência Máxima Injetável (Total Inverters)
            };

            // Add computed fields to data object for mapping
            data.potencia_inversores_kw = totalInverterPowerStr;

            for (const [cellRef, jsonKey] of Object.entries(mapping)) {
                let val = data[jsonKey];
                if (val) {
                    if (typeof val === 'string') val = val.toUpperCase();
                    ws1.getCell(cellRef).value = val;
                }
            }

            const filename = `Anexo_I_${(data.nome_cliente || 'Novo').replace(/ /g, '_')}.xlsx`;
            const outputPath = path.join(OUTPUT_DIR_EXCEL, filename);

            await workbook.xlsx.writeFile(outputPath);
            console.log(`[NativeGenerator] Excel salvo em: ${outputPath}`);

            return { success: true, filePath: outputPath };

        } catch (error: any) {
            console.error('[NativeGenerator] Error generating Excel:', error);
            return { success: false, error: error.message };
        }
    }
};
