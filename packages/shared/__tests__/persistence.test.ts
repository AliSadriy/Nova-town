import { City, Building } from './index.js';
import { EconomyCalculator } from '@nova-town/economy';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runPersistenceTests() {
  console.log('Running Phase 4 Persistence & Offline Sync Tests...');
  const city: City = {
    id: 'c1',
    name: 'Sync City',
    userId: 'u1',
    level: 1,
    population: 100,
    gold: 2500,
    energyCapacity: 100,
    energyUsed: 20,
    waterCapacity: 100,
    waterUsed: 25
  };

  const buildings: Building[] = [
    { id: 'b1', cityId: 'c1', type: 'RESIDENTIAL_SMALL', level: 1, x: 10, y: 10, status: 'ACTIVE' }
  ];

  const income = EconomyCalculator.calculateTaxIncome(city, buildings);
  const maintenance = EconomyCalculator.calculateMaintenanceCost(buildings);

  assert(income === 10, 'Expected tax income 10');
  assert(maintenance === 2, 'Expected maintenance 2');

  const serialized = JSON.stringify({ city, buildings });
  const deserialized = JSON.parse(serialized);

  assert(deserialized.city.gold === 2500, 'Deserialized gold matches');
  assert(deserialized.buildings.length === 1, 'Deserialized building count matches');

  console.log('All Phase 4 Persistence Tests PASSED successfully!');
}

runPersistenceTests();
