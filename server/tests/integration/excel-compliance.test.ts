import { describe, it, expect } from 'vitest';
import { NativeGenerator } from '../../lib/nativeGenerators';
import path from 'path';
import fs from 'fs';

describe('Excel Generator Compliance', () => {
    it('should generate Annex I with correct field mapping', async () => {
        const mockData = {
            nome_cliente: 'TESTE AUTOMATIZADO',
            cpf_cnpj: '000.000.000-00',
            rg: '1234567',
            rg_data_emissao: '2020-01-01',
            email: 'teste@email.com',
            celular: '(62) 99999-9999',
            endereco: 'RUA TESTE, 123',
            cep: '74000-000',
            cidade: 'Goiânia',
            uf: 'GO',
            conta_contrato: '123456789',
            carga_declarada: 15,
            disjuntor_entrada: 60,
            tipo_ramal: 'SUBTERRÂNEO',
            resp_tecnico_nome: 'Engenheiro Teste',
            resp_tecnico_titulo: 'Engenheiro Eletricista',
            resp_tecnico_registro: '12345CREA',
            modalidade: 'AUTOCONSUMO REMOTO',
            modules: [
                { potencia: 550, qtd: 10, fabricante: 'Jinko', modelo: 'JKM550' },
                { potencia: 550, qtd: 5, fabricante: 'Jinko', modelo: 'JKM550' }
            ],
            inverters: [
                {
                    fabricante: 'FoxESS',
                    modelo: 'R3000',
                    potenciaNominal: 3,
                    tensao: 220,
                    qtd: 1,
                    corrente: 13,
                    fatorPotencia: 0.99,
                    rendimento: 98,
                    dht: 2
                }
            ]
        };

        const result = await NativeGenerator.generateExcel(mockData);
        expect(result.success).toBe(true);
        expect(result.filePath).toBeDefined();

        if (!result.filePath) return;

        // Verify Content using Python script (ExcelJS has issues with this template)
        const expectations = {
            '0': {
                'C7': 1,
                'D7': 550,
                'H7': 10,
                'T7': 'JINKO',
                'C8': 2,
                'H8': 5,
                'C22': 1,
                'D22': 'FOXESS', // Uppercased by generator
                'L22': 3
            },
            '1': {
                'C10': 'TESTE AUTOMATIZADO',
                'V15': 'TESTE@EMAIL.COM',
                'T13': '(62) 99999-9999',
                'F31': 'SUBTERRÂNEO',
                'AC53': 8.25 // (550*10 + 550*5)/1000 = (5500 + 2750)/1000 = 8.25
            }
        };

        const { spawn } = await import('child_process');
        const pythonScript = path.resolve(process.cwd(), 'scripts/verify_excel_compliance.py');
        const expectPath = path.resolve(process.cwd(), 'temp_expectations.json');

        fs.writeFileSync(expectPath, JSON.stringify(expectations));

        await new Promise<void>((resolve, reject) => {
            console.log(`Verifying file: ${result.filePath}`);
            const pyProcess = spawn('python', [pythonScript, '--file', result.filePath!, '--expect', expectPath]);

            let output = '';
            pyProcess.stdout.on('data', d => output += d.toString());
            pyProcess.stderr.on('data', d => output += d.toString());

            pyProcess.on('close', (code) => {
                // Cleanup
                try { fs.unlinkSync(expectPath); } catch { }

                if (code !== 0) {
                    const logPath = path.resolve(process.cwd(), 'verification_error.log');
                    fs.writeFileSync(logPath, output);
                    reject(new Error(`Verification failed. Check log at ${logPath}`));
                } else {
                    resolve();
                }
            });
        });
    });
}, 30000);
