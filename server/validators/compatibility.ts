/**
 * Validações de compatibilidade entre módulos fotovoltaicos e inversores
 */

export interface CompatibilityIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

export interface ModuleData {
  voc: string; // Tensão de circuito aberto (V)
  isc: string; // Corrente de curto-circuito (A)
  vmpp: string; // Tensão no ponto de máxima potência (V)
  impp: string; // Corrente no ponto de máxima potência (A)
  nominalPower: number; // Potência nominal (W)
}

export interface InverterData {
  maxVoltageDC?: string; // Tensão máxima de entrada (V)
  maxCurrentDC?: string; // Corrente de curto-circuito máxima (A)
  mpptVoltageMax?: string; // Faixa MPPT máxima (V)
  mpptVoltageMin?: string; // Faixa MPPT mínima (V)
  startupVoltageDC?: string; // Tensão de partida (V)
  nominalPowerDC?: number; // Potência nominal DC (W)
  maxPowerDC?: number; // Potência máxima DC (W)
  nominalPowerAC: number; // Potência nominal AC (W)
  numberOfMppt?: number; // Quantidade de MPPTs
  numberOfStrings?: number; // Quantidade de entradas CC
  maxCurrentPerInput?: string; // Corrente máxima por entrada (A)
  isMicroinverter?: boolean | number; // boolean do frontend, number (0/1) do banco
}

/**
 * Valida compatibilidade entre módulos e inversor
 */
export function validateModuleInverterCompatibility(
  modules: ModuleData[],
  modulesPerString: number,
  numberOfStrings: number,
  inverter: InverterData,
  invertersQuantity: number = 1
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  if (modules.length === 0) {
    return issues;
  }

  // Usar o primeiro módulo como referência (assumindo que todos são iguais)
  const module = modules[0];

  // Converter strings para números
  const moduleVoc = parseFloat(module.voc);
  const moduleIsc = parseFloat(module.isc);
  const moduleVmpp = parseFloat(module.vmpp);
  const moduleImpp = parseFloat(module.impp);

  const inverterMaxVdc = inverter.maxVoltageDC ? parseFloat(inverter.maxVoltageDC) : null;
  const inverterMaxIdc = inverter.maxCurrentDC ? parseFloat(inverter.maxCurrentDC) : null;
  const inverterMpptMax = inverter.mpptVoltageMax ? parseFloat(inverter.mpptVoltageMax) : null;
  const inverterMpptMin = inverter.mpptVoltageMin ? parseFloat(inverter.mpptVoltageMin) : null;
  const inverterStartupV = inverter.startupVoltageDC ? parseFloat(inverter.startupVoltageDC) : null;
  const inverterMaxCurrentPerInput = inverter.maxCurrentPerInput ? parseFloat(inverter.maxCurrentPerInput) : null;

  // Detectar se é microinversor (pode vir como 1/0 do banco ou true/false do formulário)
  const isMicroinverter = inverter.isMicroinverter === 1 || inverter.isMicroinverter === true || String(inverter.isMicroinverter) === "1" || String(inverter.isMicroinverter) === "true";

  // Para microinversores, cada saída opera com 1 módulo independente
  // Portanto, não há conexão em série e modulesPerString deve ser sempre 1
  const effectiveModulesPerString = isMicroinverter ? 1 : modulesPerString;

  // 1. Validar tensão máxima de circuito aberto
  const stringVoc = moduleVoc * effectiveModulesPerString;
  if (inverterMaxVdc && stringVoc > inverterMaxVdc) {
    issues.push({
      type: 'error',
      field: 'voltage',
      message: isMicroinverter
        ? `Tensão de circuito aberto do módulo (${stringVoc.toFixed(1)}V) excede a tensão máxima do inversor (${inverterMaxVdc}V).`
        : `Tensão de circuito aberto da string (${stringVoc.toFixed(1)}V) excede a tensão máxima do inversor (${inverterMaxVdc}V). Reduza o número de módulos por string.`
    });
  }

  // 2. Validar faixa MPPT
  const stringVmpp = moduleVmpp * effectiveModulesPerString;
  if (inverterMpptMax && stringVmpp > inverterMpptMax) {
    issues.push({
      type: 'error',
      field: 'mppt',
      message: `Tensão MPPT da string (${stringVmpp.toFixed(1)}V) excede a faixa MPPT máxima do inversor (${inverterMpptMax}V).`
    });
  }
  if (inverterMpptMin && stringVmpp < inverterMpptMin) {
    issues.push({
      type: 'warning',
      field: 'mppt',
      message: `Tensão MPPT da string (${stringVmpp.toFixed(1)}V) está abaixo da faixa MPPT mínima do inversor (${inverterMpptMin}V). O sistema pode não operar com eficiência máxima.`
    });
  }

  // 3. Validar tensão de partida
  if (inverterStartupV && stringVmpp < inverterStartupV) {
    issues.push({
      type: 'error',
      field: 'startup',
      message: `Tensão MPPT da string (${stringVmpp.toFixed(1)}V) está abaixo da tensão de partida do inversor (${inverterStartupV}V). O inversor não irá ligar.`
    });
  }

  // 4. Validar corrente de curto-circuito
  if (inverterMaxIdc && moduleIsc > inverterMaxIdc) {
    issues.push({
      type: 'error',
      field: 'current',
      message: `Corrente de curto-circuito do módulo (${moduleIsc}A) excede a corrente máxima do inversor (${inverterMaxIdc}A).`
    });
  }

  // 4b. Validar corrente máxima por entrada (para microinversores)
  // Aplicar margem de segurança de 5% (padrão da indústria)
  if (isMicroinverter && inverterMaxCurrentPerInput) {
    const maxCurrentWithMargin = inverterMaxCurrentPerInput * 1.05;
    if (moduleIsc > maxCurrentWithMargin) {
      issues.push({
        type: 'error',
        field: 'current',
        message: `Corrente de curto-circuito do módulo (${moduleIsc}A) excede a corrente máxima por entrada do microinversor (${inverterMaxCurrentPerInput}A) considerando margem de 5%.`
      });
    }
  }

  // 5. Validar potência total
  const totalPowerDC = module.nominalPower * modulesPerString * numberOfStrings;
  const singleInverterMaxPower = inverter.maxPowerDC || inverter.nominalPowerDC || inverter.nominalPowerAC * 1.3;
  const systemInverterMaxPower = singleInverterMaxPower * invertersQuantity;

  if (singleInverterMaxPower && totalPowerDC > systemInverterMaxPower) {
    issues.push({
      type: 'warning',
      field: 'power',
      message: `Potência total dos módulos (${(totalPowerDC / 1000).toFixed(2)}kW) excede a potência máxima DC do sistema de inversor(es) (${(systemInverterMaxPower / 1000).toFixed(2)}kW). Pode haver limitação de potência.`
    });
  }

  // 6. Validar subdimensionamento (potência muito baixa)
  const singleMinRecommendedPower = inverter.nominalPowerAC * 0.7;
  const systemMinRecommendedPower = singleMinRecommendedPower * invertersQuantity;
  if (totalPowerDC < systemMinRecommendedPower) {
    issues.push({
      type: 'warning',
      field: 'power',
      message: `Potência total dos módulos (${(totalPowerDC / 1000).toFixed(2)}kW) está muito abaixo da potência nominal do sistema de inversor(es) (${((inverter.nominalPowerAC * invertersQuantity) / 1000).toFixed(2)}kW). O sistema pode operar com baixa eficiência.`
    });
  }

  // 7. Validar número de strings vs MPPTs
  if (inverter.numberOfMppt && numberOfStrings > (inverter.numberOfMppt * 2)) {
    issues.push({
      type: 'warning',
      field: 'strings',
      message: `Número de strings (${numberOfStrings}) pode exceder a capacidade do inversor (${inverter.numberOfMppt} MPPTs). Verifique a configuração.`
    });
  }

  // 8. Validar número de entradas CC
  if (inverter.numberOfStrings && numberOfStrings > inverter.numberOfStrings) {
    issues.push({
      type: 'error',
      field: 'strings',
      message: `Número de strings (${numberOfStrings}) excede o número de entradas CC do inversor (${inverter.numberOfStrings}).`
    });
  }

  return issues;
}

/**
 * Calcula o dimensionamento ideal de strings
 */
export function calculateOptimalStringSize(
  module: ModuleData,
  inverter: InverterData
): { min: number; max: number; recommended: number } {
  const moduleVoc = parseFloat(module.voc);
  const moduleVmpp = parseFloat(module.vmpp);

  const inverterMaxVdc = inverter.maxVoltageDC ? parseFloat(inverter.maxVoltageDC) : 1000;
  const inverterMpptMax = inverter.mpptVoltageMax ? parseFloat(inverter.mpptVoltageMax) : inverterMaxVdc * 0.9;
  const inverterMpptMin = inverter.mpptVoltageMin ? parseFloat(inverter.mpptVoltageMin) : 100;
  const inverterStartupV = inverter.startupVoltageDC ? parseFloat(inverter.startupVoltageDC) : inverterMpptMin;

  // Máximo de módulos baseado na tensão de circuito aberto
  const maxByVoc = Math.floor(inverterMaxVdc / moduleVoc);

  // Máximo de módulos baseado na faixa MPPT
  const maxByMppt = Math.floor(inverterMpptMax / moduleVmpp);

  // Mínimo de módulos baseado na tensão de partida
  const minByStartup = Math.ceil(inverterStartupV / moduleVmpp);

  // Mínimo de módulos baseado na faixa MPPT mínima
  const minByMppt = Math.ceil(inverterMpptMin / moduleVmpp);

  const min = Math.max(minByStartup, minByMppt);
  const max = Math.min(maxByVoc, maxByMppt);

  // Recomendado: meio da faixa MPPT
  const recommended = Math.round((inverterMpptMax + inverterMpptMin) / (2 * moduleVmpp));

  return {
    min: Math.max(1, min),
    max: Math.max(1, max),
    recommended: Math.max(min, Math.min(recommended, max))
  };
}
