import { validateModuleInverterCompatibility } from './server/validators/compatibility';

// Simular dados de um projeto real com microinversor Tsuness MX3000D
const modules = [
  {
    voc: '48.0',
    isc: '18.5',
    vmpp: '40.0',
    impp: '17.5',
    nominalPower: 700
  }
];

const modulesPerString = 1; // Microinversor: 1 módulo por saída
const numberOfStrings = 6; // 6 saídas independentes

const inverter = {
  maxVoltageDC: '60',
  maxCurrentDC: '20',
  mpptVoltageMax: '60',
  mpptVoltageMin: '16',
  startupVoltageDC: '22',
  nominalPowerDC: 3300,
  maxPowerDC: 3600,
  nominalPowerAC: 3000,
  numberOfMppt: 3,
  numberOfStrings: 6,
  isMicroinverter: true, // CAMPO CRÍTICO
  maxCurrentPerInput: '18' // CAMPO CRÍTICO
};

console.log('=== Teste de Validação de Microinversor ===\n');
console.log('Configuração:');
console.log(`- Módulos: ${modules.length} tipo(s)`);
console.log(`- Módulos por string: ${modulesPerString}`);
console.log(`- Número de strings: ${numberOfStrings}`);
console.log(`- Total de módulos: ${modulesPerString * numberOfStrings}`);
console.log(`- É microinversor: ${inverter.isMicroinverter}`);
console.log(`- Corrente máxima por entrada: ${inverter.maxCurrentPerInput}A\n`);

const issues = validateModuleInverterCompatibility(
  modules,
  modulesPerString,
  numberOfStrings,
  inverter
);

console.log('=== Resultado da Validação ===\n');

if (issues.length === 0) {
  console.log('✅ NENHUM PROBLEMA ENCONTRADO!\n');
} else {
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  
  if (errors.length > 0) {
    console.log(`❌ ERROS (${errors.length}):`);
    errors.forEach(err => {
      console.log(`   - [${err.field}] ${err.message}`);
    });
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  AVISOS (${warnings.length}):`);
    warnings.forEach(warn => {
      console.log(`   - [${warn.field}] ${warn.message}`);
    });
    console.log('');
  }
}

// Verificar se ainda está calculando tensão em série (erro antigo)
const hasStringVoltageError = issues.some(i => 
  i.message.includes('288.0V') || i.message.includes('240.0V')
);

if (hasStringVoltageError) {
  console.log('🔴 FALHA: Ainda está calculando tensão em série!\n');
  process.exit(1);
} else {
  console.log('✅ SUCESSO: Validação de microinversor funcionando corretamente!\n');
  process.exit(0);
}
