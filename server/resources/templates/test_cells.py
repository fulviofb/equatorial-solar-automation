import openpyxl
from openpyxl.cell.cell import MergedCell

wb = openpyxl.load_workbook("TEMPLATE_ANEXO_I.xlsx")
ws1 = wb['1']

# Testar cada célula do mapeamento
mapping = {
    'C10': 'nome_cliente',
    'Q10': 'cpf_cnpj',
    'AD10': 'rg',
    'C13': 'endereco',
    'D15': 'cep',
    'I15': 'cidade',
    'N15': 'uf',
    'F29': 'carga_declarada',
    'H29': 'unidade_potencia',
    'C38': 'resp_tecnico_nome',
    'M38': 'resp_tecnico_titulo',
}

print("Testando células...")
for cell_ref, field_name in mapping.items():
    cell = ws1[cell_ref]
    is_merged = isinstance(cell, MergedCell)
    print(f"{cell_ref} ({field_name}): {'MERGED' if is_merged else 'NORMAL'} - value={cell.value}")
    
    if is_merged:
        print(f"  -> Buscando célula mestre...")
        for merged_range in ws1.merged_cells.ranges:
            if cell.coordinate in merged_range:
                master = ws1.cell(merged_range.min_row, merged_range.min_col)
                print(f"  -> Mestre: {master.coordinate} - value={master.value}")
                break
