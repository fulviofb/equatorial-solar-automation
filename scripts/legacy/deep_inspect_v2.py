import pandas as pd
import ezdxf
import os

excel_path = "c:/Users/fulvi/OneDrive/Agentes - Antigravity/Fóton/Diagrama de Blocos - Adão.xlsx"
dwg_path = "c:/Users/fulvi/OneDrive/Agentes - Antigravity/Fóton/PROJETO FOXESS MICRO.dwg"

def inspect_excel():
    print("\n--- Analisando Excel Detalhado ---")
    try:
        df = pd.read_excel(excel_path, header=None)
        # Imprimir o conteúdo das células não nulas da coluna 1 (B)
        print("Conteúdo da Coluna B (onde parecem estar os dados):")
        for idx, row in df.iterrows():
            if pd.notnull(row[1]):
                print(f"Linha {idx}: {row[1]}")

    except Exception as e:
        print(f"Erro Excel: {e}")

def inspect_dwg():
    print("\n--- Analisando DWG ---")
    try:
        if not os.path.exists(dwg_path):
            print("Arquivo DWG não encontrado.")
            return
            
        doc = ezdxf.readfile(dwg_path)
        msp = doc.modelspace()
        
        print("Textos encontrados (primeiros 20):")
        texts_found = 0
        for entity in msp.query('TEXT MTEXT'):
            txt = entity.dxf.text if entity.dxftype() == 'TEXT' else entity.text
            # Limpar formatação MTEXT se necessário (básico)
            txt = txt.replace('\\P', '\n').strip()
            if len(txt) > 2: # Filtrar textos curtos demais
                print(f" - [{entity.dxftype()}] {txt}")
                texts_found += 1
                if texts_found >= 20: break
            
        print("\nBlocos encontrados:")
        for block in doc.blocks:
            if not block.is_layout_block and '*' not in block.name: # Filtrar blocos anonimos
                print(f" - {block.name}")

    except Exception as e:
        print(f"Erro DWG: {e}")

if __name__ == "__main__":
    inspect_excel()
    inspect_dwg()
