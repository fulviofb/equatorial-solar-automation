import ezdxf
import os

INPUT_DXF = "c:/Users/fulvi/OneDrive/Agentes - Antigravity/Fóton/PROJETO FOXESS MICRO.dxf"
OUTPUT_DXF = "c:/Users/fulvi/OneDrive/Agentes - Antigravity/Fóton/POC_RESULTADO.dxf"

def run_poc():
    if not os.path.exists(INPUT_DXF):
        print("Template não encontrado.")
        return

    try:
        print(f"Lendo {INPUT_DXF}...")
        doc = ezdxf.readfile(INPUT_DXF)
        msp = doc.modelspace()
        
        # Mapeamento de teste
        replacements = {
            "ADÃO MARCELINO DA SILVA": "CLIENTE TESTE AUTOMATICO",
            "7,00 kWp": "99,9 kWp",
            "RUA UNIÃO, QD.171, LT.15": "RUA DOS BOBOS, Nº 0"
        }
        
        count = 0
        for entity in msp.query('TEXT MTEXT'):
            # Lógica para TEXT
            if entity.dxftype() == 'TEXT':
                txt = entity.dxf.text
                for old, new in replacements.items():
                    if old in txt:
                        entity.dxf.text = txt.replace(old, new)
                        print(f"Replaced [TEXT]: '{old}' -> '{new}'")
                        count += 1
                        
            # Lógica para MTEXT (mais complexo pois tem formatação)
            elif entity.dxftype() == 'MTEXT':
                txt = entity.text
                # MTEXT puro sem formatação para busca
                for old, new in replacements.items():
                    if old in txt:
                        # Substituição simples (pode quebrar formatação complexa, mas para nomes costuma funcionar)
                        entity.text = txt.replace(old, new)
                        print(f"Replaced [MTEXT]: '{old}' -> '{new}'")
                        count += 1

        print(f"Total de substituições: {count}")
        doc.saveas(OUTPUT_DXF)
        print(f"Salvo em: {OUTPUT_DXF}")

    except Exception as e:
        print(f"Erro na POC: {e}")

if __name__ == "__main__":
    run_poc()
