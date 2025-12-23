#!/usr/bin/env python3
"""
Script para limpar formatações ocultas das tags do docxtemplater no template Word.
Remove runs intermediários que quebram as tags.
"""

import zipfile
import re
from pathlib import Path
import xml.etree.ElementTree as ET

# Namespaces do Word XML
NAMESPACES = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
}

# Registrar namespaces para preservar prefixos
for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix, uri)

def extract_text_from_paragraph(para):
    """Extrai todo o texto de um parágrafo, incluindo runs."""
    texts = []
    for elem in para.iter():
        if elem.tag == f"{{{NAMESPACES['w']}}}t":
            if elem.text:
                texts.append(elem.text)
    return ''.join(texts)

def clean_tags_in_paragraph(para):
    """Limpa tags quebradas em um parágrafo."""
    # Extrair texto completo
    full_text = extract_text_from_paragraph(para)
    
    # Verificar se há tags
    if '{' not in full_text or '}' not in full_text:
        return False
    
    # Encontrar todas as tags
    tag_pattern = r'\{[#/]?[\w_]+\}'
    tags = re.findall(tag_pattern, full_text)
    
    if not tags:
        return False
    
    print(f"  Encontrado texto: {full_text[:100]}...")
    print(f"  Tags encontradas: {tags}")
    
    # Remover todos os runs existentes
    runs = para.findall(f".//{{{NAMESPACES['w']}}}r")
    for run in runs:
        para.remove(run)
    
    # Criar um único run com o texto completo
    new_run = ET.SubElement(para, f"{{{NAMESPACES['w']}}}r")
    new_text = ET.SubElement(new_run, f"{{{NAMESPACES['w']}}}t")
    new_text.set(f"{{{NAMESPACES['w']}}}space", "preserve")
    new_text.text = full_text
    
    print(f"  ✓ Parágrafo limpo")
    return True

def fix_word_template(input_path, output_path):
    """Corrige template Word removendo formatações que quebram tags."""
    print(f"\n=== Corrigindo Template Word ===")
    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    
    # Extrair documento
    with zipfile.ZipFile(input_path, 'r') as zip_in:
        # Ler document.xml
        doc_xml = zip_in.read('word/document.xml')
        
        # Parse XML
        tree = ET.ElementTree(ET.fromstring(doc_xml))
        root = tree.getroot()
        
        # Processar todos os parágrafos
        paragraphs = root.findall(f".//{{{NAMESPACES['w']}}}p")
        print(f"\nEncontrados {len(paragraphs)} parágrafos")
        
        fixed_count = 0
        for i, para in enumerate(paragraphs):
            if clean_tags_in_paragraph(para):
                fixed_count += 1
        
        print(f"\n✓ {fixed_count} parágrafos corrigidos")
        
        # Salvar XML modificado
        modified_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
        
        # Criar novo arquivo Word
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zip_out:
            # Copiar todos os arquivos exceto document.xml
            for item in zip_in.namelist():
                if item != 'word/document.xml':
                    zip_out.writestr(item, zip_in.read(item))
            
            # Escrever document.xml modificado
            zip_out.writestr('word/document.xml', modified_xml)
    
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
