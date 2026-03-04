import openpyxl

wb = openpyxl.load_workbook("/tmp/test_excel_final/Anexo_I_TESTE_AUTOMACAO_CORRIGIDO.xlsx")

print("=== Aba 0 (Módulos) ===")
ws0 = wb['0']
for r in range(6, 8):
    row_data = [ws0.cell(r, c).value for c in range(1, 8)]
    print(f"Linha {r}: {row_data}")

print("\n=== Aba 1 (Dados Cadastrais) - Amostra ===")
ws1 = wb['1']
cells_to_check = ['C10', 'Q10', 'AD10', 'C13', 'D15', 'I15', 'N15', 'C38', 'M38']
for cell_ref in cells_to_check:
    print(f"{cell_ref}: {ws1[cell_ref].value}")
