import { EconomyCalculator, BUILDING_CONFIGS } from '@nova-town/economy';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runEconomyTests() {
  console.log('Running Phase 3 Economy Tests...');
  const buildings = [
    { type: 'RESIDENTIAL_SMALL' },
    { type: 'COMMERCIAL_SHOP' },
    { type: 'INDUSTRIAL_FACTORY' }
  ];

  const income = EconomyCalculator.calculateTaxIncome({}, buildings as any);
  const maintenance = EconomyCalculator.calculateMaintenanceCost(buildings as any);

  assert(income === 10 + 25 + 80, `Expected total income 115, got ${income}`);
  assert(maintenance === 2 + 5 + 15, `Expected total maintenance 22, got ${maintenance}`);

  console.log('All Phase 3 Economy Tests PASSED successfully!');
}

runEconomyTests();
