import openpyxl

wb = openpyxl.load_workbook("/tmp/test_excel_v2/Anexo_I_TESTE_AUTOMACAO_CORRIGIDO.xlsx")

print("=== Aba 0 (Módulos) ===")
ws0 = wb['0']
for r in range(6, 8):
    row_data = []
    for c in range(1, 8):
        cell = ws0.cell(r, c)
        row_data.append(cell.value)
    print(f"Linha {r}: {row_data}")

print("\n=== Aba 1 (Dados Cadastrais) - Campos Críticos ===")
ws1 = wb['1']
critical_cells = ['C10', 'R10', 'AC9', 'AC10', 'C13', 'D15', 'I15', 'N15', 'C38', 'M38']
for cell_ref in critical_cells:
    cell = ws1[cell_ref]
    is_merged = isinstance(cell, openpyxl.cell.cell.MergedCell)
    print(f"{cell_ref}: {cell.value} {'(MERGED)' if is_merged else ''}")
