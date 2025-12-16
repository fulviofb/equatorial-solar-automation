#!/usr/bin/env python3
"""
Script ROBUSTO para limpar TODAS as formatações ocultas das tags do docxtemplater.
Remove runs intermediários que quebram as tags em TODO o documento.
"""

import zipfile
import re
from pathlib import Path

def fix_broken_tags(xml_content):
    """
    Corrige tags quebradas no XML do Word.
    Tags podem estar quebradas por runs (<w:r>) intermediários.
    """
    
    # Padrão para encontrar tags quebradas entre runs
    # Exemplo: <w:r><w:t>{nome</w:t></w:r><w:r><w:t>_cliente}</w:t></w:r>
    # Deve virar: <w:r><w:t>{nome_cliente}</w:t></w:r>
    
    # Estratégia: Extrair todo o texto, encontrar tags completas, e reconstruir
    
    # 1. Encontrar todos os blocos de texto dentro de runs
    text_pattern = r'<w:r[^>]*>.*?</w:r>'
    
    def clean_run_block(match):
        """Limpa um bloco de runs consecutivos que podem conter tags quebradas."""
        block = match.group(0)
        
        # Extrair todo o texto do bloco
        text_parts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', block)
        full_text = ''.join(text_parts)
        
        # Se não há tags, retornar original
        if '{' not in full_text:
            return block
        
        # Verificar se há tags completas
        tag_pattern = r'\{[#/]?[\w_]+\}'
        if not re.search(tag_pattern, full_text):
            return block
        
        # Criar um único run com o texto completo
        # Preservar propriedades do primeiro run
        first_run_props = re.search(r'<w:r>(.*?)<w:t', block, re.DOTALL)
        props = first_run_props.group(1) if first_run_props else ''
        
        new_run = f'<w:r>{props}<w:t xml:space="preserve">{full_text}</w:t></w:r>'
        return new_run
    
    # Processar blocos de runs consecutivos
    # Encontrar sequências de runs que podem conter tags quebradas
    modified = xml_content
    
    # Padrão mais agressivo: encontrar qualquer sequência de runs que contenha partes de tags
    # Procurar por runs consecutivos que juntos formam uma tag
    run_sequence_pattern = r'(<w:r[^>]*>.*?</w:r>)+'
    
    # Função para processar sequências de runs
    def process_run_sequence(match):
        sequence = match.group(0)
        
        # Extrair todo o texto da sequência
        text_parts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', sequence)
        full_text = ''.join(text_parts)
        
        # Se não há caracteres de tag, retornar original
        if '{' not in full_text and '}' not in full_text:
            return sequence
        
        # Se há tags completas, consolidar em um único run
        tag_chars = ['{', '}', '#', '/']
        if any(char in full_text for char in tag_chars):
            # Extrair propriedades do primeiro run (para preservar formatação básica)
            first_run = re.search(r'<w:r>(.*?)</w:r>', sequence, re.DOTALL)
            if first_run:
                # Criar run simplificado
                new_run = f'<w:r><w:t xml:space="preserve">{full_text}</w:t></w:r>'
                return new_run
        
        return sequence
    
    # Aplicar limpeza em parágrafos
    # Encontrar todos os parágrafos
    para_pattern = r'<w:p[^>]*>(.*?)</w:p>'
    
    def clean_paragraph(match):
        para_content = match.group(1)
        para_tag = match.group(0)[:match.group(0).index('>') + 1]
        
        # Extrair todo o texto do parágrafo
        text_parts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', para_content)
        full_text = ''.join(text_parts)
        
        # Se não há tags, retornar original
        if '{' not in full_text:
            return match.group(0)
        
        # Se há tags, consolidar em um único run
        tag_pattern = r'\{[#/]?[\w_]+\}'
        if re.search(tag_pattern, full_text):
            # Extrair propriedades do parágrafo (pPr)
            ppr_match = re.search(r'<w:pPr>.*?</w:pPr>', para_content, re.DOTALL)
            ppr = ppr_match.group(0) if ppr_match else ''
            
            # Criar parágrafo limpo
            new_para = f'{para_tag}{ppr}<w:r><w:t xml:space="preserve">{full_text}</w:t></w:r></w:p>'
            return new_para
        
        return match.group(0)
    
    # Aplicar limpeza
    modified = re.sub(para_pattern, clean_paragraph, xml_content, flags=re.DOTALL)
    
    return modified

def fix_word_template(input_path, output_path):
    """Corrige template Word removendo formatações que quebram tags."""
    print(f"\n=== Corrigindo Template Word (V2 - ROBUSTO) ===")
    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    
    # Extrair documento
    with zipfile.ZipFile(input_path, 'r') as zip_in:
        # Ler document.xml
        doc_xml = zip_in.read('word/document.xml').decode('utf-8')
        
        print(f"\nTamanho original do XML: {len(doc_xml)} bytes")
        
        # Aplicar correções
        modified_xml = fix_broken_tags(doc_xml)
        
        print(f"Tamanho modificado do XML: {len(modified_xml)} bytes")
        
        # Contar tags encontradas
        tags = re.findall(r'\{[#/]?[\w_]+\}', modified_xml)
        print(f"\n✓ Tags encontradas no documento final: {len(tags)}")
        print(f"Tags: {set(tags)}")
        
        # Criar novo arquivo Word
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zip_out:
            # Copiar todos os arquivos exceto document.xml
            for item in zip_in.namelist():
                if item != 'word/document.xml':
                    zip_out.writestr(item, zip_in.read(item))
            
            # Escrever document.xml modificado
            zip_out.writestr('word/document.xml', modified_xml.encode('utf-8'))
    
    print(f"\n✓ Template corrigido salvo em: {output_path}")

if __name__ == '__main__':
    base_dir = Path(__file__).parent / 'server' / 'python_modules'
    input_file = base_dir / 'TEMPLATE_MEMORIAL_TAGGED.docx'
    output_file = base_dir / 'TEMPLATE_MEMORIAL_CLEAN.docx'
    
    if not input_file.exists():
        print(f"❌ Arquivo não encontrado: {input_file}")
        exit(1)
    
    fix_word_template(str(input_file), str(output_file))
    print("\n✅ Concluído!")
