/**
 * Formatação de anotações normativas de cabos para o diagrama unifilar.
 *
 * A NT.00020.EQTL seção 5.12.2(c) exige que o diagrama mostre bitola de
 * cabos em mm², e implicitamente adota o formato ABNT/IEC:
 *
 *   N#Smm² <ISOLAÇÃO> <TEMP> / <TENSÃO> Classe <N>
 *
 * Exemplos das Figuras 5 e 7 da norma:
 *   3#10mm² PVC 70°C 0,6/1kV Classe 2
 *   2#6mm² CA (F/N) XLPO / Poliolefina 1.8kV Classe 5
 *   1#6 mm² PVC 70° / 750V CLASSE 5
 *
 * Este módulo padroniza esse formato para que todos os trechos de cabo
 * no diagrama usem a mesma notação, evitando inconsistências.
 */

/**
 * Tipo de circuito — CC (corrente contínua, lado dos módulos) ou
 * CA (corrente alternada, lado do inversor/rede).
 */
export type CircuitType = 'CC' | 'CA';

/**
 * Descrição normalizada de um trecho de cabo.
 */
export interface CableSpec {
  /** Quantidade de condutores no trecho. */
  count: number;
  /** Bitola em mm² (ex: 10, 6, 2.5). */
  gauge: number;
  /** Tipo de isolação (PVC, XLPE, XLPO/Poliolefina, EPR, ...). */
  insulation: string;
  /** Temperatura nominal de trabalho em °C. */
  temperatureC?: number;
  /** Tensão de isolação — formato livre, ex: "0,6/1kV", "750V", "1.8kV". */
  voltage: string;
  /** Classe de encordoamento (geralmente 2 para rígido, 5 para flexível). */
  class?: number;
  /** Identificação opcional de fases — ex: "F/N", "F/F/N", "(+/-)". */
  phaseMarkers?: string;
  /** Tipo de circuito — afeta convenções de marcação. */
  circuit: CircuitType;
}

/**
 * Formata a especificação de um cabo na notação normativa padrão.
 *
 * Exemplos de saída:
 *   formatCableNotation({ count: 3, gauge: 10, insulation: 'PVC', temperatureC: 70, voltage: '0,6/1kV', class: 2, circuit: 'CA' })
 *     → "3#10mm² PVC 70°C 0,6/1kV Classe 2"
 *
 *   formatCableNotation({ count: 2, gauge: 6, insulation: 'XLPO / Poliolefina', voltage: '1.8kV', class: 5, phaseMarkers: 'F/N', circuit: 'CA' })
 *     → "2#6mm² CA (F/N) XLPO / Poliolefina 1.8kV Classe 5"
 *
 *   formatCableNotation({ count: 2, gauge: 6, insulation: 'XLPO / Poliolefina', voltage: '1.8kV', class: 5, phaseMarkers: '+/-', circuit: 'CC' })
 *     → "2#6mm² CC (+/-) XLPO / Poliolefina 1.8kV Classe 5"
 */
export function formatCableNotation(spec: CableSpec): string {
  const parts: string[] = [];

  // Parte 1: quantidade e bitola — sempre presente.
  parts.push(`${spec.count}#${formatGauge(spec.gauge)}mm²`);

  // Parte 2: identificação de circuito e fases — quando relevante.
  // CC com polaridade ou CA com identificação F/N explícita são comuns
  // quando há ambiguidade visual, caso contrário omite-se.
  if (spec.phaseMarkers) {
    parts.push(`${spec.circuit} (${spec.phaseMarkers})`);
  }

  // Parte 3: isolação com temperatura se fornecida.
  if (spec.temperatureC !== undefined) {
    parts.push(`${spec.insulation} ${spec.temperatureC}°C`);
  } else {
    parts.push(spec.insulation);
  }

  // Parte 4: tensão de isolação.
  parts.push(spec.voltage);

  // Parte 5: classe de encordoamento.
  if (spec.class !== undefined) {
    parts.push(`Classe ${spec.class}`);
  }

  return parts.join(' ');
}

/**
 * Formata a bitola removendo decimais desnecessários.
 *
 * 10   → "10"
 * 2.5  → "2,5"  (vírgula decimal no padrão brasileiro)
 * 1.5  → "1,5"
 */
function formatGauge(gauge: number): string {
  if (Number.isInteger(gauge)) {
    return gauge.toString();
  }
  return gauge.toString().replace('.', ',');
}

/**
 * Presets de cabos comumente usados em projetos de microgeração Grupo B.
 * Derivados diretamente da Figura 5 da NT.00020.EQTL.
 */
export const CABLE_PRESETS = {
  /** Entrada da rede — ramal trifásico padrão até 300A. */
  entradaRedeTrifasica10mm: (): CableSpec => ({
    count: 3,
    gauge: 10,
    insulation: 'PVC',
    temperatureC: 70,
    voltage: '0,6/1kV',
    class: 2,
    circuit: 'CA',
  }),

  /** Cabo CC típico de string FV, microgeração residencial. */
  stringFV6mm: (): CableSpec => ({
    count: 2,
    gauge: 6,
    insulation: 'XLPO / Poliolefina',
    voltage: '1,8kV',
    class: 5,
    phaseMarkers: '+/-',
    circuit: 'CC',
  }),

  /** Saída CA do microinversor — fase + neutro. */
  saidaMicroinversor6mm: (): CableSpec => ({
    count: 2,
    gauge: 6,
    insulation: 'XLPO / Poliolefina',
    voltage: '1,8kV',
    class: 5,
    phaseMarkers: 'F/N',
    circuit: 'CA',
  }),

  /** Condutor de aterramento típico. */
  aterramento10mm: (): CableSpec => ({
    count: 1,
    gauge: 10,
    insulation: 'PVC',
    temperatureC: 70,
    voltage: '0,6/1kV',
    class: 2,
    circuit: 'CA',
  }),
} as const;
