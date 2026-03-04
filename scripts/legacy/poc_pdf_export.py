import ezdxf
from ezdxf.addons.drawing import matplotlib
import matplotlib.pyplot as plt
import os

INPUT_DXF = "c:/Users/fulvi/OneDrive/Agentes - Antigravity/Fóton/POC_RESULTADO.dxf"
OUTPUT_PDF = "c:/Users/fulvi/OneDrive/Agentes - Antigravity/Fóton/POC_RESULTADO.pdf"

def run_pdf_poc():
    if not os.path.exists(INPUT_DXF):
        print("DXF modificado não encontrado. Rode o passo anterior.")
        return

    try:
        print(f"Convertendo {INPUT_DXF} para PDF...")
        doc = ezdxf.readfile(INPUT_DXF)
        msp = doc.modelspace()
        
        # Configurar plotagem
        fig = plt.figure()
        ax = fig.add_axes([0, 0, 1, 1])
        ctx = matplotlib.RenderContext(doc)
        out = matplotlib.MatplotlibBackend(ax)
        
        # Renderizar
        matplotlib.qsave(doc.modelspace(), OUTPUT_PDF)
        print(f"PDF salvo em: {OUTPUT_PDF}")

    except Exception as e:
        print(f"Erro na exportação PDF: {e}")

if __name__ == "__main__":
    run_pdf_poc()
