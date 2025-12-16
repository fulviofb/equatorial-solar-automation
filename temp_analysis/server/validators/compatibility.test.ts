import { describe, it, expect } from 'vitest';
import { validateModuleInverterCompatibility, type ModuleData, type InverterData } from './compatibility';

describe('Validação de Compatibilidade - Microinversores', () => {
  const moduleData: ModuleData = {
    voc: '48.0',
    isc: '18.5',
    vmpp: '40.0',
    impp: '17.5',
    nominalPower: 700,
  };

  const microinverterData: InverterData = {
    nominalPowerDC: 3300,
    nominalPowerAC: 3000,
    maxVoltageDC: '60',
    mpptVoltageMin: '16',
    mpptVoltageMax: '60',
    maxCurrentDC: '20',
    maxCurrentPerInput: '18',
    numberOfMppt: 3,
    numberOfStrings: 6,
    isMicroinverter: 1,
  };

  const regularInverterData: InverterData = {
    nominalPowerDC: 3300,
    nominalPowerAC: 3000,
    maxVoltageDC: '550',
    mpptVoltageMin: '50',
    mpptVoltageMax: '550',
    maxCurrentDC: '25', // Aumentado para suportar o módulo de 18.5A
    numberOfMppt: 2,
    numberOfStrings: 2,
    isMicroinverter: 0,
  };

  it('deve validar microinversor com 6 módulos (1 por saída) - apenas warning de oversizing', () => {
    const issues = validateModuleInverterCompatibility(
      [moduleData],
      1, // 1 módulo por string (cada saída opera independentemente)
      6, // 6 strings (saídas)
      microinverterData
    );

    const errors = issues.filter(i => i.type === 'error');
    const warnings = issues.filter(i => i.type === 'warning');

    // Não deve ter erros (validação de tensão/corrente passou)
    expect(errors).toHaveLength(0);
    
    // Deve ter warning de oversizing (6x700W = 4200W > 3300W)
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.message.includes('Potência total'))).toBe(true);
  });

  it('deve rejeitar microinversor se tensão individual do módulo exceder faixa MPPT', () => {
    const highVoltageModule: ModuleData = {
      ...moduleData,
      voc: '70.0', // Acima de 60V
      vmpp: '65.0',
    };

    const issues = validateModuleInverterCompatibility(
      [highVoltageModule],
      1,
      6,
      microinverterData
    );

    const errors = issues.filter(i => i.type === 'error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.message.includes('Tensão de circuito aberto'))).toBe(true);
  });

  it('deve rejeitar microinversor se corrente do módulo exceder corrente máxima por entrada', () => {
    const highCurrentModule: ModuleData = {
      ...moduleData,
      isc: '20.0', // Acima de 18A
      impp: '19.0',
    };

    const issues = validateModuleInverterCompatibility(
      [highCurrentModule],
      1,
      6,
      microinverterData
    );

    const errors = issues.filter(i => i.type === 'error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.message.includes('Corrente de curto-circuito'))).toBe(true);
  });

  it('deve validar inversor string convencional com múltiplos módulos em série', () => {
    const issues = validateModuleInverterCompatibility(
      [moduleData],
      6, // 6 módulos por string
      2, // 2 strings
      regularInverterData
    );

    // Com 6 módulos em série: Voc = 48 * 6 = 288V (dentro da faixa 50-550V)
    const errors = issues.filter(i => i.type === 'error');
    if (errors.length > 0) {
      console.log('Erros no inversor string:', JSON.stringify(errors, null, 2));
    }
    expect(errors).toHaveLength(0);
  });

  it('deve rejeitar inversor string se tensão da string exceder limite', () => {
    const issues = validateModuleInverterCompatibility(
      [moduleData],
      12, // 12 módulos por string
      2, // 2 strings
      regularInverterData
    );

    // Com 12 módulos em série: Voc = 48 * 12 = 576V (acima de 550V)
    const errors = issues.filter(i => i.type === 'error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.message.includes('Tensão de circuito aberto'))).toBe(true);
  });

  it('deve avisar se potência total exceder potência máxima do microinversor', () => {
    const issues = validateModuleInverterCompatibility(
      [moduleData],
      1,
      6, // 6 saídas com 1 módulo cada = 6 módulos de 700W = 4200W
      microinverterData // 3300W nominal
    );

    // Potência total (4200W) > Potência nominal (3300W)
    const warnings = issues.filter(i => i.type === 'warning');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.message.includes('Potência total'))).toBe(true);
  });
});
