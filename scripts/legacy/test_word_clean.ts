import { NativeGenerator } from './server/lib/nativeGenerators';

const testData = {
  nome_cliente: "EDSON HONÓRIO FILHO",
  cpf_cnpj: "123.456.789-00",
  rg: "9876543 SSP GO",
  endereco: "RUA TESTE 123, QD 10, LT 5",
  cidade: "GOIANIA",
  uf: "GO",
  cep: "74000-000",
  potencia_total_kw: "4.20",
  resp_tecnico_nome: "FULVIO FERREIRA BORGES",
  resp_tecnico_titulo: "Engenheiro Eletricista",
  resp_tecnico_registro: "12345678900",
  modules: [
    {
      potencia: 550,
      qtd: 8,
      area: 2.72,
      fabricante: "Canadian Solar",
      modelo: "CS3W-550MS"
    }
  ],
  inverters: [
    {
      fabricante: "Growatt",
      modelo: "MIN 8000TL-XH",
      potencia_nominal_kw: 8.0,
      qtd: 1
    }
  ]
};

async function test() {
  console.log('=== TESTE GERADOR WORD COM TEMPLATE LIMPO ===');
  console.log('');
  
  try {
    const result = await NativeGenerator.generateWord(testData);
    
    if (result.success) {
      console.log('✅ Word gerado com sucesso!');
      console.log('Arquivo:', result.filePath);
    } else {
      console.log('❌ Erro ao gerar Word:');
      console.log(result.error);
    }
  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
    console.error(error.stack);
  }
}

test();
