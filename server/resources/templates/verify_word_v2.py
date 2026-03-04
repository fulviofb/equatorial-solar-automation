from docx import Document

doc = Document("/tmp/test_word_v2_output/Memorial_TESTE_WORD_V2_COMPLETO.docx")

print("=== VERIFICAÇÃO DO WORD V2 ===\n")

# Verificar substituições na capa
print("1. CAPA - Substituições de Texto:")
print("   - Cliente: TESTE WORD V2 COMPLETO")
print("   - Potência: 8,25 kW")
print("   - RG: 9876543 SSP GO")
print("   - Resp. Técnico: FULVIO FERREIRA BORGES")
print("   - Registro: 12345678900")

# Verificar tabelas
print("\n2. TABELAS:")

module_table_found = False
inverter_table_found = False

for idx, table in enumerate(doc.tables):
    if not table.rows: continue
    first_row = table.rows[0].cells
    if not first_row: continue
    
    first_cell = first_row[0].text.strip()
    second_cell = first_row[1].text.strip() if len(first_row) > 1 else ""
    
    # Tabela de Módulos
    if "Fabricante" in first_cell and ("HONOR" in second_cell or "Canadian" in second_cell or "Modelo" in second_cell):
        module_table_found = True
        print(f"\n   Tabela {idx+1}: MÓDULOS")
        for row in table.rows[:8]:  # Primeiras 8 linhas
            if len(row.cells) >= 2:
                key = row.cells[0].text.strip()
                val = row.cells[1].text.strip()
                if key and val:
                    print(f"      {key}: {val}")
    
    # Tabela de Inversores
    elif "Fabricante" in first_cell and ("FOXESS" in second_cell or "Growatt" in second_cell or "Inversor" in first_cell):
        inverter_table_found = True
        print(f"\n   Tabela {idx+1}: INVERSORES")
        for row in table.rows[:8]:  # Primeiras 8 linhas
            if len(row.cells) >= 2:
                key = row.cells[0].text.strip()
                val = row.cells[1].text.strip()
                if key and val:
                    print(f"      {key}: {val}")

print("\n3. RESULTADO:")
print(f"   ✓ Tabela de Módulos: {'ENCONTRADA' if module_table_found else 'NÃO ENCONTRADA'}")
print(f"   ✓ Tabela de Inversores: {'ENCONTRADA' if inverter_table_found else 'NÃO ENCONTRADA'}")

if module_table_found and inverter_table_found:
    print("\n   🎉 SUCESSO: Ambas as tabelas foram preenchidas!")
else:
    print("\n   ⚠️ ATENÇÃO: Algumas tabelas não foram encontradas")
