import pandas as pd
import ezdxf
import os

excel_path = "c:/Users/fulvi/OneDrive/Agentes - Antigravity/Fóton/Diagrama de Blocos - Adão.xlsx"
dwg_path = "c:/Users/fulvi/OneDrive/Agentes - Antigravity/Fóton/PROJETO FOXESS MICRO.dwg"

def inspect_excel():
    print("\n--- Analisando Excel Detalhado ---")
    try:
        df = pd.read_excel(excel_path, header=None) # Ler sem cabeçalho
        print(df.head(20).to_markdown()) # Ver primeiras 20 linhas
        
        # Tentar achar células com palavras chave
        keywords = ['Cliente', 'Potência', 'Inversor', 'Módulos', 'Endereço', 'UC']
        print("\nBusca por palavras-chave:")
        for key in keywords:
            # Buscar coordenadas de células que contém a keyword
            matches = df.map(lambda x: key.lower() in str(x).lower() if pd.notnull(x) else False)
            locations = matches.to_numpy().nonzero()
            if len(locations[0]) > 0:
                print(f"'{key}' encontrado em: {list(zip(locations[0], locations[1]))}")
                # Mostrar o valor da célula ao lado (coluna seguinte)
                for r, c in zip(locations[0], locations[1]):
                    if c + 1 < df.shape[1]:
                        print(f"  -> Valor ao lado: {df.iat[r, c+1]}")

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
        
        print("Textos encontrados (primeiros 50):")
        texts = []
        for entity in msp.query('TEXT MTEXT'):
            texts.append(entity.dxf.text if entity.dxftype() == 'TEXT' else entity.text)
        
        for t in texts[:50]:
            print(f" - {t}")
            
        print("\nBlocos encontrados:")
        for block in doc.blocks:
            if not block.is_layout_block:
                print(f" - {block.name}")

    except Exception as e:
        print(f"Erro DWG: {e}")

if __name__ == "__main__":
    inspect_excel()
    # inspect_dwg() # Só rodar se ezdxf estiver instalado, vou checar no próximo passo
