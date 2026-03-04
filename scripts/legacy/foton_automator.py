import pandas as pd
import ezdxf
from ezdxf.addons.drawing import Frontend, RenderContext
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
import matplotlib.pyplot as plt
import re
import os
import sys

# Configurações de Arquivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DXF = os.path.join(BASE_DIR, "PROJETO FOXESS MICRO.dxf")
EXCEL_FILE = os.path.join(BASE_DIR, "Diagrama de Blocos - Adão.xlsx") # Padrao, pode mudar
OUTPUT_DIR = os.path.join(BASE_DIR, "Projetos_Gerados")

# Dados do "Template" (Valores que estão no DXF original e serão substituídos)
# Estas chaves devem bater EXATAMENTE com o texto que está no DWG/DXF do Adão
PLACEHOLDERS = {
    'nome_cliente': 'ADÃO MARCELINO DA SILVA',
    'endereco_rua': 'RUA UNIÃO, QD.171, LT.15',
    'cep': '74465-460',
    'cpf_cnpj': '269.191.501-82',
    'potencia_total': '7,00 kWp',
    'qtd_modulos': '10 Módulos',   # Substituir a frase para evitar trocar números isolados
    'modelo_inversor': 'FOXESS Q1-2500-E', # Exemplo encontrado no DXF
    # Adicione mais conforme necessário
}

def load_excel_data(filepath):
    """
    Lê o Excel desestruturado e retorna um dicionário com os novos dados.
    """
    print(f"Lendo Excel: {filepath}")
    try:
        # Lê todas as linhas da coluna B (índice 1) onde costumam estar os dados
        df = pd.read_excel(filepath, header=None)
        
        # Concatena todo o texto relevante para busca via Regex
        content_lines = df.iloc[:, 1].dropna().astype(str).tolist()
        # Usar um delimitador que não seja pipe simples para evitar confusão, ou regex mais seguro
        full_text = " || ".join(content_lines)
        
        print(f"Texto extraído (resumo): {full_text[:150]}...")
        
        data = {}

        # 1. Nome do Cliente - Tentativa Inteligente via Nome de Arquivos na Pasta
        # Procura arquivos PDF ou DOCX que não sejam datasheets e contenham nomes de pessoas
        # Ignora "DATASHEET", "PROJETO", "ORCAMENTO"
        pasta_projeto = os.path.dirname(filepath)
        possiveis_nomes = []
        for f in os.listdir(pasta_projeto):
            if f.lower().endswith(('.pdf', '.docx')) and not f.lower().startswith(('datasheet', 'projeto', 'nt.', 'diagrama')):
                # Limpar extensão e palavras comuns
                clean_name = os.path.splitext(f)[0]
                clean_name = clean_name.replace("Documento", "").replace("ProcuracaoPessoaFisica-", "").strip()
                if len(clean_name) > 5: # Evitar lixo
                    possiveis_nomes.append(clean_name)
        
        if possiveis_nomes:
            # Pega o primeiro candidato razoável (ex: "Adão Marcelino da Silva")
            # Converte para maiúsculo pois no DXF costuma ser assim
            data['nome_cliente'] = possiveis_nomes[0].upper()
            print(f"Nome do cliente inferido do arquivo: {data['nome_cliente']}")
        
        # 2. Dados Técnicos
        
        # Potência Total
        pot_match = re.search(r'Potência Total:\s*([\d,]+)\s*kWp', full_text, re.IGNORECASE)
        if pot_match:
            data['potencia_total'] = f"{pot_match.group(1)} kWp"
            
        # Módulos
        mod_match = re.search(r'(\d+)\s*Módulos', full_text, re.IGNORECASE)
        if mod_match:
            data['qtd_modulos'] = f"{mod_match.group(1)} Módulos"
            
        # Inversor - Regex corrigido para não ser guloso (.*? em vez de .*)
        # E parar antes do próximo delimitador ||
        inv_match = re.search(r'Microinversor.*?:\s*([^\|]+)', full_text, re.IGNORECASE)
        if inv_match:
            inv_text = inv_match.group(1).strip()
            inv_text = inv_text.split('-')[0].strip()
            data['modelo_inversor'] = inv_text

        return data


    except Exception as e:
        print(f"Erro ao ler Excel: {e}")
        return {}

def process_dxf(data_dict, output_path):
    """
    Abre o Template DXF, substitui os placeholders pelos valores do data_dict, e salva.
    """
    if not os.path.exists(TEMPLATE_DXF):
        print(f"Erro: Template {TEMPLATE_DXF} não encontrado.")
        return False
        
    print(f"Processando DXF...")
    try:
        doc = ezdxf.readfile(TEMPLATE_DXF)
        msp = doc.modelspace()
        
        replacements_count = 0
        
        # Mapeia o que temos (novos dados) para o que deve ser buscado (placeholders antigos)
        # Se o data_dict não tem a chave, ignora (ou mantem original)
        
        # Exemplo: data_dict['nome_cliente'] = "MARIA JOSÉ" -> Substui PLACEHOLDERS['nome_cliente'] ("ADÃO...")
        
        # Montar lista de substituições direta: { "ADÃO...": "MARIA..." }
        replace_map = {}
        for key, placeholder_val in PLACEHOLDERS.items():
            if key in data_dict:
                replace_map[placeholder_val] = data_dict[key]
        
        print(f"Mapa de substituição: {replace_map}")
        
        # Iterar sobre entidades de texto
        for entity in msp.query('TEXT MTEXT'):
            tag = entity.dxftype()
            text_content = entity.dxf.text if tag == 'TEXT' else entity.text
            
            original_text = text_content
            modified = False
            
            for old_str, new_str in replace_map.items():
                if old_str in text_content:
                    text_content = text_content.replace(old_str, new_str)
                    modified = True
            
            if modified:
                if tag == 'TEXT':
                    entity.dxf.text = text_content
                else:
                    entity.text = text_content
                # print(f" Alterado [{tag}]: {original_text[:20]}... -> {text_content[:20]}...")
                replacements_count += 1
                
        print(f"Total de alterações no DXF: {replacements_count}")
        doc.saveas(output_path)
        return True
        
    except Exception as e:
        print(f"Erro no processamento DXF: {e}")
        return False

def export_pdf(dxf_path, pdf_path):
    """
    Converte o DXF salvo para PDF.
    """
    print(f"Gerando PDF: {pdf_path}")
    try:
        doc = ezdxf.readfile(dxf_path)
        msp = doc.modelspace()
        
        fig = plt.figure(figsize=(20, 15)) # Tentar um tamanho grande A1/A0 aproximado ou deixar auto
        ax = fig.add_axes([0, 0, 1, 1])
        ctx = RenderContext(doc)
        out = MatplotlibBackend(ax)
        frontend = Frontend(ctx, out)
        
        # Desenhar
        frontend.draw_layout(msp, finalize=True)
        
        # Salvar
        fig.savefig(pdf_path, dpi=300)
        plt.close(fig)
        return True
    except Exception as e:
        print(f"Erro ao exportar PDF: {e}")
        return False

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print("--- Automação Fóton Iniciada ---")
    
    # 1. Obter dados
    new_data = load_excel_data(EXCEL_FILE)
    if not new_data:
        print("Nenhum dado extraído do Excel. Verifique o arquivo.")
        # Para teste, vamos injetar dados ficticios de um "Novo Cliente" se falhar
        print("Usando dados de teste para validação...")
        new_data = {
            'nome_cliente': 'CLIENTE EXEMPLO AUTOMATIZADO',
            'potencia_total': '15,00 kWp', 
            'qtd_modulos': '20 Módulos',
            'modelo_inversor': 'Inversor Teste 5kW'
        }
    
    # Adicionar dados manuais que talvez não estejam no Excel (simulação)
    # Se o script for usado em produção, isso viria de inputs ou outro arquivo
    if 'nome_cliente' not in new_data:
        new_data['nome_cliente'] = "CLIENTE AUTOMACAO" # Fallback
    
    print("\nDados para o novo projeto:")
    for k, v in new_data.items():
        print(f" - {k}: {v}")
        
    # Definir nomes de arquivos de saída
    safe_name = new_data.get('nome_cliente', 'Novo_Projeto').replace(' ', '_')
    dxf_out = os.path.join(OUTPUT_DIR, f"{safe_name}.dxf")
    pdf_out = os.path.join(OUTPUT_DIR, f"{safe_name}.pdf")
    
    # 2. Processar DXF
    if process_dxf(new_data, dxf_out):
        # 3. Gerar PDF
        if export_pdf(dxf_out, pdf_out):
            print(f"\nSUCESSO! Arquivos gerados em:\n{OUTPUT_DIR}")
        else:
            print("Falha na geração do PDF.")
    else:
        print("Falha na geração do DXF.")

if __name__ == "__main__":
    main()
