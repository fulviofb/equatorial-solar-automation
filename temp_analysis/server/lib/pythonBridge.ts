import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Detectar qual comando Python está disponível
let PYTHON_CMD: string | null = null;

async function detectPythonCommand(): Promise<string> {
    if (PYTHON_CMD) return PYTHON_CMD;

    const candidates = ['python3.11', 'python3', 'python'];
    
    for (const cmd of candidates) {
        try {
            await execAsync(`which ${cmd}`);
            console.log(`[PythonBridge] Detected Python command: ${cmd}`);
            PYTHON_CMD = cmd;
            return cmd;
        } catch {
            // Comando não encontrado, tentar próximo
        }
    }

    throw new Error('Python não encontrado no sistema. Instale Python 3.11 ou superior.');
}

// Caminhos
const PYTHON_MODULES_DIR = path.resolve(process.cwd(), 'server', 'python_modules');
const GENERATOR_PDF_SCRIPT = path.join(PYTHON_MODULES_DIR, 'foton_automator.py');
const GENERATOR_EXCEL_SCRIPT = path.join(PYTHON_MODULES_DIR, 'foton_excel_automator.py');
const GENERATOR_WORD_SCRIPT = path.join(PYTHON_MODULES_DIR, 'foton_word_automator.py');
const OUTPUT_DIR = path.resolve(process.cwd(), 'server', 'generated_files');

interface GenerationResult {
    success: boolean;
    filePath?: string;
    error?: string;
}

/**
 * Helper para executar script python passando JSON
 */
async function runPythonScript(scriptPath: string, data: any, outputDir: string): Promise<GenerationResult> {
    try {
        // Garantir que diretório de saída existe
        await fs.mkdir(outputDir, { recursive: true });

        // Usar arquivo temporário para passar o JSON (mais seguro e robusto)
        const tempFileName = `data_${Date.now()}_${Math.random().toString(36).substring(7)}.json`;
        const tempFilePath = path.join(os.tmpdir(), tempFileName);

        await fs.writeFile(tempFilePath, JSON.stringify(data));
        console.log(`[PythonBridge] Temp input file created: ${tempFilePath}`);

        // Montar comando: agora passamos o caminho do arquivo temp em vez do JSON string
        // O script Python precisa ser atualizado para aceitar --input-file também ou checar se --json é arquivo
        // Vamos manter --json mas passar "@caminho" ou alterar o script python?
        // Melhor: Vamos alterar o script Python para aceitar --input <file>
        // Mas para não quebrar compatibilidade imediata, vamos ler o argumento --json no python:
        // Se começar com @ ou for caminho valido, lê arquivo.
        // Ou melhor, adicionar argumento --input-file no python.

        // Detectar comando Python disponível
        const pythonCmd = await detectPythonCommand();
        const command = `${pythonCmd} "${scriptPath}" --input-file "${tempFilePath}" --output "${outputDir}"`;

        console.log(`[PythonBridge] Executing: ${pythonCmd} ${path.basename(scriptPath)}...`);

        const { stdout, stderr } = await execAsync(command, { cwd: PYTHON_MODULES_DIR });

        // Limpar arquivo temporário
        try {
            await fs.unlink(tempFilePath);
        } catch (e) {
            console.warn('[PythonBridge] Failed to delete temp file:', e);
        }

        if (stderr && !stdout) {
            console.error('[PythonBridge] Stderr:', stderr);
            return { success: false, error: stderr };
        }

        // Tentar capturar o caminho do arquivo gerado a partir do stdout
        // O script python deve imprimir "OUTPUT_PDF_PATH=..." ou "OUTPUT_EXCEL_PATH=..."
        const match = stdout.match(/OUTPUT_(?:PDF|EXCEL|WORD)_PATH=(.*)/);
        if (match && match[1]) {
            return { success: true, filePath: match[1].trim() };
        }

        // Fallback se não achar output explícito mas não deu erro
        return { success: true };

    } catch (error: any) {
        console.error('[PythonBridge] Error:', error.message);
        return { success: false, error: error.message };
    }
}

export const PythonGenerator = {
    async generatePdf(projectData: any): Promise<GenerationResult> {
        return runPythonScript(GENERATOR_PDF_SCRIPT, projectData, OUTPUT_DIR);
    },

    async generateExcel(projectData: any): Promise<GenerationResult> {
        return runPythonScript(GENERATOR_EXCEL_SCRIPT, projectData, OUTPUT_DIR);
    },

    async generateWord(projectData: any): Promise<GenerationResult> {
        return runPythonScript(GENERATOR_WORD_SCRIPT, projectData, OUTPUT_DIR);
    }
};
