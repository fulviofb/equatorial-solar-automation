import openpyxl
from openpyxl.cell.cell import MergedCell

wb = openpyxl.load_workbook("TEMPLATE_ANEXO_I.xlsx")
ws0 = wb['0']

print("Testando limpeza de células da Aba 0 (linhas 6-14, colunas 1-7)...")
for r in range(6, 15):
    for c in range(1, 8):
        cell = ws0.cell(row=r, column=c)
        is_merged = isinstance(cell, MergedCell)
        if is_merged:
            print(f"MERGED CELL encontrada: Linha {r}, Coluna {c} - {cell.coordinate}")
            # Tentar limpar
            try:
                cell.value = None
                print(f"  -> ERRO: Conseguiu atribuir None (não deveria)")
            except Exception as e:
                print(f"  -> Erro esperado: {e}")
        else:
            cell.value = None  # Deve funcionar
            
print("Teste concluído")
