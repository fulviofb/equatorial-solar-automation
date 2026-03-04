import pandas as pd
import re

data_lines = [
    "10 Módulos Fotovoltaicos de 700W cada 1 arranjo de 6 módulos e 1 de 4 módulos Potência Total: 7,00 kWp",
    "3 Microinversor Fotovoltaico: Foxess 2,5Kw - Monofásico 220V",
    "Quadro de Proteção CA: 2x DPS 20kA/45kA 275 Vac 2x Disjuntores Monopolar 25A e 1x de 40A"
]

def parse_solar_data(lines):
    info = {}
    
    for line in lines:
        # Módulos e Potência
        if "Módulos" in line:
            mod_match = re.search(r'(\d+)\s*Módulos.*de\s*(\d+)W', line, re.IGNORECASE)
            if mod_match:
                info['qtd_modulos'] = int(mod_match.group(1))
                info['potencia_modulo'] = int(mod_match.group(2))
            
            # Arranjos (Strings)
            # Regex para pegar "1 arranjo de X módulos"
            arranjos = re.findall(r'(\d+)\s*arranjo[s]?\s*de\s*(\d+)\s*módulo[s]?', line, re.IGNORECASE)
            if arranjos:
                info['strings'] = [{'qtd_strings': int(qtd), 'mods_per_string': int(num)} for qtd, num in arranjos]
                
            # Potencia Total
            pot_match = re.search(r'Potência Total:\s*([\d,]+)\s*kWp', line, re.IGNORECASE)
            if pot_match:
                info['potencia_total'] = pot_match.group(1)

        # Inversor
        if "Inversor" in line:
            inv_match = re.search(r'(\d+)\s*Microinversor.*:\s*(.*)', line, re.IGNORECASE)
            if inv_match:
                info['qtd_inversores'] = int(inv_match.group(1))
                info['modelo_inversor'] = inv_match.group(2).strip()

    return info

parsed = parse_solar_data(data_lines)
print("Dados Extraídos:")
print(parsed)
