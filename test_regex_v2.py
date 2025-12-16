import re

data_lines = [
    "10 Módulos Fotovoltaicos de 700W cada 1 arranjo de 6 módulos e 1 de 4 módulos Potência Total: 7,00 kWp",
    "3 Microinversor Fotovoltaico: Foxess 2,5Kw - Monofásico 220V",
    "Quadro de Proteção CA: 2x DPS 20kA/45kA 275 Vac 2x Disjuntores Monopolar 25A e 1x de 40A",
    "Endereço: RUA UNIÃO, QD.171, LT.15 CEP: 74465-460",
    "Cliente: ADÃO MARCELINO DA SILVA"
]

def parse_solar_data(lines):
    info = {}
    
    # Estratégia: Juntar todas as linhas para facilitar regex multi-linha ou parciais
    full_text = " || ".join(lines)
    
    # 1. Dados do Cliente (Simulação, pois no Excel real eles estão em células específicas ou soltos)
    # Por enquanto vamos focar no técnico que é mais difícil
    
    # 2. Módulos e Potência
    mod_match = re.search(r'(\d+)\s*Módulos.*?de\s*(\d+)W', full_text, re.IGNORECASE)
    if mod_match:
        info['qtd_modulos'] = mod_match.group(1)
        info['potencia_modulo'] = mod_match.group(2)
        
    pot_match = re.search(r'Potência Total:\s*([\d,]+)\s*kWp', full_text, re.IGNORECASE)
    if pot_match:
        info['potencia_total'] = pot_match.group(1) # Mantendo string com vírgula para preservar formato BR

    # 3. Arranjos (Strings)
    # Procurar padrão "X arranjo de Y" possivelmente seguido de "e Z de W"
    # Simplificação: procurar todos os números que antecedem "módulo" ou "módulos" num contexto de arranjo
    if "arranjo" in full_text.lower():
        # Captura "6 módulos" , "4 módulos" que aparecem após a palavra "arranjo"
        # Isso é um pouco frágil, vamos tentar algo mais especifico para a frase do Adão
        # "1 arranjo de 6 módulos e 1 de 4 módulos"
        
        # Regex captura: (número) (palavra opcional) "módulos"
        strings = re.findall(r'(?:de\s*)?(\d+)\s*módulo[s]?', full_text.split("arranjo")[1], re.IGNORECASE)
        info['strings_detalhe'] = [int(s) for s in strings if s.isdigit()]

    # 4. Inversor
    inv_match = re.search(r'(\d+)\s*Microinversor.*:\s*([^\|]+)', full_text, re.IGNORECASE)
    if inv_match:
        info['qtd_inversores'] = inv_match.group(1)
        info['modelo_inversor'] = inv_match.group(2).strip().replace(" - Monofásico 220V", "")

    return info

parsed = parse_solar_data(data_lines)
print("Dados Extraídos V2:")
print(parsed)
