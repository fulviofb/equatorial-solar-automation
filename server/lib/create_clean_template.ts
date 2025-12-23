
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Caminhos baseados na estrutura atual
const INPUT_FILE = path.join(process.cwd(), 'server', 'python_modules', 'TEMPLATE_MEMORIAL.docx');
const OUTPUT_FILE = path.join(process.cwd(), 'server', 'python_modules', 'TEMPLATE_MEMORIAL_TAGGED.docx');

if (!fs.existsSync(INPUT_FILE)) {
    console.error("Arquivo original não encontrado:", INPUT_FILE);
    process.exit(1);
}

const content = fs.readFileSync(INPUT_FILE, 'binary');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml')?.asText();

if (!xml) {
    console.error("Não foi possível ler word/document.xml");
    process.exit(1);
}

// Mapa de Substituições Seguras (que sabemos que existem inteiras no XML)
const replacements = [
    { target: "ADÃO MARCELINO DA SILVA", replacement: "{{nome_cliente}}" },
    { target: "FÚLVIO FERREIRA BORGES", replacement: "{{resp_tecnico_nome}}" },
    { target: "HONOR", replacement: "HONOR" }, // Manter original
    { target: "HY-M10", replacement: "HY-M10" }, // Manter original
    { target: "FOXESS", replacement: "FOXESS" }, // Manter original
    // Removidas substituições complexas de tabela para evitar erro de sintaxe.
    // O usuário fará manualmente.
];

let replacedCount = 0;
replacements.forEach(item => {
    if (xml.includes(item.target)) {
        // Replace all occurrences
        xml = xml.split(item.target).join(item.replacement);
        replacedCount++;
        console.log(`[OK] Substituído: "${item.target}" -> "${item.replacement}"`);
    } else {
        console.log(`[WARN] Não encontrado: "${item.target}"`);
    }
});

// Atualizar o arquivo no zip
zip.file('word/document.xml', xml);

// Salvar
const buf = zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
});

fs.writeFileSync(OUTPUT_FILE, buf);
console.log(`Template limpo gerado em: ${OUTPUT_FILE}`);
console.log(`Substituições realizadas: ${replacedCount}`);
