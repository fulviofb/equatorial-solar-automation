#!/bin/bash

echo "=== TESTE DE GERADORES DE DOCUMENTOS ==="
echo ""

# Criar diretório de teste
TEST_DIR="/tmp/test_generators_$(date +%s)"
mkdir -p "$TEST_DIR"

# Dados de teste (projeto #30001)
cat > "$TEST_DIR/test_data.json" << 'EOF'
{
  "nome_cliente": "FULVIO FERREIRA BORGES",
  "cpf_cnpj": "123.456.789-00",
  "rg": "9876543 SSP GO",
  "endereco": "RUA TESTE 123, QD 10, LT 5",
  "cidade": "GOIANIA",
  "uf": "GO",
  "cep": "74000-000",
  "potencia_total_kw": "4.20",
  "resp_tecnico_nome": "FULVIO FERREIRA BORGES",
  "resp_tecnico_titulo": "Engenheiro Eletricista",
  "resp_tecnico_registro": "12345678900",
  "modules": [
    {
      "potencia": 550,
      "qtd": 8,
      "area": 2.72,
      "fabricante": "Canadian Solar",
      "modelo": "CS3W-550MS"
    }
  ],
  "inverters": [
    {
      "fabricante": "Growatt",
      "modelo": "MIN 8000TL-XH",
      "potencia_nominal_kw": 8.0,
      "qtd": 1
    }
  ]
}
EOF

echo "📄 Dados de teste criados em: $TEST_DIR/test_data.json"
echo ""

# Teste 1: Geração de Excel
echo "🧪 TESTE 1: Gerando Excel..."
cd /home/ubuntu/equatorial-solar-automation/server/python_modules
python3 foton_excel_automator.py \
  --input-file "$TEST_DIR/test_data.json" \
  --output "$TEST_DIR"

if [ $? -eq 0 ]; then
  echo "✅ Excel gerado com sucesso!"
  ls -lh "$TEST_DIR"/*.xlsx 2>/dev/null || echo "❌ Arquivo Excel não encontrado"
else
  echo "❌ Erro ao gerar Excel"
fi
echo ""

# Teste 2: Geração de Word
echo "🧪 TESTE 2: Gerando Word..."
python3 foton_word_automator.py \
  --input-file "$TEST_DIR/test_data.json" \
  --output "$TEST_DIR"

if [ $? -eq 0 ]; then
  echo "✅ Word gerado com sucesso!"
  ls -lh "$TEST_DIR"/*.docx 2>/dev/null || echo "❌ Arquivo Word não encontrado"
else
  echo "❌ Erro ao gerar Word"
fi
echo ""

# Resumo
echo "=== RESUMO DOS TESTES ==="
echo "Diretório de saída: $TEST_DIR"
echo ""
echo "Arquivos gerados:"
ls -lh "$TEST_DIR"/ | grep -E "\.(xlsx|docx)$" || echo "Nenhum arquivo gerado"
echo ""
echo "Para visualizar os arquivos:"
echo "  cd $TEST_DIR && ls -la"
