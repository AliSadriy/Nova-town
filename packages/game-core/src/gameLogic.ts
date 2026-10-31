import { City, Building, PlayerId, CityId, GameTransaction } from '@nova-town/shared';
import { EconomyCalculator, BUILDING_CONFIGS } from '@nova-town/economy';
import { v4 as uuidv4 } from 'uuid';

export const GameLogic = {
  createCity: (
    name: string,
    ownerId: PlayerId,
    initialBalance: number = 1000
  ): City => {
    return {
      id: uuidv4() as CityId,
      name,
      userId: ownerId,
      level: 1,
      population: 0,
      gold: initialBalance,
      energyCapacity: 100,
      energyUsed: 0,
      waterCapacity: 100,
      waterUsed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  placeBuilding: (
    city: City,
    buildingType: keyof typeof BUILDING_CONFIGS,
    x: number,
    y: number
  ): Building => {
    return {
      id: uuidv4(),
      cityId: city.id,
      type: buildingType,
      level: 1,
      x: x,
      y: y,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  collectTax: (
    city: City,
    buildings: Building[]
  ): { city: City; transaction: GameTransaction } => {
    const taxIncome = EconomyCalculator.calculateTaxIncome(city, buildings);
    const updatedCity: City = {
      ...city,
      gold: city.gold + taxIncome,
      updatedAt: new Date().toISOString()
    };

    const transaction: GameTransaction = {
      id: uuidv4(),
      cityId: city.id,
      type: 'tax_collection',
      amount: taxIncome,
      timestamp: new Date(),
      status: 'completed'
    };

    return { city: updatedCity, transaction };
  }
};

export default GameLogic;
