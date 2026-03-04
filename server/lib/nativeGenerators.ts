import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { spawn } from 'child_process';

// Configurações
const BASE_DIR = path.resolve(process.cwd(), 'server', 'resources', 'templates');
const TEMPLATE_WORD = path.join(BASE_DIR, "TEMPLATE_MEMORIAL_CLEAN.docx");
const TEMPLATE_EXCEL = path.join(BASE_DIR, "TEMPLATE_ANEXO_I.xlsx");
const OUTPUT_DIR_WORD = path.join(BASE_DIR, "Projetos_Gerados_Word");
const OUTPUT_DIR_EXCEL = path.join(BASE_DIR, "Projetos_Gerados_Excel");

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


export function consolidateItems(items: any[], type: 'module' | 'inverter'): any[] {
    const map = new Map<string, any>();

    items.forEach(item => {
        let key = '';
        if (type === 'module') {
            key = `${item.fabricante}-${item.modelo}-${item.potencia}`;
        } else {
            key = `${item.fabricante}-${item.modelo}-${item.potencia_nominal_kw}`;
        }

        if (map.has(key)) {
            const existing = map.get(key);
            existing.qtd += (item.qtd || 1);
        } else {
            map.set(key, { ...item, qtd: item.qtd || 1 });
        }
    });

    return Array.from(map.values());
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
            const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
            const outputDir = isVercel ? require('os').tmpdir() : OUTPUT_DIR_WORD;
            if (!isVercel && !fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputPath = path.join(outputDir, filename);

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
            console.log(`[NativeGenerator] Gerando Excel nativamente Node.js (ExcelJS) para: ${data.nome_cliente}`);

            if (!fs.existsSync(TEMPLATE_EXCEL)) {
                throw new Error(`Template não encontrado: ${TEMPLATE_EXCEL}`);
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(TEMPLATE_EXCEL);

            // Aba 0: Unidades Geradoras
            const ws0 = workbook.worksheets[0];
            if (ws0) {
                // Modules (Rows 7-16)
                if (data.modules && Array.isArray(data.modules)) {
                    data.modules.forEach((mod: any, idx: number) => {
                        if (idx >= 10) return;
                        const row = 7 + idx;
                        ws0.getCell(`C${row}`).value = idx + 1;
                        ws0.getCell(`D${row}`).value = Number(mod.potencia || 0);
                        ws0.getCell(`H${row}`).value = Number(mod.qtd || 0);

                        ws0.getCell(`T${row}`).value = String(mod.fabricante || '').toUpperCase();
                        ws0.getCell(`AA${row}`).value = String(mod.modelo || '').toUpperCase();
                    });
                }

                // Inverters (Rows 22-51)
                if (data.inverters && Array.isArray(data.inverters)) {
                    data.inverters.forEach((inv: any, idx: number) => {
                        if (idx >= 30) return;
                        const row = 22 + idx;
                        ws0.getCell(`C${row}`).value = idx + 1;
                        ws0.getCell(`D${row}`).value = String(inv.fabricante || '').toUpperCase();
                        ws0.getCell(`H${row}`).value = String(inv.modelo || '').toUpperCase();
                        // Na doc original, era float(inv.get('potenciaNominal', inv.get('potencia', 0)))
                        ws0.getCell(`L${row}`).value = Number(inv.potencia_nominal_kw || inv.potencia || 0);

                        ws0.getCell(`P${row}`).value = Number(inv.tensao || 220);
                        ws0.getCell(`T${row}`).value = Number(inv.corrente || 0);
                        ws0.getCell(`W${row}`).value = String(inv.fatorPotencia || '>0.99');
                        ws0.getCell(`Z${row}`).value = Number(inv.rendimento || 97);
                        ws0.getCell(`AC${row}`).value = String(inv.dht || '<3');
                    });
                }
            }

            // Aba 1: Dados Cadastrais
            const ws1 = workbook.worksheets[1];
            if (ws1) {
                const totalModPower = (data.modules || []).reduce((acc: number, m: any) => acc + (Number(m.potencia) * Number(m.qtd) / 1000), 0);
                const totalInvPower = (data.inverters || []).reduce((acc: number, i: any) => acc + (Number(i.potencia_nominal_kw || i.potencia || 0) * (Number(i.qtd) || 1)), 0);

                const mapKeyToCell = (key: string, cellRef: string) => {
                    if (data[key] !== undefined && data[key] !== null) {
                        const val = typeof data[key] === 'string' ? data[key].toUpperCase() : data[key];
                        // If cell is merged, getting master cell handles it automatically in exceljs
                        ws1.getCell(cellRef).value = val;
                    }
                };

                mapKeyToCell('nome_cliente', 'C10');
                mapKeyToCell('cpf_cnpj', 'R10');
                mapKeyToCell('rg', 'AC9');
                mapKeyToCell('rg_data_emissao', 'AC10');
                mapKeyToCell('endereco', 'C13');
                mapKeyToCell('cep', 'D15');
                mapKeyToCell('cidade', 'I15');
                mapKeyToCell('uf', 'Q15');
                mapKeyToCell('email', 'V15');
                mapKeyToCell('celular', 'T13');
                mapKeyToCell('carga_declarada', 'F29');
                mapKeyToCell('disjuntor_entrada', 'P29');
                mapKeyToCell('tipo_ramal', 'F31');
                mapKeyToCell('conta_contrato', 'Z17');
                mapKeyToCell('resp_tecnico_nome', 'C38');
                mapKeyToCell('resp_tecnico_titulo', 'M38');
                mapKeyToCell('resp_tecnico_registro', 'Y38');
                mapKeyToCell('resp_tecnico_email', 'C41');
                mapKeyToCell('resp_tecnico_celular', 'S41');
                mapKeyToCell('resp_tecnico_endereco', 'C44');
                mapKeyToCell('resp_tecnico_cidade', 'P44');
                mapKeyToCell('resp_tecnico_uf', 'AB43');

                ws1.getCell('G49').value = 'SOLAR FOTOVOLTAICA';
                ws1.getCell('G51').value = 'EMPREGANDO CONVERSOR ELETRÔNICO/INVERSOR';
                ws1.getCell('AC53').value = totalModPower;
                ws1.getCell('AC57').value = totalInvPower;
            }

            // Write to buffer instead of local disk for serverless compatibility
            const filename = `Anexo_I_${(data.nome_cliente || 'Projeto').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

            // To maintain compatibility with existing router, save it to tmp space or return absolute path 
            // In Serverless Vercel, we can only safely write to /tmp or use memory buffer
            const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
            const outputDir = isVercel ? require('os').tmpdir() : OUTPUT_DIR_EXCEL;
            if (!isVercel && !fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputPath = path.join(outputDir, filename);

            await workbook.xlsx.writeFile(outputPath);
            console.log(`[NativeGenerator] Excel Node.js salvo em: ${outputPath}`);

            return { success: true, filePath: outputPath };

        } catch (error: any) {
            console.error('[NativeGenerator] Error generating Excel via ExcelJS:', error);
            return { success: false, error: error.message };
        }
    }
};
